// Generates every brand image the site serves from the source art in
// brand/source/. Output is committed, so this only needs to run when the art
// changes:
//
//   npm run build:brand              regenerate everything
//   npm run build:brand -- --preview also write brand/preview.png, a contact
//                                    sheet of each cut-out over night, parchment,
//                                    the hero art and magenta, for fringe review
//
// The logos exist only as flat rasters on a solid background, so the first job
// is cutting them out. The rest is resizing: hero sizes, icons, the social
// image and press downloads.

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

/**
 * Keeps only the connected pieces of artwork that pass `keep(bounds)`. Used to
 * lift the cat emblem out of the lockup: the emblem's leaves overlap the "J"
 * horizontally, so no straight vertical cut separates them, but every piece of
 * the emblem ends left of where the lettering's pieces end.
 */
function keepPieces(rgba, w, h, keep) {
  const n = w * h;
  const label = new Int32Array(n);
  const result = new Uint8Array(rgba.length);
  let id = 0;
  for (let start = 0; start < n; start++) {
    if (label[start] || rgba[start * 4 + 3] === 0) continue;
    id++;
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
    if (keep(bounds)) {
      for (const i of pixels) {
        result.set(rgba.subarray(i * 4, i * 4 + 4), i * 4);
      }
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

// The seed points sit in the bowl of the "d", the one enclosed region in each
// file that is background rather than artwork.
const plumLockup = await cutOut("lockup-plum.webp", {
  tolerance: 3,
  holes: [[1571, 506]],
});
const plumWordmark = await cutOut("wordmark-plum.webp", {
  tolerance: 12,
  holes: [[1402, 429]],
});
const creamLockup = await cutOut("lockup-cream.webp", {
  tolerance: 12,
  holes: [[1571, 506]],
  lighterIsBg: true,
});

// Every piece of the emblem ends before x = 820; every piece of the lettering
// (the "J" included) ends after it.
const EMBLEM_EDGE = 820;
const emblemOnly = (lockup) =>
  keepPieces(lockup.rgba, lockup.w, lockup.h, (b) => b.x1 < EMBLEM_EDGE);
const letteringOnly = (lockup) =>
  keepPieces(lockup.rgba, lockup.w, lockup.h, (b) => b.x1 >= EMBLEM_EDGE);

// The files come in pairs, one for dark backgrounds and one for light, and
// each pair shares a size so one can stand in for the other. Sizes are even,
// so the half-size images come out whole.
const LOCKUP = [1538, 626];
const WORDMARK = [1368, 552];
const EMBLEM = [670, 626];

/**
 * Centers a cut-out on a transparent canvas of exactly this size. Only empty
 * margin is added or trimmed; with `enlarge`, the artwork is first scaled up
 * until it fills the canvas to the same margin `trimmed` leaves.
 */
async function onCanvas(png, [width, height], { enlarge = false } = {}) {
  if (enlarge) {
    const from = await sharp(png).metadata();
    const factor = Math.min(
      (width - 2 * TRIM_PAD) / (from.width - 2 * TRIM_PAD),
      (height - 2 * TRIM_PAD) / (from.height - 2 * TRIM_PAD),
    );
    png = await sharp(png)
      .resize({ width: Math.round(from.width * factor), kernel: "lanczos3" })
      .png()
      .toBuffer();
  }
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

const cutOuts = {
  // For dark backgrounds — what the site itself uses.
  wordmark: await onCanvas(
    await trimmed(plumWordmark.rgba, plumWordmark.w, plumWordmark.h),
    WORDMARK,
  ),
  lockup: await onCanvas(
    await trimmed(plumLockup.rgba, plumLockup.w, plumLockup.h),
    LOCKUP,
  ),
  emblem: await onCanvas(
    await trimmed(emblemOnly(plumLockup), plumLockup.w, plumLockup.h),
    EMBLEM,
  ),
  // For light backgrounds — press kit only.
  "lockup-light": await onCanvas(
    await trimmed(creamLockup.rgba, creamLockup.w, creamLockup.h),
    LOCKUP,
  ),
  // There is no dark wordmark drawn by itself, so this one is the lettering
  // lifted out of the light-background lockup, where it is drawn smaller, and
  // enlarged to the size of the other wordmark.
  "wordmark-light": await onCanvas(
    await trimmed(letteringOnly(creamLockup), creamLockup.w, creamLockup.h),
    WORDMARK,
    { enlarge: true },
  ),
  // The emblem from the same lockup, whose edges were drawn against cream.
  "emblem-light": await onCanvas(
    await trimmed(emblemOnly(creamLockup), creamLockup.w, creamLockup.h),
    EMBLEM,
  ),
};

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

await mkdir(pub("press"), { recursive: true });
const png = { compressionLevel: 9, palette: false };
await sharp(cutOuts.lockup)
  .png(png)
  .toFile(pub("press/jinxwood-logo-for-dark.png"));
await sharp(cutOuts["lockup-light"])
  .png(png)
  .toFile(pub("press/jinxwood-logo-for-light.png"));
await sharp(cutOuts.wordmark)
  .png(png)
  .toFile(pub("press/jinxwood-wordmark-for-dark.png"));
await sharp(cutOuts["wordmark-light"])
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
// Generated sizes
// ---------------------------------------------------------------------------

await writeFile(
  join(root, "src/app/_lib/brand.gen.ts"),
  `// Generated by scripts/build-brand.mjs — do not edit by hand.\n` +
    `// Intrinsic pixel sizes of the generated images, so <img> elements can\n` +
    `// reserve their space before the file arrives.\n` +
    `export const IMAGE_SIZES = ${JSON.stringify(sizes, null, 2)} as const;\n`,
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
