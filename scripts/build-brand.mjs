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
 * Anti-aliased edge pixels are a blend of artwork and the old background, so
 * leaving them as they are would draw a fringe of the old color on any new
 * background. Each one is un-mixed instead: its color becomes the nearest
 * solid artwork color and its alpha becomes how far it sits between the
 * background and that color.
 */
function keyBackground(
  rgb,
  w,
  h,
  { tolerance, holes = [], lighterIsBg = false },
) {
  const n = w * h;
  const bg = [rgb[0], rgb[1], rgb[2]];
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
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (i >= w) push(i - w);
    if (i < n - w) push(i + w);
  }

  // Edge pixels: artwork within two pixels of the background.
  const near = dilate(dilate(out, w, h), w, h);
  const rgba = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    if (out[i]) continue;
    let r = rgb[i * 3];
    let g = rgb[i * 3 + 1];
    let b = rgb[i * 3 + 2];
    let a = 255;
    if (near[i]) {
      const core = nearestCore(i);
      if (core >= 0) {
        const fr = rgb[core * 3] - bg[0];
        const fg = rgb[core * 3 + 1] - bg[1];
        const fb = rgb[core * 3 + 2] - bg[2];
        const len = fr * fr + fg * fg + fb * fb;
        if (len > 0) {
          const t =
            ((r - bg[0]) * fr + (g - bg[1]) * fg + (b - bg[2]) * fb) / len;
          a = Math.round(255 * Math.min(1, Math.max(0, t)));
          r = rgb[core * 3];
          g = rgb[core * 3 + 1];
          b = rgb[core * 3 + 2];
        }
      }
    }
    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = b;
    rgba[i * 4 + 3] = a;
  }
  return rgba;

  /** Closest artwork pixel that is clear of the edge, within a few pixels. */
  function nearestCore(i) {
    const x0 = i % w;
    const y0 = (i / w) | 0;
    let best = -1;
    let bestD = Infinity;
    for (let dy = -4; dy <= 4; dy++) {
      const y = y0 + dy;
      if (y < 0 || y >= h) continue;
      for (let dx = -4; dx <= 4; dx++) {
        const x = x0 + dx;
        if (x < 0 || x >= w) continue;
        const j = y * w + x;
        if (out[j] || near[j]) continue;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = j;
        }
      }
    }
    return best;
  }
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

/** Crops RGBA to its visible pixels plus a little padding; returns a sharp. */
function trimmed(rgba, w, h, pad = 8) {
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
  tolerance: 6,
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

const cutOuts = {
  // For dark backgrounds — what the site itself uses.
  wordmark: await trimmed(plumWordmark.rgba, plumWordmark.w, plumWordmark.h),
  lockup: await trimmed(plumLockup.rgba, plumLockup.w, plumLockup.h),
  emblem: await trimmed(emblemOnly(plumLockup), plumLockup.w, plumLockup.h),
  // For light backgrounds — press kit only.
  "lockup-light": await trimmed(creamLockup.rgba, creamLockup.w, creamLockup.h),
  // There is no dark wordmark drawn by itself, so this one is the lettering
  // lifted out of the light-background lockup.
  "wordmark-light": await trimmed(
    letteringOnly(creamLockup),
    creamLockup.w,
    creamLockup.h,
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
  "wordmark-light": [640, 960],
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
await sharp(cutOuts.emblem).png(png).toFile(pub("press/jinxwood-emblem.png"));
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
