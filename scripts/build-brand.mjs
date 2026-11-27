// Generates every brand image the site serves from the source art in
// brand/source/. Output is committed, so this only needs to run when the art
// changes:
//
//   npm run build:brand              regenerate everything
//   npm run build:brand -- --preview also write brand/preview.png, a contact
//                                    sheet of each cut-out over night, parchment,
//                                    the hero art and magenta, for fringe review
//
// The emblem and the wordmark are each their own drawing on a transparent
// background; where the lettering sits beside the emblem is known only from a
// drawing of the whole logo on a solid background. So the first job is
// cutting that drawing out to measure it, and the second is putting the logo
// together, for dark backgrounds and for light. The rest is resizing: hero
// sizes, icons, the social image and press downloads.
//
// It also writes the transparent masters to brand/masters/, and the profile
// pictures and the YouTube banner to brand/youtube/, brand/facebook/ and
// brand/play/. The site does not serve those; they are uploaded by hand.

import { copyFile, mkdir, writeFile } from "node:fs/promises";
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
  // Artwork drawn closer than `pad` to its canvas edge gets the rest of its
  // margin added.
  return sharp(Buffer.from(rgba), { raw: { width: w, height: h, channels: 4 } })
    .extract({ left, top, width, height })
    .extend({
      left: left - (x0 - pad),
      top: top - (y0 - pad),
      right: x1 + pad + 1 - (left + width),
      bottom: y1 + pad + 1 - (top + height),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
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

// The drawing of the whole logo, on its cream background, says where the
// lettering goes beside the emblem. Nothing in it is used as it stands: its
// lettering is an earlier drawing of the wordmark's, drawn smaller, and its
// emblem an earlier drawing of the one below. The seed point sits in the
// bowl of the "d", the one enclosed region that is background rather than
// artwork.
const creamLockup = await cutOut("lockup-cream.webp", {
  tolerance: 12,
  holes: [[1462, 479]],
  lighterIsBg: true,
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

// The emblem: its own drawing, on a transparent background. It is the logo
// drawing's emblem, cut out with TRIM_PAD around it, enlarged until that box
// is the drawing's size, and retouched. So it goes back into the logo over
// that same box, and the lettering stays where the logo drawing has it.
const emblemFile = await sharp(source("emblem.png"))
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

/**
 * A drawing on a transparent background, made ready to use. The emblem and
 * the wordmark were both saved with their solid parts at 253 of 255 opacity,
 * which would let the background show through faintly, so every pixel's
 * opacity is scaled back up by that much. The background around them keeps a
 * faint trace of what was there before, at an opacity of 1 or 2: that is
 * cleared, along with any loose speck it leaves.
 */
function readyDrawing({ data, info }) {
  const { width: w, height: h } = info;
  const rgba = Uint8Array.from(data);
  for (let i = 3; i < rgba.length; i += 4) {
    rgba[i] =
      rgba[i] < 8 ? 0 : Math.min(255, Math.round((rgba[i] * 255) / 253));
  }
  for (const { pixels } of piecesOf(rgba, w, h)) {
    if (pixels.length < SPECK) for (const i of pixels) rgba[i * 4 + 3] = 0;
  }
  return { rgba, w, h };
}
const emblemArt = readyDrawing(emblemFile);
const emblemBox = boxAround(piecesOf(emblemArt.rgba, emblemArt.w, emblemArt.h));

// Where the emblem drawing sits in the logo drawing: the box its file covers
// there, from `x` and `y`, and how many of its pixels make one of the logo
// drawing's. Both ways it must have been enlarged by the same amount, or it is
// not the drawing this expects.
const EMBLEM_AT = (() => {
  const was = boxAround(
    piecesOf(emblemOnly(creamLockup), creamLockup.w, creamLockup.h),
  );
  const width = was.x1 - was.x0 + 1 + 2 * TRIM_PAD;
  const height = was.y1 - was.y0 + 1 + 2 * TRIM_PAD;
  const across = emblemArt.w / width;
  const down = emblemArt.h / height;
  if (Math.abs(across / down - 1) > 0.005) {
    throw new Error(
      `The emblem drawing (${emblemArt.w}x${emblemArt.h}) is not the logo's ` +
        `emblem box (${width}x${height}) enlarged: redo EMBLEM_AT`,
    );
  }
  return {
    x: was.x0 - TRIM_PAD,
    y: was.y0 - TRIM_PAD,
    per: (across + down) / 2,
  };
})();

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

// The lettering: the wordmark drawn by itself, for dark backgrounds, on a
// transparent background, with its eye rings, branch and leaves in the
// emblem's colors.
const plumLettering = readyDrawing(
  await sharp(source("wordmark.png"))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true }),
);

// The letters' cream, and the dark ink they become on light backgrounds.
const CREAM = [253, 240, 215];
const INK = [37, 14, 43];

/**
 * The lettering for light backgrounds, made from the lettering for dark ones:
 * the letters go from cream to dark ink, and the eyes, the branch and the
 * leaves stay as drawn. Each letter is a piece of its own and changes whole,
 * keeping the transparency of its edges. Where a letter meets its dark
 * outline, or touches something else (the dot of the "i" and its leaf), a
 * pixel on the line between the two is a blend of them, and comes out as the
 * same blend of ink and the other.
 */
function forLightBackgrounds({ rgba, w, h }) {
  const out = Uint8Array.from(rgba);
  const dist = (i, c) =>
    Math.hypot(
      rgba[i * 4] - c[0],
      rgba[i * 4 + 1] - c[1],
      rgba[i * 4 + 2] - c[2],
    );
  // Cream, the lighter cream some of the letters' edges are drawn in, or the
  // warm beige the letters are shaded with: light, and warm in the way cream
  // is (red over green over blue, by less than the eyes' yellow or the
  // branch's orange).
  const creamy = (i) => {
    const [r, g, b] = rgba.subarray(i * 4, i * 4 + 3);
    return (
      dist(i, CREAM) < 40 ||
      (r > 235 && g > 222 && b > 190) ||
      (r > 200 && g > 175 && b > 145 && r >= g && g >= b && r - b < 80)
    );
  };
  // Cream that belongs to a letter: the large patches of it, and any small
  // patch within a few pixels of one (a stroke of lighter cream along a
  // letter's edge). A small patch on its own, like the glint in an eye, is
  // not part of a letter and stays as drawn.
  const creamOnly = new Uint8Array(rgba.length);
  for (let i = 0; i < w * h; i++) {
    if (rgba[i * 4 + 3] > 0 && creamy(i)) creamOnly[i * 4 + 3] = 255;
  }
  const patches = piecesOf(creamOnly, w, h);
  const big = new Uint8Array(w * h);
  for (const { pixels } of patches) {
    if (pixels.length >= (w * h) / 1000) for (const i of pixels) big[i] = 1;
  }
  const nearBig = (i) => {
    const x = i % w;
    const y = (i / w) | 0;
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h && big[ny * w + nx])
          return true;
      }
    return false;
  };
  const letterCream = Uint8Array.from(big);
  for (const { pixels } of patches) {
    if (big[pixels[0]] || !pixels.some(nearBig)) continue;
    for (const i of pixels) letterCream[i] = 1;
  }
  for (const { pixels } of piecesOf(rgba, w, h)) {
    const solid = pixels.filter((i) => rgba[i * 4 + 3] > 200);
    const share = solid.filter(creamy).length / Math.max(1, solid.length);
    if (share > 0.95) {
      for (const i of pixels) out.set(INK, i * 4);
      continue;
    }
    if (share <= 0.05) continue;
    // A letter outlined, or touching something else. A pixel on the edge
    // between the cream and what it meets is a blend of the two, and comes out
    // as the same blend of ink and that. What it meets is either the dark
    // outline drawn around the letters or, where a letter touches artwork of
    // another color, the average of the piece's other light pixels; each takes
    // whichever of the two it lies closer to a blend with.
    const mean = (list) =>
      [0, 1, 2].map(
        (c) => list.reduce((sum, i) => sum + rgba[i * 4 + c], 0) / list.length,
      );
    const dark = (i) =>
      Math.max(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]) < 80;
    const darks = solid.filter(dark);
    const others = solid.filter((i) => dist(i, CREAM) > 90 && !dark(i));
    const meets = [others, darks].filter((list) => list.length).map(mean);
    // Only pixels within a few of the cream are on its edge: light parts of
    // a leaf further off can pass for a blend of cream and outline.
    const cream = new Set(pixels.filter((i) => letterCream[i]));
    const byCream = (i) => {
      const x = i % w;
      for (let dy = -3; dy <= 3; dy++)
        for (let dx = -3; dx <= 3; dx++)
          if (x + dx >= 0 && x + dx < w && cream.has(i + dy * w + dx))
            return true;
      return false;
    };
    for (const i of pixels) {
      if (cream.has(i)) {
        // Ink, shaded as the cream was: darker in the same proportion as the
        // pixel is darker than plain cream, and never lighter or another hue.
        const shade = Math.min(
          1,
          (rgba[i * 4] + rgba[i * 4 + 1] + rgba[i * 4 + 2]) /
            (CREAM[0] + CREAM[1] + CREAM[2]),
        );
        for (let c = 0; c < 3; c++) {
          out[i * 4 + c] = Math.round(INK[c] * shade);
        }
        continue;
      }
      if (!byCream(i)) continue;
      let best = null;
      for (const other of meets) {
        const line = CREAM.map((v, c) => v - other[c]);
        const length = line.reduce((sum, v) => sum + v * v, 0);
        const t = Math.max(
          0,
          Math.min(
            1,
            line.reduce(
              (sum, v, c) => sum + v * (rgba[i * 4 + c] - other[c]),
              0,
            ) / length,
          ),
        );
        // How far the pixel is from that blend.
        const off = Math.hypot(
          ...[0, 1, 2].map((c) => rgba[i * 4 + c] - (other[c] + t * line[c])),
        );
        if (!best || off < best.off) best = { t, off };
      }
      if (!best || best.off > 45) continue;
      for (let c = 0; c < 3; c++) {
        // Clamped: a Uint8Array wraps a value below 0 round to bright color.
        out[i * 4 + c] = Math.max(
          0,
          Math.round(rgba[i * 4 + c] + best.t * (INK[c] - CREAM[c])),
        );
      }
    }
  }
  return { rgba: out, w, h };
}
const creamLettering = forLightBackgrounds(plumLettering);

// The logo and wordmark files come in pairs, one for dark backgrounds and one
// for light, and each pair shares a size so one can stand in for the other.
// Sizes are even, so the half-size images come out whole. All three sizes are
// worked out below, once the logo can be put together: the logo is
// LOCKUP_WIDTH wide, and the wordmark and the emblem are sized to fit.
const LOCKUP_WIDTH = 1538;

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
  if (kind === "lockup") {
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
 * How much some lettering is resized to take the place of the logo drawing's
 * own, at a scale of 1.
 */
function letteringFit(lettering) {
  const lettersBox = boxAround(letteringPieces(lettering).letters);
  return (
    (lettersInLogo.y1 - lettersInLogo.y0 + 1) /
    (lettersBox.y1 - lettersBox.y0 + 1)
  );
}

/**
 * The logo: the emblem with some lettering beside it, as a trimmed cut-out.
 * `scale` is in the logo drawing's pixels: at 1 the logo is the size that
 * drawing has it. The emblem and the lettering are each drawn larger than
 * that, so both are brought down to fit.
 */
async function logoOf(lettering, scale) {
  const pieces = letteringPieces(lettering);
  const lettersBox = boxAround(pieces.letters);
  const wholeBox = boxAround([...pieces.letters, pieces.branch]);
  const fit = letteringFit(lettering);
  const emblem = await resized(emblemArt, emblemBox, scale / EMBLEM_AT.per);
  const letters = await resized(lettering, wholeBox, fit * scale);
  // Positions in the logo drawing's own pixels, times the scale.
  const at = {
    emblem: [
      (EMBLEM_AT.x + emblemBox.x0 / EMBLEM_AT.per) * scale,
      (EMBLEM_AT.y + emblemBox.y0 / EMBLEM_AT.per) * scale,
    ],
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

/**
 * The emblem by itself at this scale, in the logo drawing's pixels as for
 * logoOf, as a trimmed cut-out.
 */
async function emblemOf(scale) {
  const { data, info } = await resized(
    emblemArt,
    emblemBox,
    scale / EMBLEM_AT.per,
  );
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

// The logo is sized so its artwork fills LOCKUP_WIDTH, and its file is as
// tall as that makes it; the emblem by itself goes out at the same scale.
// Both are smaller than their drawings. The wordmark is the lettering as
// drawn.
const evenSize = (png) =>
  sharp(png)
    .metadata()
    .then(({ width, height }) =>
      [width, height].map((v) => 2 * Math.ceil(v / 2)),
    );
const logoAtOne = await sharp(await logoOf(plumLettering, 1)).metadata();
const LOCKUP_SCALE =
  (LOCKUP_WIDTH - 2 * TRIM_PAD) / (logoAtOne.width - 2 * TRIM_PAD);
const LOCKUP = await evenSize(await logoOf(plumLettering, LOCKUP_SCALE));
const WORDMARK = await evenSize(await cutOutOf(plumLettering));
const emblemAlone = await emblemOf(LOCKUP_SCALE);
const EMBLEM = await evenSize(emblemAlone);

// For dark backgrounds — what the site itself uses. These are the reference:
// each light version below is checked against the one here, part by part.
const dark = {
  wordmark: await onCanvas(await cutOutOf(plumLettering), WORDMARK),
  lockup: await onCanvas(await logoOf(plumLettering, LOCKUP_SCALE), LOCKUP),
};

const cutOuts = {
  ...dark,
  // The emblem has no lettering to recolor, so the one drawing serves dark
  // and light backgrounds alike.
  emblem: await onCanvas(emblemAlone, EMBLEM),
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
};

// The masters: each cut-out with nothing enlarged and nothing added, for any
// other artwork to start from. The wordmark and the emblem are exactly as
// drawn. The logo is as large as it can be with neither enlarged: whichever
// of the two is drawn smaller for its place in the logo is as drawn, and the
// other is brought down to match.
const EMBLEM_SCALE = EMBLEM_AT.per;
const LOGO_MASTER_SCALE = Math.min(
  EMBLEM_SCALE,
  1 / letteringFit(plumLettering),
);
const master = (f) => join(root, "brand/masters", f);
await mkdir(master(""), { recursive: true });
for (const [name, png] of Object.entries({
  "logo-for-light": await logoOf(creamLettering, LOGO_MASTER_SCALE),
  "logo-for-dark": await logoOf(plumLettering, LOGO_MASTER_SCALE),
  "wordmark-for-light": await cutOutOf(creamLettering),
  "wordmark-for-dark": await cutOutOf(plumLettering),
  emblem: await emblemOf(EMBLEM_SCALE),
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
// left and top edges and its height, placed by the top of the "d", in the
// color of the lettering. The emblem carries none. It is worked out from the
// "d" in each file, so it stays put against the d wherever the lettering
// lands: BESIDE_D is its left edge from the d's right edge, its top from the
// d's top, and its height, each in the d's heights, as it was placed by eye.
const CREAM_INK = "#fef0d4";
const PLUM_INK = "#2e1e37";
const BESIDE_D = { right: -0.0195, top: 0.0097, height: 0.1948 };

/**
 * The bounds of the "d" in a cut-out with lettering for dark backgrounds.
 * The letters touch the branch, the eyes and each other through their dark
 * outlines, so the d is found by its cream alone: of the patches of solid
 * cream that end near the right edge of the cream, the one that reaches
 * highest, which is the d's ascender.
 */
async function boundsOfD(png) {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const cream = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = data.subarray(i, i + 4);
    const isCream =
      Math.hypot(r - CREAM[0], g - CREAM[1], b - CREAM[2]) < 40 ||
      (r > 235 && g > 222 && b > 190);
    if (a > 200 && isCream) cream[i + 3] = 255;
  }
  const pieces = piecesOf(cream, info.width, info.height);
  const largest = Math.max(...pieces.map((p) => p.pixels.length));
  const patches = pieces.filter((p) => p.pixels.length > largest / 20);
  const right = Math.max(...patches.map((p) => p.bounds.x1));
  return patches
    .filter((p) => p.bounds.x1 > right - info.width / 10)
    .reduce((a, b) => (b.bounds.y0 < a.bounds.y0 ? b : a)).bounds;
}

/** Where the symbol goes in a cut-out with lettering. */
async function trademarkFor(png) {
  const d = await boundsOfD(png);
  const tall = d.y1 - d.y0 + 1;
  return {
    x: Math.round(d.x1 + BESIDE_D.right * tall),
    y: Math.round(d.y0 + BESIDE_D.top * tall),
    height: Math.round(BESIDE_D.height * tall),
  };
}
const ON_WORDMARK = await trademarkFor(cutOuts.wordmark);
const ON_LOCKUP = await trademarkFor(cutOuts.lockup);

const TRADEMARK_AT = {
  wordmark: { ...ON_WORDMARK, color: CREAM_INK },
  "wordmark-light": { ...ON_WORDMARK, color: PLUM_INK },
  lockup: { ...ON_LOCKUP, color: CREAM_INK },
  "lockup-light": { ...ON_LOCKUP, color: PLUM_INK },
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

// The favicon, the app icons and the profile pictures are all the emblem on a
// square of night, drawn from the emblem drawing at each size that is needed.
//
// They come in two layouts. An icon is shown as a rounded square, which cuts
// off little, and at 32 pixels every one counts, so its emblem is large: the
// emblem's box fills ICON_FILL of the square. A profile picture is shown as a
// circle, so there the emblem sits inside the circle with PROFILE_MARGIN of
// the circle's radius to spare all round: no part of it is further from the
// middle than the rest of the radius. That layout also suits a maskable app
// icon, which a launcher may crop to a circle 80% as wide as the icon.
const ICON_FILL = 0.84;
const PROFILE_MARGIN = 0.2;

// How far the emblem reaches from the middle of its box, in the drawing's
// pixels: what has to fit inside a profile picture's circle. Faint edge
// pixels are left out; nobody sees them cross the line.
const emblemReach = (() => {
  const { rgba, w } = emblemArt;
  const cx = (emblemBox.x0 + emblemBox.x1 + 1) / 2;
  const cy = (emblemBox.y0 + emblemBox.y1 + 1) / 2;
  let reach = 0;
  for (let y = emblemBox.y0; y <= emblemBox.y1; y++) {
    for (let x = emblemBox.x0; x <= emblemBox.x1; x++) {
      if (rgba[(y * w + x) * 4 + 3] < 32) continue;
      reach = Math.max(reach, Math.hypot(x + 0.5 - cx, y + 0.5 - cy));
    }
  }
  return reach;
})();
const emblemSide = Math.max(
  emblemBox.x1 - emblemBox.x0 + 1,
  emblemBox.y1 - emblemBox.y0 + 1,
);

/** How much the drawing is resized for each layout, on a square `size` wide. */
const layouts = {
  icon: (size) => (ICON_FILL * size) / emblemSide,
  profile: (size) => ((1 - PROFILE_MARGIN) * size) / 2 / emblemReach,
};

/** The emblem in the middle of a square of night, `size` pixels across. */
async function emblemOnNight(size, layout) {
  // Laid out at the drawing's own size and only then brought down. Shrinking
  // the transparent emblem by itself leaves stray colors in the nearly clear
  // pixels around its edge, which show as specks on the plain background of
  // a small icon; shrinking the finished square does not.
  const side = Math.round(size / layouts[layout](size));
  const width = emblemBox.x1 - emblemBox.x0 + 1;
  const height = emblemBox.y1 - emblemBox.y0 + 1;
  const emblem = await sharp(Buffer.from(emblemArt.rgba), {
    raw: { width: emblemArt.w, height: emblemArt.h, channels: 4 },
  })
    .extract({ left: emblemBox.x0, top: emblemBox.y0, width, height })
    .png()
    .toBuffer();
  const square = await sharp({
    create: { width: side, height: side, channels: 4, background: NIGHT },
  })
    .composite([
      {
        input: emblem,
        left: Math.round((side - width) / 2),
        top: Math.round((side - height) / 2),
      },
    ])
    .removeAlpha()
    .png()
    .toBuffer();
  return sharp(square)
    .resize(size, size, { kernel: "lanczos3" })
    .png()
    .toBuffer();
}

/** An icon with rounded, transparent corners, for places that show it as is. */
async function roundedIcon(size) {
  const radius = Math.round(size * 0.225);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}"/>
    </svg>`,
  );
  return sharp(await emblemOnNight(size, "icon"))
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

// Their masters, with the emblem as drawn: the rounded icon, and the profile
// picture's square for any other place that wants one.
const asDrawn = (layout) => 2 * Math.round(1 / layouts[layout](1) / 2);
await sharp(await roundedIcon(asDrawn("icon")))
  .png({ compressionLevel: 9 })
  .toFile(master("jinxwood-icon.png"));
await sharp(await emblemOnNight(asDrawn("profile"), "profile"))
  .png({ compressionLevel: 9 })
  .toFile(master("jinxwood-profile.png"));

await sharp(await roundedIcon(32)).toFile(pub("favicon-32.png"));
await sharp(await roundedIcon(192)).toFile(pub("icon-192.png"));
await sharp(await roundedIcon(512)).toFile(pub("icon-512.png"));
// iOS rounds the home-screen icon itself and paints transparency black, so it
// gets the full square. A maskable icon is cropped to whatever shape the
// launcher uses, so it gets the profile picture's layout.
await sharp(await emblemOnNight(180, "icon")).toFile(
  pub("apple-touch-icon.png"),
);
await sharp(await emblemOnNight(512, "profile")).toFile(
  pub("icon-maskable-512.png"),
);

// The profile pictures, each at the size its platform asks for. All three are
// shown as circles. They are uploaded by hand.
for (const [folder, file, size] of [
  ["youtube", "profile-800.png", 800],
  ["facebook", "page-profile.png", 1024],
  ["play", "developer-icon.png", 512],
]) {
  await mkdir(join(root, "brand", folder), { recursive: true });
  await sharp(await emblemOnNight(size, "profile"))
    .png({ compressionLevel: 9 })
    .toFile(join(root, "brand", folder, file));
}

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
// emblem goes out as it is, one file for any background.
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
await sharp(cutOuts.emblem).png(png).toFile(pub("press/jinxwood-emblem.png"));
await hero
  .clone()
  .resize({ width: 2560 })
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(pub("press/jinxwood-forest.jpg"));

// The picture of Jinx in the tree is offered at the size it was drawn, with
// the smaller picture the press page shows of it.
await sharp(source("jinx-in-the-tree.webp"))
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(pub("press/jinx-in-the-tree.jpg"));
await mkdir(pub("img/press"), { recursive: true });
await sharp(source("jinx-in-the-tree.webp"))
  .resize({ width: 1280 })
  .webp(WEBP)
  .toFile(pub("img/press/jinx-in-the-tree-1280.webp"));

// Both pictures are kept beside the masters too, as the press page offers
// them.
for (const file of ["jinxwood-forest.jpg", "jinx-in-the-tree.jpg"]) {
  await copyFile(pub(`press/${file}`), master(file));
}

// ---------------------------------------------------------------------------
// YouTube channel
// ---------------------------------------------------------------------------

const youtube = (f) => join(root, "brand/youtube", f);
await mkdir(join(root, "brand/youtube"), { recursive: true });

// The channel's profile picture is made with the others, under Icons.

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
