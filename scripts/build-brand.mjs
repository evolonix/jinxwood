// Generates every brand image the site serves from the source art in
// brand/source/. Output is committed, so this only needs to run when the art
// changes:
//
//   npm run build:brand              regenerate everything
//   npm run build:brand -- --preview also write brand/preview.png, a contact
//                                    sheet of each cut-out over night, parchment,
//                                    the hero art and magenta, for fringe review
//
// The logo exists only as flat rasters on solid backgrounds: the emblem, in a
// drawing of the whole logo, and the lettering, in a drawing of the wordmark by
// itself. So the first job is cutting those out, and the second is putting the
// logo together from them, for dark backgrounds and for light. The rest is
// resizing: hero sizes, icons, the social image and press downloads.
//
// It also writes the transparent masters to brand/masters/, and the YouTube
// channel's profile picture and banner to brand/youtube/. The site does not
// serve those; the YouTube art is uploaded by hand.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = (f) => join(root, "brand/source", f);
const pub = (f) => join(root, "public", f);
const preview = process.argv.includes("--preview");

const NIGHT = "#2B1E3F";
const PARCHMENT = "#F4EDE0";

// ---------------------------------------------------------------------------
// Cut-outs
// ---------------------------------------------------------------------------

/**
 * Removes a flat background from RGB pixels and returns RGBA.
 *
 * The mask is a flood fill from the image border, never a global color key.
 * A global key would also remove artwork that happens to share the background
 * color: the eye pupils on the plum files and the sparkles on the cream one.
 * Regions that are enclosed by artwork but really are background (the bowl of
 * the "d") are listed as `holes` and filled from those seed points.
 *
 * The edge is then rebuilt, because the sources are not clean there: their
 * backgrounds carry noise, their outlines are stair-stepped, and sharpening
 * has left a dark line and then a faint light one just outside every edge.
 *
 *   1. Specks: small pieces of "artwork" that touch nothing are noise that
 *      crossed the tolerance, and are dropped.
 *   2. Opacity: an edge pixel is a blend of artwork and the old background, so
 *      its alpha is how far it sits between the background and the artwork
 *      color just inside it. Where those two colors are close (a dark
 *      outline on the plum background) that measure is mostly noise, and the
 *      pixel simply counts as artwork.
 *   3. Peeling: edge pixels that measure as almost all background are the
 *      sharpening lines. They become background, the edge is measured again
 *      from where the artwork really starts, and any thread of the outer line
 *      left standing alone is dropped.
 *   4. Smoothing: the alpha is blurred slightly and tightened again, which
 *      takes the stair-steps and stray dots out of the outline without moving
 *      it.
 *   5. Color: every edge pixel takes the artwork color just inside it, so
 *      none of the old background is left to show as a fringe.
 */
function keyBackground(
  rgb,
  w,
  h,
  { tolerance, holes = [], lighterIsBg = false },
) {
  const n = w * h;
  const bg = borderColor(rgb, w, h);
  const isBg = (i) => {
    for (let c = 0; c < 3; c++) {
      const d = rgb[i * 3 + c] - bg[c];
      // Sharpening leaves a halo slightly lighter than a light background;
      // counting anything lighter as background removes it.
      if (lighterIsBg ? d < -tolerance : Math.abs(d) > tolerance) return false;
    }
    return true;
  };

  const out = new Uint8Array(n); // 1 = background
  const stack = [];
  const push = (i) => {
    if (!out[i] && isBg(i)) {
      out[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < w; x++) (push(x), push((h - 1) * w + x));
  for (let y = 0; y < h; y++) (push(y * w), push(y * w + w - 1));
  for (const [x, y] of holes) push(y * w + x);
  const flood = () => {
    while (stack.length) {
      const i = stack.pop();
      const x = i % w;
      if (x > 0) push(i - 1);
      if (x < w - 1) push(i + 1);
      if (i >= w) push(i - w);
      if (i < n - w) push(i + w);
    }
  };
  flood();
  // Where two pieces of artwork nearly touch, a sliver of background is
  // pinched off behind the blended pixels between them and the fill cannot
  // get in. Background color within POCKET pixels of the background already
  // found is such a sliver; anything deeper inside is artwork.
  for (;;) {
    let near = out;
    for (let step = 0; step < POCKET; step++) near = dilate(near, w, h);
    for (let i = 0; i < n; i++) if (near[i]) push(i);
    if (!stack.length) break;
    flood();
  }
  dropPieces(out, w, h);

  for (let round = 0; round < PEEL_ROUNDS; round++) {
    const { alpha, measured } = measure();
    for (let i = 0; i < n; i++) {
      if (measured[i] && alpha[i] < PEEL) out[i] = 1;
    }
    dropPieces(out, w, h, { threads: true });
  }

  const { alpha, inside, hasInside, isEdge, reach } = measure();
  const smooth = blur(alpha, w, h);
  const rgba = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const a = reach[i] ? smoothstep(0.1, 0.9, smooth[i]) : alpha[i];
    const a8 = Math.round(a * 255);
    if (a8 === 0) continue;
    const own = !(out[i] || isEdge[i]) || !hasInside[i];
    rgba[i * 4] = own ? rgb[i * 3] : Math.round(inside[i * 3]);
    rgba[i * 4 + 1] = own ? rgb[i * 3 + 1] : Math.round(inside[i * 3 + 1]);
    rgba[i * 4 + 2] = own ? rgb[i * 3 + 2] : Math.round(inside[i * 3 + 2]);
    rgba[i * 4 + 3] = a8;
  }
  return rgba;

  /**
   * Measures the edge of the current mask: for every pixel in or beside it,
   * the artwork color just inside (`inside`), and for the artwork's own edge
   * pixels how opaque they are (`alpha`, with `measured` set where that came
   * from the colors rather than being assumed).
   */
  function measure() {
    // `isEdge` is artwork within two pixels of the background; artwork
    // further in is the core, whose color can be trusted.
    const near2 = dilate(dilate(out, w, h), w, h);
    const isEdge = new Uint8Array(n);
    const art = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      art[i] = out[i] ? 0 : 1;
      isEdge[i] = !out[i] && near2[i] ? 1 : 0;
    }
    // Everything smoothing can touch: the edge, and background within three
    // pixels of artwork.
    const grown = dilate(dilate(dilate(art, w, h), w, h), w, h);
    const reach = new Uint8Array(n);
    for (let i = 0; i < n; i++) reach[i] = isEdge[i] || (out[i] && grown[i]);

    const inside = new Float32Array(n * 3);
    const hasInside = new Uint8Array(n);
    const alpha = new Float32Array(n);
    const measured = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      if (!out[i]) alpha[i] = 1;
      if (!reach[i]) continue;
      hasInside[i] = insideColor(i, near2, inside) ? 1 : 0;
      if (out[i] || !hasInside[i]) continue;
      const fr = inside[i * 3] - bg[0];
      const fg = inside[i * 3 + 1] - bg[1];
      const fb = inside[i * 3 + 2] - bg[2];
      const len = fr * fr + fg * fg + fb * fb;
      if (len === 0) continue;
      const t =
        ((rgb[i * 3] - bg[0]) * fr +
          (rgb[i * 3 + 1] - bg[1]) * fg +
          (rgb[i * 3 + 2] - bg[2]) * fb) /
        len;
      // How far apart artwork and background are decides how much the
      // measure is believed.
      const trust = smoothstep(UNSURE, SURE, Math.sqrt(len));
      alpha[i] = trust * Math.min(1, Math.max(0, t)) + (1 - trust);
      measured[i] = trust > 0.5 ? 1 : 0;
    }
    return { alpha, measured, inside, hasInside, isEdge, reach };
  }

  /**
   * Writes the color of the artwork just inside pixel `i` into `into`: the
   * average of the closest core pixels, so one odd pixel cannot set it. Thin
   * strokes have no core; they take the color furthest from the background
   * among their own pixels. Returns false when neither is in range.
   */
  function insideColor(i, near2, into) {
    const x0 = i % w;
    const y0 = (i / w) | 0;
    const R = 6;
    let bestD = Infinity;
    for (let dy = -R; dy <= R; dy++) {
      const y = y0 + dy;
      if (y < 0 || y >= h) continue;
      for (let dx = -R; dx <= R; dx++) {
        const x = x0 + dx;
        if (x < 0 || x >= w) continue;
        if (near2[y * w + x]) continue;
        const d = dx * dx + dy * dy;
        if (d < bestD) bestD = d;
      }
    }
    if (bestD < Infinity) {
      // Everything within about a pixel and a half of the closest.
      const limit = (Math.sqrt(bestD) + 1.5) ** 2;
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let dy = -R - 2; dy <= R + 2; dy++) {
        const y = y0 + dy;
        if (y < 0 || y >= h) continue;
        for (let dx = -R - 2; dx <= R + 2; dx++) {
          const x = x0 + dx;
          if (x < 0 || x >= w) continue;
          const j = y * w + x;
          if (near2[j] || dx * dx + dy * dy > limit) continue;
          r += rgb[j * 3];
          g += rgb[j * 3 + 1];
          b += rgb[j * 3 + 2];
          count++;
        }
      }
      into[i * 3] = r / count;
      into[i * 3 + 1] = g / count;
      into[i * 3 + 2] = b / count;
      return true;
    }
    let best = -1;
    let bestDev = -1;
    for (let dy = -2; dy <= 2; dy++) {
      const y = y0 + dy;
      if (y < 0 || y >= h) continue;
      for (let dx = -2; dx <= 2; dx++) {
        const x = x0 + dx;
        if (x < 0 || x >= w) continue;
        const j = y * w + x;
        if (out[j]) continue;
        const dev =
          (rgb[j * 3] - bg[0]) ** 2 +
          (rgb[j * 3 + 1] - bg[1]) ** 2 +
          (rgb[j * 3 + 2] - bg[2]) ** 2;
        if (dev > bestDev) {
          bestDev = dev;
          best = j;
        }
      }
    }
    if (best < 0) return false;
    into[i * 3] = rgb[best * 3];
    into[i * 3 + 1] = rgb[best * 3 + 1];
    into[i * 3 + 2] = rgb[best * 3 + 2];
    return true;
  }
}

// Color distance (out of about 440) between artwork and background below
// which an edge pixel's opacity cannot be measured, and above which it can.
const UNSURE = 50;
const SURE = 110;
// How far the background fill reaches across blended pixels into a pocket.
const POCKET = 2;
// An edge pixel less opaque than this is a sharpening line, not artwork.
const PEEL = 0.15;
const PEEL_ROUNDS = 2;
// Pieces of artwork smaller than this many pixels, touching nothing, are
// noise: the largest of those is under a dozen pixels, and the smallest real
// piece, a leaf's stem, is nearly sixty.
const SPECK = 30;

const smoothstep = (lo, hi, v) => {
  const t = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
};

/** The background color: the middle value of each channel along the border. */
function borderColor(rgb, w, h) {
  const ring = [];
  for (let x = 0; x < w; x++) ring.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) ring.push(y * w, y * w + w - 1);
  return [0, 1, 2].map((c) => {
    const values = ring.map((i) => rgb[i * 3 + c]).sort((a, b) => a - b);
    return values[values.length >> 1];
  });
}

/**
 * Turns stray pieces of artwork into background, in place: any piece smaller
 * than SPECK, and with `threads`, any piece that is nowhere more than two
 * pixels wide (a length of sharpening line cut loose from the edge it ran
 * beside).
 */
function dropPieces(out, w, h, { threads = false } = {}) {
  const n = w * h;
  const seen = new Uint8Array(n);
  const near = threads ? dilate(out, w, h) : null;
  for (let start = 0; start < n; start++) {
    if (seen[start] || out[start]) continue;
    const pixels = [start];
    seen[start] = 1;
    let thick = false;
    for (let p = 0; p < pixels.length; p++) {
      const i = pixels[p];
      if (near && !near[i]) thick = true;
      const x = i % w;
      const y = (i / w) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || xx >= w || yy < 0 || yy >= h) continue;
          const j = yy * w + xx;
          if (!seen[j] && !out[j]) {
            seen[j] = 1;
            pixels.push(j);
          }
        }
      }
    }
    if (pixels.length < SPECK || (threads && !thick)) {
      for (const i of pixels) out[i] = 1;
    }
  }
}

/** A light Gaussian blur of a one-channel float image. */
function blur(values, w, h) {
  const SIGMA = 0.8;
  const kernel = [-2, -1, 0, 1, 2].map((x) =>
    Math.exp(-(x * x) / (2 * SIGMA * SIGMA)),
  );
  const total = kernel.reduce((a, b) => a + b);
  const pass = (src, dx, dy) => {
    const dst = new Float32Array(src.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        for (let k = -2; k <= 2; k++) {
          const xx = Math.min(w - 1, Math.max(0, x + k * dx));
          const yy = Math.min(h - 1, Math.max(0, y + k * dy));
          sum += src[yy * w + xx] * kernel[k + 2];
        }
        dst[y * w + x] = sum / total;
      }
    }
    return dst;
  };
  return pass(pass(values, 1, 0), 0, 1);
}

/** Grows a 0/1 mask by one pixel in every direction. */
function dilate(mask, w, h) {
  const grown = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let hit = 0;
      for (let dy = -1; dy <= 1 && !hit; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx >= 0 && xx < w && mask[yy * w + xx]) {
            hit = 1;
            break;
          }
        }
      }
      grown[y * w + x] = hit;
    }
  }
  return grown;
}

/** Every connected piece of artwork, with its bounds and its pixels. */
function piecesOf(rgba, w, h) {
  const n = w * h;
  const label = new Int32Array(n);
  const pieces = [];
  for (let start = 0; start < n; start++) {
    if (label[start] || rgba[start * 4 + 3] === 0) continue;
    const id = pieces.length + 1;
    const pixels = [start];
    label[start] = id;
    const bounds = { x0: w, y0: h, x1: 0, y1: 0 };
    for (let p = 0; p < pixels.length; p++) {
      const i = pixels[p];
      const x = i % w;
      const y = (i / w) | 0;
      if (x < bounds.x0) bounds.x0 = x;
      if (x > bounds.x1) bounds.x1 = x;
      if (y < bounds.y0) bounds.y0 = y;
      if (y > bounds.y1) bounds.y1 = y;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || xx >= w || yy < 0 || yy >= h) continue;
          const j = yy * w + xx;
          if (!label[j] && rgba[j * 4 + 3] !== 0) {
            label[j] = id;
            pixels.push(j);
          }
        }
      }
    }
    pieces.push({ bounds, pixels });
  }
  return pieces;
}

/**
 * Keeps only the connected pieces of artwork that pass `keep(bounds)`. Used to
 * lift the cat emblem out of the lockup: the emblem's leaves overlap the "J"
 * horizontally, so no straight vertical cut separates them, but every piece of
 * the emblem ends left of where the lettering's pieces end.
 */
function keepPieces(rgba, w, h, keep) {
  const result = new Uint8Array(rgba.length);
  for (const { bounds, pixels } of piecesOf(rgba, w, h)) {
    if (!keep(bounds)) continue;
    for (const i of pixels) {
      result.set(rgba.subarray(i * 4, i * 4 + 4), i * 4);
    }
  }
  return result;
}

const TRIM_PAD = 8;

/** Crops RGBA to its visible pixels plus a little padding; returns a PNG. */
function trimmed(rgba, w, h, pad = TRIM_PAD) {
  let x0 = w;
  let y0 = h;
  let x1 = 0;
  let y1 = 0;
  for (let i = 0; i < w * h; i++) {
    if (rgba[i * 4 + 3] === 0) continue;
    const x = i % w;
    const y = (i / w) | 0;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  const left = Math.max(0, x0 - pad);
  const top = Math.max(0, y0 - pad);
  const width = Math.min(w, x1 + pad + 1) - left;
  const height = Math.min(h, y1 + pad + 1) - top;
  return sharp(Buffer.from(rgba), { raw: { width: w, height: h, channels: 4 } })
    .extract({ left, top, width, height })
    .png()
    .toBuffer();
}

async function cutOut(file, options) {
  const { data, info } = await sharp(source(file))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    rgba: keyBackground(data, info.width, info.height, options),
    w: info.width,
    h: info.height,
  };
}

// The emblem comes from the drawing of the whole logo, on its cream
// background. Only the emblem is taken from it: its lettering is the same
// design as the wordmark's, drawn smaller. The seed point sits in the bowl of
// the "d", the one enclosed region that is background rather than artwork.
const creamLockup = await cutOut("lockup-cream.webp", {
  tolerance: 12,
  holes: [[1462, 479]],
  lighterIsBg: true,
});
// The lettering comes from the wordmark drawn by itself, for dark backgrounds:
// the largest and sharpest drawing of it there is.
const plumWordmark = await cutOut("wordmark-plum.webp", {
  tolerance: 12,
  holes: [[1402, 429]],
});

// In the logo drawing, every piece of the emblem ends before x = 760; every
// piece of its lettering (the "J" included) ends after it.
const EMBLEM_EDGE = 760;
const emblemOnly = (lockup) =>
  keepPieces(lockup.rgba, lockup.w, lockup.h, (b) => b.x1 < EMBLEM_EDGE);

/** The box around some pieces of artwork. */
const boxAround = (pieces) => ({
  x0: Math.min(...pieces.map((p) => p.bounds.x0)),
  y0: Math.min(...pieces.map((p) => p.bounds.y0)),
  x1: Math.max(...pieces.map((p) => p.bounds.x1)),
  y1: Math.max(...pieces.map((p) => p.bounds.y1)),
});

/**
 * The pieces of some lettering: the branch under the letters, which is the
 * widest piece, and the letters, which are the rest.
 */
function letteringPieces({ rgba, w, h }, keep = () => true) {
  const pieces = piecesOf(rgba, w, h).filter((p) => keep(p.bounds));
  const span = (p) => p.bounds.x1 - p.bounds.x0;
  const branch = pieces.reduce((a, b) => (span(b) > span(a) ? b : a));
  return { branch, letters: pieces.filter((p) => p !== branch) };
}

// The wordmark's branch is not drawn in quite the same spot under the letters
// as the logo's is. The logo decides, so that the wordmark is the logo without
// its emblem: the branch is moved this far, in the wordmark drawing's pixels.
const BRANCH_MOVED = [-14, -5];

/** Some lettering with its branch moved; the letters stay where they are. */
function withBranchMoved(lettering, [dx, dy]) {
  const { rgba, w, h } = lettering;
  const { branch } = letteringPieces(lettering);
  const out = Uint8Array.from(rgba);
  for (const i of branch.pixels) out.fill(0, i * 4, i * 4 + 4);
  for (const i of branch.pixels) {
    const x = (i % w) + dx;
    const y = ((i / w) | 0) + dy;
    if (x < 0 || x >= w || y < 0 || y >= h) {
      throw new Error("The wordmark's branch does not fit its canvas");
    }
    out.set(rgba.subarray(i * 4, i * 4 + 4), (y * w + x) * 4);
  }
  return { rgba: out, w, h };
}

// The colors the lettering is drawn in for dark backgrounds, and what each
// becomes on a light one.
const CREAM = [254, 240, 212];
const INK = [37, 14, 43];
const RING_TAN = [202, 148, 103];
const BRANCH_PALE = [246, 195, 128];
const BROWN = [109, 54, 59];

// The wordmark is drawn with its "d" touching the ring of the second eye.
// The "d" begins at this column of the drawing, and is moved this far right
// to leave a little space between the two: ten pixels of space, and two more
// for what is filled back onto the letter's edge.
const D_BEGINS = 1334;
const D_MOVED = 12;

/**
 * Some lettering with its "d" moved right, away from the eye it touches.
 *
 * Everything in the letters from `D_BEGINS` on is the "d". Where the two
 * touch, the pixels on the line between them are a blend of the ring's tan
 * and the letter's cream; each is split into its share of ring, which stays,
 * and its share of letter, which moves, so both come away with a soft edge.
 *
 * The ring was drawn over the edge of the "d", so with the ring gone from it
 * the letter's curve has a shallow flat where the ring was. The curve is
 * carried through from the edge above and below, and the flat filled out to
 * it.
 */
function withDMoved(lettering, tan, cream) {
  const { rgba, w, h } = lettering;
  const inBranch = new Uint8Array(w * h);
  for (const i of letteringPieces(lettering).branch.pixels) inBranch[i] = 1;
  // How far a color sits from the ring's tan (0) toward the letter's cream
  // (1), and how far off the line between them it is.
  const between = (i) => {
    const ab = cream.map((v, k) => v - tan[k]);
    const ap = [0, 1, 2].map((k) => rgba[i * 4 + k] - tan[k]);
    const t =
      (ab[0] * ap[0] + ab[1] * ap[1] + ab[2] * ap[2]) /
      (ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2);
    const off = Math.hypot(...ap.map((v, k) => v - t * ab[k]));
    return { t, off };
  };

  const out = Uint8Array.from(rgba);
  const moved = []; // [index, r, g, b, a], to be written `D_MOVED` to the right
  // Around where they meet, color says which a pixel belongs to, and a soft
  // edge is only ever one pixel wide: anything further from its shape than
  // that is a trace of the other one and goes.
  const MEET = [D_BEGINS - 6, D_BEGINS + 5];
  const solid = (i, isLetter) => {
    if (rgba[i * 4 + 3] !== 255 || inBranch[i]) return false;
    const { t, off } = between(i);
    return off < 40 && (isLetter ? t > 0.9 : t < 0.1);
  };
  const touching = []; // the rows where the ring and the letter meet
  for (let y = 0; y < h; y++) {
    // Where the ring ends and the letter begins in this row.
    let ringEnds = -Infinity;
    for (let x = MEET[1]; x > D_BEGINS - 60; x--) {
      if (solid(y * w + x, false)) {
        ringEnds = x;
        break;
      }
    }
    let letterBegins = Infinity;
    for (let x = MEET[0]; x < D_BEGINS + 60; x++) {
      if (solid(y * w + x, true)) {
        letterBegins = x;
        break;
      }
    }
    if (letterBegins - ringEnds <= 3) touching.push(y);
    for (let x = MEET[0]; x < w; x++) {
      const i = y * w + x;
      if (!rgba[i * 4 + 3] || inBranch[i]) continue;
      const pixel = [...rgba.subarray(i * 4, i * 4 + 4)];
      out.fill(0, i * 4, i * 4 + 4);
      if (x >= MEET[1]) {
        moved.push([i, ...pixel]);
        continue;
      }
      const { t, off } = between(i);
      // Neither tan nor cream: a fleck of the drawing's background caught
      // between the two.
      if (off >= 40) continue;
      const byRing = x <= ringEnds + 1;
      const byLetter = x >= letterBegins - 1;
      if (pixel[3] === 255 && t > 0.1 && t < 0.9) {
        // On the line between them. Its share of ring stays, in the color
        // of the ring beside it; its share of letter moves.
        if (byRing) {
          out.set(
            rgba.subarray((y * w + ringEnds) * 4, (y * w + ringEnds) * 4 + 3),
            i * 4,
          );
          out[i * 4 + 3] = Math.round(255 * (1 - t));
        }
        if (byLetter) moved.push([i, ...cream, Math.round(255 * t)]);
      } else if (t >= 0.5) {
        if (byLetter) moved.push([i, ...pixel]);
      } else if (byRing) {
        out.set(pixel, i * 4);
      }
    }
  }
  for (const [i, r, g, b, a] of moved) {
    const to = i + D_MOVED;
    if (to % w < D_MOVED) throw new Error('The "d" does not fit its canvas');
    // A split pixel's share of letter lands on empty canvas; anything else
    // lands where the "d" already was.
    out.set([r, g, b, a], to * 4);
  }

  // The letter's edge in a row, to a fraction of a pixel: where its solid
  // cream begins, less however much of the pixel before that is covered.
  const edgeAt = (y) => {
    for (let x = D_BEGINS; x < D_BEGINS + D_MOVED + 60; x++) {
      const i = y * w + x;
      if (out[i * 4 + 3] === 255 && out[i * 4] > 235 && out[i * 4 + 2] > 190) {
        return x - out[(i - 1) * 4 + 3] / 255;
      }
    }
    return null;
  };
  // A curve through the edge above and below where they touched: a cubic,
  // fitted by least squares to the rows just clear of it on either side.
  const CLEAR = 6;
  const REACH = 45;
  const [first, last] = [touching[0], touching.at(-1)];
  const middle = (first + last) / 2;
  const points = [];
  for (let y = first - REACH; y <= last + REACH; y++) {
    if (y >= first - CLEAR && y <= last + CLEAR) continue;
    const x = edgeAt(y);
    if (x !== null) points.push([y - middle, x]);
  }
  const N = 4;
  const m = Array.from({ length: N }, () => new Array(N + 1).fill(0));
  for (const [u, x] of points) {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) m[r][c] += u ** (r + c);
      m[r][N] += x * u ** r;
    }
  }
  for (let c = 0; c < N; c++) {
    let pivot = c;
    for (let r = c + 1; r < N; r++) {
      if (Math.abs(m[r][c]) > Math.abs(m[pivot][c])) pivot = r;
    }
    [m[c], m[pivot]] = [m[pivot], m[c]];
    for (let r = 0; r < N; r++) {
      if (r === c) continue;
      const f = m[r][c] / m[c][c];
      for (let k = c; k <= N; k++) m[r][k] -= f * m[c][k];
    }
  }
  const curve = (y) =>
    m.reduce((sum, row, r) => sum + (row[N] / row[r]) * (y - middle) ** r, 0);
  // Fill out to the curve. Only ever adds, and never more than a few pixels:
  // more than that would mean the curve has run away from the letter.
  for (let y = first - CLEAR; y <= last + CLEAR; y++) {
    const now = edgeAt(y);
    const edge = curve(y);
    if (now === null || edge >= now) continue;
    if (now - edge > 4) throw new Error('The edge of the "d" did not fit');
    // In the letter's own color in this row, taken from just inside it.
    const inside = (y * w + Math.ceil(now) + 3) * 4;
    const color = out.subarray(inside, inside + 3);
    for (let x = Math.floor(edge); x < now; x++) {
      const i = y * w + x;
      const cover = Math.round(255 * Math.min(1, x + 1 - edge));
      if (cover <= out[i * 4 + 3]) continue;
      out.set([...color, cover], i * 4);
    }
  }
  return { rgba: out, w, h };
}

const isLeaf = (rgba, i) =>
  rgba[i * 4 + 1] > rgba[i * 4] + 8 && rgba[i * 4 + 1] > rgba[i * 4 + 2] + 15;

/** The middle green of the leaves in a cut-out. */
function leafColor({ rgba, w, h }) {
  const channels = [[], [], []];
  for (let i = 0; i < w * h; i++) {
    if (rgba[i * 4 + 3] !== 255 || !isLeaf(rgba, i)) continue;
    for (let c = 0; c < 3; c++) channels[c].push(rgba[i * 4 + c]);
  }
  return channels.map((v) => v.sort((a, b) => a - b)[v.length >> 1]);
}

/**
 * Some lettering with its leaves tinted so that their middle green is `to`.
 * The two drawings give their leaves different greens; the emblem's decide.
 */
function withLeaves(lettering, to) {
  const { rgba, w, h } = lettering;
  const from = leafColor(lettering);
  const out = Uint8Array.from(rgba);
  for (let i = 0; i < w * h; i++) {
    if (!rgba[i * 4 + 3] || !isLeaf(rgba, i)) continue;
    for (let c = 0; c < 3; c++) {
      out[i * 4 + c] = Math.min(
        255,
        Math.round((rgba[i * 4 + c] * to[c]) / from[c]),
      );
    }
  }
  return { rgba: out, w, h };
}

/**
 * The lettering for light backgrounds, made from the lettering for dark ones
 * by recoloring it: the letters from cream to dark ink, the eye rings from tan
 * to brown, the branch from pale wood to brown. Leaves, the yellow of the eyes
 * and their pupils stay as they are. A pixel on the line between two of those
 * is a blend of the two, and comes out as the same blend of what each becomes.
 */
function forLightBackgrounds(lettering) {
  const { rgba, w, h } = lettering;
  const n = w * h;
  const dist = (i, c) =>
    Math.hypot(
      rgba[i * 4] - c[0],
      rgba[i * 4 + 1] - c[1],
      rgba[i * 4 + 2] - c[2],
    );
  const inBranch = new Uint8Array(n);
  for (const i of letteringPieces(lettering).branch.pixels) inBranch[i] = 1;

  // What each pixel is: 1 a letter, 2 wood (a ring or the branch), 3
  // something that stays (a leaf, an eye, anything dark), 0 a blend on the
  // line between two of those.
  const kind = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (!rgba[i * 4 + 3]) continue;
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    if (isLeaf(rgba, i)) kind[i] = 3;
    else if (r > 200 && g > 140 && b < 45) kind[i] = 3;
    else if (r + g + b < 200) kind[i] = 3;
    else if (inBranch[i]) kind[i] = r > 150 ? 2 : 0;
    else if (dist(i, CREAM) < 40) kind[i] = 1;
    else if (dist(i, RING_TAN) < 45) kind[i] = 2;
  }

  const own = (i) => [rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]];
  const became = (i) => {
    if (kind[i] === 1) return INK;
    if (kind[i] === 2) {
      // Wood keeps some of its own light and shade around the new color.
      const from = inBranch[i] ? BRANCH_PALE : RING_TAN;
      return own(i).map((v, k) =>
        Math.max(0, Math.min(255, BROWN[k] + 0.6 * (v - from[k]))),
      );
    }
    return own(i);
  };

  const out = Uint8Array.from(rgba);
  for (let i = 0; i < n; i++) {
    if (!rgba[i * 4 + 3]) continue;
    let color;
    if (kind[i]) color = became(i);
    else {
      // A blend: the nearest pixel of each kind around it says which two.
      const near = [null, null, null, null];
      const x = i % w;
      const y = (i / w) | 0;
      for (let rad = 1; rad <= 4; rad++) {
        for (let dy = -rad; dy <= rad; dy++) {
          for (let dx = -rad; dx <= rad; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
            const xx = x + dx;
            const yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            const j = yy * w + xx;
            if (kind[j] && near[kind[j]] === null) near[kind[j]] = j;
          }
        }
      }
      const found = near.filter((j) => j !== null);
      if (found.length === 0) color = inBranch[i] ? BROWN : own(i);
      else if (found.length === 1) {
        // Between two things that both stay (a pupil and its eye, a leaf and
        // its vein), the blend stays too.
        color = kind[found[0]] === 3 ? own(i) : became(found[0]);
      } else {
        // The two it sits closest to the line between.
        let best = null;
        for (let a = 0; a < found.length; a++) {
          for (let b = a + 1; b < found.length; b++) {
            const from = own(found[a]);
            const to = own(found[b]);
            const ab = to.map((v, k) => v - from[k]);
            const ap = own(i).map((v, k) => v - from[k]);
            const len = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2 || 1;
            const t = Math.max(
              0,
              Math.min(
                1,
                (ab[0] * ap[0] + ab[1] * ap[1] + ab[2] * ap[2]) / len,
              ),
            );
            const off = Math.hypot(...ap.map((v, k) => v - t * ab[k]));
            if (!best || off < best.off) {
              best = { off, t, a: found[a], b: found[b] };
            }
          }
        }
        const from = became(best.a);
        const to = became(best.b);
        color = from.map((v, k) => v + (to[k] - v) * best.t);
      }
    }
    for (let k = 0; k < 3; k++) out[i * 4 + k] = Math.round(color[k]);
  }
  return { rgba: out, w, h };
}

// The lettering, for dark backgrounds and for light: the wordmark as drawn,
// its branch where the logo has it and its leaves the green of the emblem's.
const emblemArt = {
  rgba: emblemOnly(creamLockup),
  w: creamLockup.w,
  h: creamLockup.h,
};
const plumLettering = withLeaves(
  withBranchMoved(withDMoved(plumWordmark, RING_TAN, CREAM), BRANCH_MOVED),
  leafColor(emblemArt),
);
const creamLettering = forLightBackgrounds(plumLettering);

// The files come in pairs, one for dark backgrounds and one for light, and
// each pair shares a size so one can stand in for the other. Sizes are even,
// so the half-size images come out whole.
const LOCKUP = [1538, 626];
const WORDMARK = [1368, 552];
const EMBLEM = [670, 626];

/**
 * Centers a cut-out on a transparent canvas of exactly this size. Only empty
 * margin is added or trimmed.
 */
async function onCanvas(png, [width, height]) {
  const meta = await sharp(png).metadata();
  const keepW = Math.min(meta.width, width);
  const keepH = Math.min(meta.height, height);
  // `trimmed` leaves TRIM_PAD empty pixels on every side, so this much can go
  // without touching artwork.
  if (meta.width - keepW > TRIM_PAD || meta.height - keepH > TRIM_PAD) {
    throw new Error(
      `A ${meta.width}x${meta.height} cut-out does not fit a ${width}x${height} canvas`,
    );
  }
  const cropped = await sharp(png)
    .extract({
      left: (meta.width - keepW) >> 1,
      top: (meta.height - keepH) >> 1,
      width: keepW,
      height: keepH,
    })
    .png()
    .toBuffer();
  const left = (width - keepW) >> 1;
  const top = (height - keepH) >> 1;
  return sharp(cropped)
    .extend({
      left,
      right: width - keepW - left,
      top,
      bottom: height - keepH - top,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/**
 * Splits a logo into the parts that have to agree between its dark and light
 * versions: the emblem, the letters, and the branch under the letters. Each
 * comes back with its bounds and its pixels alone on a canvas of the same
 * size.
 *
 * The emblem is its body, the largest piece by far, and everything that ends
 * no further right than it does. Of what remains, the branch is the widest
 * piece and the rest are letters.
 */
async function partsOf(png, kind) {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const pieces = piecesOf(data, w, h);
  const groups = {};
  let rest = pieces;
  if (kind === "emblem") {
    groups.emblem = pieces;
    rest = [];
  } else if (kind === "lockup") {
    const body = pieces.reduce((a, b) =>
      b.pixels.length > a.pixels.length ? b : a,
    );
    groups.emblem = pieces.filter((p) => p.bounds.x1 <= body.bounds.x1);
    rest = pieces.filter((p) => p.bounds.x1 > body.bounds.x1);
  }
  if (rest.length) {
    const span = (p) => p.bounds.x1 - p.bounds.x0;
    const branch = rest.reduce((a, b) => (span(b) > span(a) ? b : a));
    groups.letters = rest.filter((p) => p !== branch);
    groups.branch = [branch];
  }
  const parts = {};
  for (const [name, group] of Object.entries(groups)) {
    const rgba = new Uint8Array(data.length);
    const bounds = { x0: w, y0: h, x1: 0, y1: 0 };
    for (const piece of group) {
      bounds.x0 = Math.min(bounds.x0, piece.bounds.x0);
      bounds.y0 = Math.min(bounds.y0, piece.bounds.y0);
      bounds.x1 = Math.max(bounds.x1, piece.bounds.x1);
      bounds.y1 = Math.max(bounds.y1, piece.bounds.y1);
      for (const i of piece.pixels) {
        rgba.set(data.subarray(i * 4, i * 4 + 4), i * 4);
      }
    }
    parts[name] = {
      rgba,
      w,
      h,
      left: bounds.x0,
      top: bounds.y0,
      width: bounds.x1 - bounds.x0 + 1,
      height: bounds.y1 - bounds.y0 + 1,
    };
  }
  return parts;
}

/** How far two versions of a part may differ and still count as the same. */
const PART_TOLERANCE = 1;

/**
 * Whether two logos have the same parts, each the same size and in the same
 * place. Returns the first difference as a sentence when asked to explain.
 */
function partsAgree(a, b, explain = false) {
  for (const part of new Set([...Object.keys(a), ...Object.keys(b)])) {
    for (const edge of ["left", "top", "width", "height"]) {
      const gap = Math.abs((a[part]?.[edge] ?? NaN) - (b[part]?.[edge] ?? NaN));
      if (!(gap <= PART_TOLERANCE)) {
        return explain
          ? `the ${part}'s ${edge} is ${a[part]?.[edge]} in one and ${b[part]?.[edge]} in the other`
          : false;
      }
    }
  }
  return explain ? "" : true;
}

/**
 * Rebuilds a logo so that each of its parts is the size of the same part in
 * the reference, and sits in the same place, on a canvas of this size. Laid
 * one over the other, the two then agree part for part.
 *
 * A part that is already the reference's size, give or take a pixel of soft
 * edge, is only moved, so it stays as sharp as it was drawn. Otherwise it is
 * resized to the reference's box. The two drawings never differ in shape by
 * more than a fraction of a percent; a part that would have to be stretched
 * further than that means the art has changed, and stops the build.
 */
async function partsMatchedTo(png, reference, kind, [width, height]) {
  const to = await partsOf(reference, kind);
  // Drawn to match already? Then it goes out exactly as drawn.
  const asDrawn = await onCanvas(png, [width, height]);
  if (partsAgree(to, await partsOf(asDrawn, kind))) return asDrawn;
  const from = await partsOf(png, kind);
  const layers = [];
  for (const [name, part] of Object.entries(from)) {
    const target = to[name];
    if (!target) throw new Error(`The reference ${kind} has no ${name}`);
    let layer = sharp(Buffer.from(part.rgba), {
      raw: { width: part.w, height: part.h, channels: 4 },
    }).extract({
      left: part.left,
      top: part.top,
      width: part.width,
      height: part.height,
    });
    const sameSize =
      Math.abs(part.width - target.width) <= PART_TOLERANCE &&
      Math.abs(part.height - target.height) <= PART_TOLERANCE;
    if (!sameSize) {
      const across = target.width / part.width;
      const down = target.height / part.height;
      if (Math.abs(across / down - 1) > 0.005) {
        throw new Error(
          `The ${name} of the ${kind} would be stretched ${across.toFixed(4)} across but ${down.toFixed(4)} down`,
        );
      }
      layer = layer.resize({
        width: target.width,
        height: target.height,
        fit: "fill",
        kernel: "lanczos3",
      });
    }
    layers.push({
      input: await layer.png().toBuffer(),
      left: target.left,
      top: target.top,
    });
  }
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(layers)
    .png()
    .toBuffer();
}

/** How much a trimmed cut-out's artwork can grow and still fit this canvas. */
async function fitOf(png, [width, height]) {
  const meta = await sharp(png).metadata();
  return Math.min(
    (width - 2 * TRIM_PAD) / (meta.width - 2 * TRIM_PAD),
    (height - 2 * TRIM_PAD) / (meta.height - 2 * TRIM_PAD),
  );
}

/** Part of a cut-out, resized, as raw pixels with their size. */
async function resized({ rgba, w, h }, box, factor) {
  const width = box.x1 - box.x0 + 1;
  const height = box.y1 - box.y0 + 1;
  const { data, info } = await sharp(Buffer.from(rgba), {
    raw: { width: w, height: h, channels: 4 },
  })
    .extract({ left: box.x0, top: box.y0, width, height })
    .resize({
      width: Math.round(width * factor),
      height: Math.round(height * factor),
      fit: "fill",
      kernel: "lanczos3",
    })
    .raw()
    .toBuffer({ resolveWithObject: true });
  // Resizing leaves a trace of opacity just outside the artwork, too faint
  // to see but enough to join two pieces that do not touch.
  for (let i = 3; i < data.length; i += 4) if (data[i] < 4) data[i] = 0;
  return { data, info };
}

// Where the lettering goes beside the emblem: where the logo drawing has its
// own letters, and at their height.
const lettersInLogo = boxAround(
  letteringPieces(creamLockup, (b) => b.x1 >= EMBLEM_EDGE).letters,
);

/**
 * The logo: the emblem with some lettering beside it, as a trimmed cut-out.
 * At a `scale` of 1 the emblem is as drawn, and nothing is enlarged; the
 * lettering, drawn larger, is brought down to fit.
 */
async function logoOf(lettering, scale) {
  const emblemBox = boxAround(
    piecesOf(emblemArt.rgba, emblemArt.w, emblemArt.h),
  );
  const pieces = letteringPieces(lettering);
  const lettersBox = boxAround(pieces.letters);
  const wholeBox = boxAround([...pieces.letters, pieces.branch]);
  const fit =
    (lettersInLogo.y1 - lettersInLogo.y0 + 1) /
    (lettersBox.y1 - lettersBox.y0 + 1);
  const emblem = await resized(emblemArt, emblemBox, scale);
  const letters = await resized(lettering, wholeBox, fit * scale);
  // Positions in the logo drawing's own pixels, times the scale.
  const at = {
    emblem: [emblemBox.x0 * scale, emblemBox.y0 * scale],
    letters: [
      (lettersInLogo.x0 - (lettersBox.x0 - wholeBox.x0) * fit) * scale,
      (lettersInLogo.y0 - (lettersBox.y0 - wholeBox.y0) * fit) * scale,
    ],
  };
  const left = Math.min(at.emblem[0], at.letters[0]);
  const top = Math.min(at.emblem[1], at.letters[1]);
  const width = Math.ceil(
    Math.max(
      at.emblem[0] + emblem.info.width,
      at.letters[0] + letters.info.width,
    ) - left,
  );
  const height = Math.ceil(
    Math.max(
      at.emblem[1] + emblem.info.height,
      at.letters[1] + letters.info.height,
    ) - top,
  );
  const { data, info } = await sharp({
    create: {
      width: width + 2 * TRIM_PAD,
      height: height + 2 * TRIM_PAD,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: emblem.data,
        raw: emblem.info,
        left: Math.round(at.emblem[0] - left) + TRIM_PAD,
        top: Math.round(at.emblem[1] - top) + TRIM_PAD,
      },
      {
        input: letters.data,
        raw: letters.info,
        left: Math.round(at.letters[0] - left) + TRIM_PAD,
        top: Math.round(at.letters[1] - top) + TRIM_PAD,
      },
    ])
    .raw()
    .toBuffer({ resolveWithObject: true });
  return trimmed(data, info.width, info.height);
}

/** The emblem by itself at this scale, as a trimmed cut-out. */
async function emblemOf(scale) {
  const box = boxAround(piecesOf(emblemArt.rgba, emblemArt.w, emblemArt.h));
  const { data, info } = await resized(emblemArt, box, scale);
  return sharp(data, { raw: info })
    .extend({
      top: TRIM_PAD,
      bottom: TRIM_PAD,
      left: TRIM_PAD,
      right: TRIM_PAD,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

const cutOutOf = ({ rgba, w, h }) => trimmed(rgba, w, h);

// The logo is drawn a little smaller than its files are, so it is enlarged to
// fill them; the emblem by itself goes out at the same scale. The wordmark is
// the lettering as drawn.
const LOCKUP_SCALE = await fitOf(await logoOf(plumLettering, 1), LOCKUP);

// For dark backgrounds — what the site itself uses. These are the reference:
// each light version below is checked against the one here, part by part.
const dark = {
  wordmark: await onCanvas(await cutOutOf(plumLettering), WORDMARK),
  lockup: await onCanvas(await logoOf(plumLettering, LOCKUP_SCALE), LOCKUP),
  emblem: await onCanvas(await emblemOf(LOCKUP_SCALE), EMBLEM),
};

const cutOuts = {
  ...dark,
  // For light backgrounds — press kit only. The same drawings at the same
  // sizes, so each should match its dark version as it stands; anything that
  // does not is moved or resized until it does.
  "lockup-light": await partsMatchedTo(
    await logoOf(creamLettering, LOCKUP_SCALE),
    dark.lockup,
    "lockup",
    LOCKUP,
  ),
  "wordmark-light": await partsMatchedTo(
    await cutOutOf(creamLettering),
    dark.wordmark,
    "wordmark",
    WORDMARK,
  ),
  "emblem-light": await partsMatchedTo(
    await emblemOf(LOCKUP_SCALE),
    dark.emblem,
    "emblem",
    EMBLEM,
  ),
};

// The masters: each cut-out with nothing enlarged and nothing added, for any
// other artwork to start from. The wordmark and the emblem are exactly as
// drawn; the logo is the emblem as drawn with the lettering brought down to
// fit beside it.
const master = (f) => join(root, "brand/masters", f);
await mkdir(master(""), { recursive: true });
for (const [name, png] of Object.entries({
  "logo-for-light": await logoOf(creamLettering, 1),
  "logo-for-dark": await logoOf(plumLettering, 1),
  "wordmark-for-light": await cutOutOf(creamLettering),
  "wordmark-for-dark": await cutOutOf(plumLettering),
  emblem: await emblemOf(1),
})) {
  await sharp(png)
    .png({ compressionLevel: 9 })
    .toFile(master(`jinxwood-${name}.png`));
}

// The promise the press kit makes is that a light file can stand in for its
// dark one. Check it on what was just built, so a change to the art that
// breaks it stops here and not on someone's page.
for (const name of Object.keys(dark)) {
  const difference = partsAgree(
    await partsOf(cutOuts[name], name),
    await partsOf(cutOuts[`${name}-light`], name),
    true,
  );
  if (difference) {
    throw new Error(`The dark and light ${name} differ: ${difference}`);
  }
}

// ---------------------------------------------------------------------------
// Trademark symbol
// ---------------------------------------------------------------------------

// The symbol the lettering carries: "tm" while the mark is unregistered, "r"
// once a registration is granted. Changing this line and running the script
// again updates the site and the press files together.
const TRADEMARK = "tm";

// Both symbols as plain shapes in a box 100 units tall, filled with the
// even-odd rule. Drawing them as shapes keeps the output the same whatever
// fonts are installed where this runs, and lets the site draw the identical
// mark over its own images.
const TRADEMARK_GLYPHS = {
  tm: {
    width: 194,
    path:
      "M0 0H78V16H47V100H31V16H0Z" +
      "M90 0H110L142 62L174 0H194V100H178V30L149 86H135L106 30V100H90Z",
  },
  r: {
    width: 100,
    path:
      "M50 0A50 50 0 1 1 50 100A50 50 0 1 1 50 0Z" +
      "M50 9A41 41 0 1 0 50 91A41 41 0 1 0 50 9Z" +
      "M34 27H55A14 14 0 0 1 55 55H34Z" +
      "M43 35H54A6 6 0 0 1 54 47H43Z" +
      "M34 55H43V73H34Z" +
      "M48 55H58L69 73H59Z",
  },
};
const trademarkGlyph = TRADEMARK_GLYPHS[TRADEMARK];

// Where the symbol sits in each cut-out, in that cut-out's own pixels: its
// left and top edges and its height, placed just past the top of the "d", in
// the color of the lettering. The emblem carries none.
const CREAM_INK = "#fef0d4";
const PLUM_INK = "#2e1e37";
const TRADEMARK_AT = {
  wordmark: { x: 1322, y: 37, height: 60, color: CREAM_INK },
  "wordmark-light": { x: 1322, y: 37, height: 60, color: PLUM_INK },
  lockup: { x: 1506, y: 173, height: 44, color: CREAM_INK },
  "lockup-light": { x: 1506, y: 173, height: 44, color: PLUM_INK },
};

/** The dark and light versions of a logo, which share one canvas size. */
const pairOf = (name) => {
  const base = name.replace(/-light$/, "");
  return [base, `${base}-light`];
};

/**
 * A cut-out with the trademark symbol drawn in, for the press downloads. The
 * site's own images stay unmarked; it draws the symbol over them instead.
 *
 * The symbol hangs past the cut-out's right edge, so the canvas is widened to
 * hold it: by the same amount for both files of a pair, and to an even width.
 */
async function withTrademark(name) {
  const png = cutOuts[name];
  const { width, height } = await sharp(png).metadata();
  const reach = (n) =>
    TRADEMARK_AT[n].x +
    (trademarkGlyph.width * TRADEMARK_AT[n].height) / 100 +
    TRIM_PAD;
  const wide = Math.max(width, ...pairOf(name).map(reach));
  const canvasWidth = 2 * Math.ceil(wide / 2);
  const at = TRADEMARK_AT[name];
  const symbol = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${height}">
      <path d="${trademarkGlyph.path}" fill="${at.color}" fill-rule="evenodd"
        transform="translate(${at.x} ${at.y}) scale(${at.height / 100})"/>
    </svg>`,
  );
  return sharp(png)
    .extend({
      right: canvasWidth - width,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .composite([{ input: symbol }])
    .png()
    .toBuffer();
}

/** Intrinsic sizes, written to brand.gen.ts so <img> can reserve its box. */
const sizes = {};

await mkdir(pub("img/logo"), { recursive: true });
const LOGO_WIDTHS = {
  wordmark: [320, 640, 1280],
  lockup: [640, 1280],
  emblem: [240, 480, 640],
  "lockup-light": [640, 1280],
  "wordmark-light": [640, 1280],
  "emblem-light": [240, 480, 640],
};
for (const [name, png] of Object.entries(cutOuts)) {
  const meta = await sharp(png).metadata();
  sizes[name] = { width: meta.width, height: meta.height };
  for (const width of LOGO_WIDTHS[name]) {
    await sharp(png)
      .resize({ width: Math.min(width, meta.width) })
      .webp({ quality: 92, alphaQuality: 100, effort: 6 })
      .toFile(pub(`img/logo/${name}-${width}.webp`));
  }
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

// The sky is one long smooth gradient, which is exactly where lossy encoders
// draw rings. Quality is set above the usual defaults for that reason; look at
// the sky after regenerating.
const AVIF = { quality: 62, effort: 6 };
const WEBP = { quality: 84, effort: 6 };

const hero = sharp(source("hero.webp"));
const heroMeta = await hero.metadata();
// Portrait crop for phones: a 3:4 slice centered on the castle and the bridge.
const portrait = {
  left: Math.round(heroMeta.width * 0.35),
  top: 0,
  width: Math.round(heroMeta.height * 0.75),
  height: heroMeta.height,
};
sizes.hero = { width: heroMeta.width, height: heroMeta.height };
sizes.heroPortrait = { width: portrait.width, height: portrait.height };

await mkdir(pub("img/hero"), { recursive: true });
for (const width of [768, 1280, 1920, 2560]) {
  const resized = hero.clone().resize({ width });
  await resized
    .clone()
    .avif(AVIF)
    .toFile(pub(`img/hero/hero-${width}.avif`));
  await resized
    .clone()
    .webp(WEBP)
    .toFile(pub(`img/hero/hero-${width}.webp`));
}
for (const width of [640, 960, 1280]) {
  const resized = hero.clone().extract(portrait).resize({ width });
  await resized
    .clone()
    .avif(AVIF)
    .toFile(pub(`img/hero/hero-portrait-${width}.avif`));
  await resized
    .clone()
    .webp(WEBP)
    .toFile(pub(`img/hero/hero-portrait-${width}.webp`));
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

// The favicon and every app icon come from one drawing: the cat in the hollow
// on a plum rounded square, supplied on a white background. The drawn square is
// a little taller than it is wide and its corners are rounded, so it cannot be
// used as it stands: an icon file has to be exactly square, and some platforms
// want the art to run right to the edges so they can round it themselves.
//
// So: remove the white, fill what was white with the square's own plum, and
// take the center square. That is the full-bleed icon. The rounded versions
// are that same square with the corners masked off again.
const iconArt = await cutOut("icon.webp", { tolerance: 24, lighterIsBg: true });

/** The plum the drawn square is filled with, read from just inside its edge. */
function edgeColor({ rgba, w, h }) {
  let inner = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) inner[i] = rgba[i * 4 + 3] === 0 ? 1 : 0;
  for (let step = 0; step < 3; step++) inner = dilate(inner, w, h);
  let outer = inner;
  for (let step = 0; step < 4; step++) outer = dilate(outer, w, h);
  // The band between the two is mostly plain plum, with a few leaf tips. The
  // median ignores those.
  const channels = [[], [], []];
  for (let i = 0; i < w * h; i++) {
    if (!outer[i] || inner[i]) continue;
    for (let c = 0; c < 3; c++) channels[c].push(rgba[i * 4 + c]);
  }
  const [r, g, b] = channels.map(
    (values) => values.sort((x, y) => x - y)[values.length >> 1],
  );
  return { r, g, b };
}

// Its master: the rounded square as drawn, with the white around it gone.
await sharp(await trimmed(iconArt.rgba, iconArt.w, iconArt.h))
  .png({ compressionLevel: 9 })
  .toFile(master("jinxwood-icon.png"));

const iconFilled = await sharp(
  await trimmed(iconArt.rgba, iconArt.w, iconArt.h, 0),
)
  .flatten({ background: edgeColor(iconArt) })
  .png()
  .toBuffer();
const iconMeta = await sharp(iconFilled).metadata();
const iconSide = Math.min(iconMeta.width, iconMeta.height);
const iconSquare = await sharp(iconFilled)
  .extract({
    left: (iconMeta.width - iconSide) >> 1,
    top: (iconMeta.height - iconSide) >> 1,
    width: iconSide,
    height: iconSide,
  })
  .png()
  .toBuffer();

/** The icon with rounded, transparent corners, for places that show it as is. */
function roundedIcon(size) {
  const radius = Math.round(size * 0.225);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}"/>
    </svg>`,
  );
  return sharp(iconSquare)
    .resize(size, size)
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png();
}

await roundedIcon(32).toFile(pub("favicon-32.png"));
await roundedIcon(192).toFile(pub("icon-192.png"));
await roundedIcon(512).toFile(pub("icon-512.png"));
// iOS rounds the home-screen icon itself and paints transparency black, and a
// maskable icon is cropped to whatever shape the launcher uses. Both get the
// full-bleed square; the cat sits well inside the central safe zone.
await sharp(iconSquare)
  .resize(180, 180)
  .png()
  .toFile(pub("apple-touch-icon.png"));
await sharp(iconSquare)
  .resize(512, 512)
  .png()
  .toFile(pub("icon-maskable-512.png"));

// ---------------------------------------------------------------------------
// Social image
// ---------------------------------------------------------------------------

const OG = { width: 1200, height: 630 };
const ogScrim = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${OG.width}" height="${OG.height}">
    <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="${NIGHT}" stop-opacity="0.94"/>
      <stop offset="0.5" stop-color="${NIGHT}" stop-opacity="0.72"/>
      <stop offset="0.8" stop-color="${NIGHT}" stop-opacity="0"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`,
);
// Narrow enough to end before the castle, which starts just past halfway.
const OG_LOCKUP_WIDTH = 540;
const ogLockup = await sharp(cutOuts.lockup)
  .resize({ width: OG_LOCKUP_WIDTH })
  .toBuffer();
await hero
  .clone()
  .resize({ ...OG, fit: "cover", position: "right" })
  .composite([
    { input: ogScrim },
    {
      input: ogLockup,
      left: 48,
      top: Math.round(
        (OG.height -
          OG_LOCKUP_WIDTH * (sizes.lockup.height / sizes.lockup.width)) /
          2,
      ),
    },
  ])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(pub("og.jpg"));

// ---------------------------------------------------------------------------
// Press downloads
// ---------------------------------------------------------------------------

// The logos and wordmarks go out with the trademark symbol drawn in. The
// emblems go out as they are.
await mkdir(pub("press"), { recursive: true });
const png = { compressionLevel: 9, palette: false };
await sharp(await withTrademark("lockup"))
  .png(png)
  .toFile(pub("press/jinxwood-logo-for-dark.png"));
await sharp(await withTrademark("lockup-light"))
  .png(png)
  .toFile(pub("press/jinxwood-logo-for-light.png"));
await sharp(await withTrademark("wordmark"))
  .png(png)
  .toFile(pub("press/jinxwood-wordmark-for-dark.png"));
await sharp(await withTrademark("wordmark-light"))
  .png(png)
  .toFile(pub("press/jinxwood-wordmark-for-light.png"));
await sharp(cutOuts.emblem)
  .png(png)
  .toFile(pub("press/jinxwood-emblem-for-dark.png"));
await sharp(cutOuts["emblem-light"])
  .png(png)
  .toFile(pub("press/jinxwood-emblem-for-light.png"));
await hero
  .clone()
  .resize({ width: 2560 })
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(pub("press/jinxwood-forest.jpg"));

// ---------------------------------------------------------------------------
// YouTube channel
// ---------------------------------------------------------------------------

const youtube = (f) => join(root, "brand/youtube", f);
await mkdir(join(root, "brand/youtube"), { recursive: true });

// YouTube shows the profile picture as a circle, often only a few dozen pixels
// across. The full-bleed icon fills that circle and keeps the cat large; the
// circle trims nothing but leaf tips in the corners. It is also the drawing
// the favicon uses, so the channel and the site match.
await sharp(iconSquare)
  .resize(800, 800)
  .png(png)
  .toFile(youtube("profile-800.png"));

// The video watermark sits over the corner of every video and works as a
// subscribe button. It is the emblem alone on a transparent square, at the
// size YouTube asks for, so the video shows through around it.
await sharp(cutOuts.emblem)
  .resize(150, 150, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png(png)
  .toFile(youtube("watermark-150.png"));

// The banner is uploaded whole, but only a TV shows all of it. A desktop shows
// the middle band, 423 pixels tall, and a phone only the middle 1546 pixels of
// that band. So the wordmark sits inside the phone's strip, on its left, where
// it ends before the castle and has the darker sky behind it.
const BANNER = { width: 2560, height: 1440 };
const BANNER_SAFE = { width: 1546, height: 423 };
const BANNER_WORDMARK_HEIGHT = 300;
// Gap between the left edge of the phone's strip and the wordmark.
const BANNER_INSET = 63;
// How far the shadow spreads past the lettering, and how dark it gets.
const BANNER_SHADOW = { reach: 90, blur: 24, strength: 0.7, drop: 6 };

const bannerWordmark = await sharp(await withTrademark("wordmark"))
  .resize({ height: BANNER_WORDMARK_HEIGHT })
  .png()
  .toBuffer();
const bannerWordmarkWidth = (await sharp(bannerWordmark).metadata()).width;
if (bannerWordmarkWidth + 2 * BANNER_INSET > BANNER_SAFE.width) {
  throw new Error("The banner wordmark does not fit the strip a phone shows.");
}

// The clouds behind the lettering are pale in places, so it gets a soft dark
// shadow in its own shape: the wordmark's opacity, blurred and tinted.
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const shadowRoom = await sharp(bannerWordmark)
  .extend({
    top: BANNER_SHADOW.reach,
    bottom: BANNER_SHADOW.reach,
    left: BANNER_SHADOW.reach,
    right: BANNER_SHADOW.reach,
    background: transparent,
  })
  .png()
  .toBuffer();
const shadowAlpha = await sharp(shadowRoom)
  .extractChannel(3)
  .blur(BANNER_SHADOW.blur)
  .linear(BANNER_SHADOW.strength, 0)
  .raw()
  .toBuffer({ resolveWithObject: true });
const shadowSize = {
  width: shadowAlpha.info.width,
  height: shadowAlpha.info.height,
};
const bannerShadow = await sharp({
  create: { ...shadowSize, channels: 3, background: "#160d24" },
})
  .joinChannel(shadowAlpha.data, { raw: { ...shadowSize, channels: 1 } })
  .png()
  .toBuffer();

const bannerLeft = (BANNER.width - BANNER_SAFE.width) / 2 + BANNER_INSET;
const bannerTop = (BANNER.height - BANNER_WORDMARK_HEIGHT) / 2;
// YouTube takes at most 6 MB; this comes to well under 1 MB.
await hero
  .clone()
  .resize({ ...BANNER, fit: "cover" })
  .composite([
    {
      input: bannerShadow,
      left: bannerLeft - BANNER_SHADOW.reach,
      top: bannerTop - BANNER_SHADOW.reach + BANNER_SHADOW.drop,
    },
    { input: bannerWordmark, left: bannerLeft, top: bannerTop },
  ])
  .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
  .toFile(youtube("banner-2560x1440.jpg"));

// ---------------------------------------------------------------------------
// Generated sizes
// ---------------------------------------------------------------------------

await writeFile(
  join(root, "src/app/_lib/brand.gen.ts"),
  `// Generated by scripts/build-brand.mjs — do not edit by hand.\n` +
    `// Intrinsic pixel sizes of the generated images, so <img> elements can\n` +
    `// reserve their space before the file arrives.\n` +
    `export const IMAGE_SIZES = ${JSON.stringify(sizes, null, 2)} as const;\n` +
    `\n` +
    `// The trademark symbol the lettering carries: its shape in a box 100 units\n` +
    `// tall (filled with the even-odd rule), and its left edge, top edge, height\n` +
    `// and color in each logo's own pixels. The press downloads have it drawn in.\n` +
    `export const TRADEMARK = ${JSON.stringify(
      { symbol: TRADEMARK, path: trademarkGlyph.path, at: TRADEMARK_AT },
      null,
      2,
    )} as const;\n`,
);

// ---------------------------------------------------------------------------
// Contact sheet
// ---------------------------------------------------------------------------

if (preview) {
  const tile = { width: 720, height: 360 };
  const names = Object.keys(cutOuts);
  const heroTile = await hero
    .clone()
    .resize({ ...tile, fit: "cover" })
    .png()
    .toBuffer();
  const backgrounds = [NIGHT, PARCHMENT, heroTile, "#FF00FF"];
  const composites = [];
  for (const [row, name] of names.entries()) {
    const art = await sharp(cutOuts[name])
      .resize({
        width: tile.width - 60,
        height: tile.height - 60,
        fit: "inside",
      })
      .toBuffer();
    for (const [col, bg] of backgrounds.entries()) {
      const base =
        typeof bg === "string"
          ? sharp({ create: { ...tile, channels: 3, background: bg } })
          : sharp(bg);
      composites.push({
        input: await base
          .composite([{ input: art, gravity: "centre" }])
          .png()
          .toBuffer(),
        left: col * tile.width,
        top: row * tile.height,
      });
    }
  }
  await sharp({
    create: {
      width: tile.width * backgrounds.length,
      height: tile.height * names.length,
      channels: 3,
      background: "#000000",
    },
  })
    .composite(composites)
    .png()
    .toFile(join(root, "brand/preview.png"));
  console.log("build-brand: wrote brand/preview.png");
}

console.log(
  "build-brand: cut-outs",
  Object.entries(sizes)
    .map(([k, v]) => `${k} ${v.width}x${v.height}`)
    .join(", "),
);
