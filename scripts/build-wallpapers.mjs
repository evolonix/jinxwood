// Composes the downloads on the wallpapers page from the published logo
// files and the forest art: a set each for phones, tablets and desktops in
// general, and for the 16-inch MacBook Pro and the iPhone Duo. Each comes in
// dark and light, on a flat brand color and on the forest art, so four files
// per set. The desktop, the MacBook Pro and the Duo have a fifth: the picture
// of Jinx in the tree, with the wordmark beside the hollow.
//
//   public/wallpapers/      the wallpapers themselves
//   public/img/wallpapers/  a small picture of each, shown beside its download
//
// The names and sizes are repeated in WALLPAPERS in src/app/_lib/content.ts,
// which is what the page lists. Output is committed, so this only needs to run
// when the logos or the forest art change, after `npm run build:brand`.
//
// Run with: npm run build:wallpapers
//
// iPhone Duo
//
// The Duo takes one wallpaper image for all three of its views, and the
// wallpaper editor lets each view be moved and zoomed over it separately. So
// each wallpaper is one tall image with a part for each view:
//
//   +-------------+
//   |    logo     |  top: the inner screen held sideways (2853 x 2007)
//   +-------------+
//   |             |
//   |   emblem    |  bottom: the inner screen held upright (2007 x 2853)
//   |             |          and the outer screen (1398 x 2034)
//   +-------------+
//
// The image is as wide as the sideways screen, so an unzoomed view is always
// the full width and only slides up and down. Dragged all the way up, the
// sideways view is exactly the top part. Dragged all the way down, the two
// upright views are the bottom part: the outer screen all of it, the inner
// screen all but a sliver at its top.
//
// The artwork is dead center left to right in every view, and the logo is
// dead center top to bottom. The two upright screens are not quite the same
// shape, so the emblem is set halfway between their two middles, less than a
// millimeter from center on either.
//
// The others
//
// One screen each, with the artwork dead center on it:
//
//   phone        1440 x 3120  emblem  a tall phone screen, iPhone or Android
//   tablet       2752 x 2752  logo    square, so it fills the screen whichever
//                                     way the tablet is turned
//   desktop      3840 x 2160  logo    a 16:9 monitor, at 4K
//   MacBook Pro  3456 x 2234  logo    the 16-inch screen
//
// The logo is drawn at the size of the published file, so it is not enlarged.
// The phone's emblem fills about half the width, smaller than its master.

import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public/wallpapers");
const previews = join(root, "public/img/wallpapers");
const press = (f) => join(root, "public/press", f);

const NIGHT = "#2B1E3F";
const NIGHT_DEEP = "#1A122D";
const PARCHMENT = "#F4EDE0";

// The logo files, as build-brand.mjs writes them. The emblem is the master,
// which is the same for dark and light. The logo is the press download, which
// carries the trademark symbol. `axis` is the middle of the artwork left to
// right, in the file's own pixels, and `art` is the artwork's width. Both
// leave out the trademark symbol: it hangs past the lettering on the logo, so
// centering the whole canvas would sit the artwork left of center. `size` is
// the canvas those two were measured on; if a file stops matching it, they
// need measuring again.
const LOGOS = {
  emblem: {
    file: () => join(root, "brand/masters/jinxwood-emblem.png"),
    size: [1279, 1197],
    axis: 639.5,
    art: 1263,
  },
  logo: {
    file: (mode) => press(`jinxwood-logo-for-${mode}.png`),
    size: [1600, 628],
    axis: 769,
    art: 1522,
  },
};

// A wallpaper is a canvas, the parts of it that each get their own crop of
// the forest art (top to bottom, `height` each), and the logos placed on it:
// `artWidth` is how wide a logo's artwork is drawn and `middle` is the row its
// artwork is centered on. Every logo is centered left to right. `preview` is
// the width of the small picture of it on the wallpapers page.

/** The Duo's one tall image, laid out as the note at the top describes. */
function duo() {
  // The Duo's screens in pixels: the outer one, and the inner one both ways up.
  const outer = [1398, 2034];
  const upright = [2007, 2853];
  const sideways = [2853, 2007];

  const width = sideways[0];
  // How much of the image's height an unzoomed view of a screen shows.
  const viewHeight = ([w, h]) => (width * h) / w;

  // The top part is the sideways screen itself. The bottom part is as tall as
  // the taller of the two upright views, so neither reaches into the top part.
  const logoPart = sideways[1];
  const emblemPart = Math.ceil(
    Math.max(viewHeight(outer), viewHeight(upright)),
  );
  const height = logoPart + emblemPart;

  return {
    name: "jinxwood-duo",
    width,
    height,
    preview: 560,
    parts: [logoPart, emblemPart],
    // The logo fills about two thirds of the sideways screen. The emblem
    // fills a little over half of an upright one, centered between the
    // middles of the two unzoomed upright views, which both end at the bottom
    // of the image. Both are drawn larger than their files, the logo by nearly
    // a third and the emblem by about a quarter, so they are slightly soft at
    // full zoom.
    placed: [
      { logo: "logo", artWidth: 1977, middle: logoPart / 2 },
      {
        logo: "emblem",
        artWidth: 1564,
        middle: height - (viewHeight(outer) + viewHeight(upright)) / 4,
      },
    ],
  };
}

/** One screen with one logo in the middle of it. */
const screen = (name, [width, height], logo, artWidth, preview) => ({
  name,
  width,
  height,
  preview,
  parts: [height],
  placed: [{ logo, artWidth, middle: height / 2 }],
});

// The screens in the note at the top, in the order the page lists them.
const SCREENS = [
  screen("jinxwood-phone", [1440, 3120], "emblem", 792, 560),
  screen("jinxwood-tablet", [2752, 2752], "logo", LOGOS.logo.art, 640),
  screen("jinxwood-desktop", [3840, 2160], "logo", LOGOS.logo.art, 960),
  screen("jinxwood-macbook-pro-16", [3456, 2234], "logo", LOGOS.logo.art, 960),
];

/** The first row of a logo file that holds artwork, and the row after the last. */
async function artRows(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const solid = (y) => {
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) return true;
    return false;
  };
  let top = 0;
  let bottom = info.height - 1;
  while (!solid(top)) top++;
  while (!solid(bottom)) bottom--;
  return [top, bottom + 1];
}

/**
 * A placed logo as a composite layer, with its artwork centered left to right
 * on a canvas `width` wide and top to bottom on its `middle`, and the box the
 * artwork fills there.
 */
async function logoLayer({ logo: name, artWidth, middle }, mode, width) {
  const logo = LOGOS[name];
  const file = logo.file(mode);
  const meta = await sharp(file).metadata();
  if (meta.width !== logo.size[0] || meta.height !== logo.size[1])
    throw new Error(
      `${file} is ${meta.width}x${meta.height}, not ${logo.size.join("x")}: measure its artwork again`,
    );

  const scale = artWidth / logo.art;
  const input = await sharp(file)
    .resize({ width: Math.round(meta.width * scale), kernel: "lanczos3" })
    .png()
    .toBuffer();
  const [first, last] = await artRows(file);
  return {
    layer: {
      input,
      left: Math.round(width / 2 - logo.axis * scale),
      top: Math.round(middle - ((first + last) / 2) * scale),
    },
    box: {
      cx: width / 2,
      cy: middle,
      width: artWidth,
      height: (last - first) * scale,
    },
  };
}

/** The forest art cropped around the castle to fill `width` by `height`. */
async function forest(width, height) {
  const art = sharp(join(root, "brand/source/hero.webp"));
  const meta = await art.metadata();
  const crop = Math.min(meta.width, Math.round((meta.height * width) / height));
  const castle = meta.width * 0.35 + (meta.height * 0.75) / 2;
  const left = Math.max(
    0,
    Math.min(meta.width - crop, Math.round(castle - crop / 2)),
  );
  return art
    .extract({ left, top: 0, width: crop, height: meta.height })
    .resize({ width, height, kernel: "lanczos3" })
    .png()
    .toBuffer();
}

/**
 * A wash over the forest art so the logos read against it: a flat tint of
 * `color` at `base` opacity, plus a soft pool of it behind each logo that is
 * `pool` opaque at its middle.
 */
const wash = ({ width, height }, boxes, color, base, pool) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs><radialGradient id="g"><stop offset="0" stop-color="${color}" stop-opacity="${pool}"/><stop offset="0.6" stop-color="${color}" stop-opacity="${pool * 0.6}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>
  <rect width="100%" height="100%" fill="${color}" fill-opacity="${base}"/>
  ${boxes
    .map(
      (box) =>
        `<ellipse cx="${box.cx}" cy="${box.cy}" rx="${box.width * 0.85}" ry="${box.height * 0.95}" fill="url(#g)"/>`,
    )
    .join("\n  ")}
</svg>`);

const canvas = ({ width, height }, background) =>
  sharp({ create: { width, height, channels: 3, background } });

/** Writes the small picture of a finished wallpaper file. */
async function preview(wallpaper, file) {
  const name = file.replace(/\.\w+$/, ".webp");
  await sharp(join(out, file))
    .resize({ width: wallpaper.preview })
    .webp({ quality: 80 })
    .toFile(join(previews, name));
}

/** Writes a wallpaper's four files, and a small picture of each. */
async function build(wallpaper) {
  // Each part gets its own crop of the forest art, so each view shows the
  // castle and bridge whole. Where two crops meet is the edge of a part,
  // which no unzoomed view crosses.
  const crops = [];
  let top = 0;
  for (const height of wallpaper.parts) {
    crops.push({
      input: await forest(wallpaper.width, height),
      left: 0,
      top,
    });
    top += height;
  }
  const art = await canvas(wallpaper, NIGHT).composite(crops).png().toBuffer();
  // There is no light version of the forest art, so the light wallpaper uses
  // the same art with its color turned down under a heavy parchment wash.
  const pale = await sharp(art).modulate({ saturation: 0.55 }).png().toBuffer();

  for (const mode of ["dark", "light"]) {
    const placed = await Promise.all(
      wallpaper.placed.map((p) => logoLayer(p, mode, wallpaper.width)),
    );
    const layers = placed.map((p) => p.layer);
    const boxes = placed.map((p) => p.box);
    const name = `${wallpaper.name}-${mode}`;

    await canvas(wallpaper, mode === "dark" ? NIGHT : PARCHMENT)
      .composite(layers)
      .png({ compressionLevel: 9 })
      .toFile(join(out, `${name}-flat.png`));
    await preview(wallpaper, `${name}-flat.png`);

    const [base, tint] =
      mode === "dark"
        ? [art, wash(wallpaper, boxes, NIGHT_DEEP, 0.5, 0.55)]
        : [pale, wash(wallpaper, boxes, PARCHMENT, 0.8, 0.75)];
    await sharp(base)
      .composite([{ input: tint }, ...layers])
      .jpeg({ quality: 95, chromaSubsampling: "4:4:4", mozjpeg: true })
      .toFile(join(out, `${name}-forest.jpg`));
    await preview(wallpaper, `${name}-forest.jpg`);

    console.log(
      `${name}: ${wallpaper.width}x${wallpaper.height}, flat and forest`,
    );
  }
}

// ---------------------------------------------------------------------------
// Jinx in the tree
// ---------------------------------------------------------------------------

// The picture of Jinx sitting in the hollow of the big tree, as a wallpaper,
// with the wordmark beside the hollow exactly as the logo has it beside the
// emblem: the same size against the hollow, the same distance from it and at
// the same height. The picture is 1920 x 1080 and is enlarged to fill each
// screen, so these are softer than the others.
const TREE = join(root, "brand/source/jinx-in-the-tree.webp");
// The hollow's glow in the picture, in the picture's own pixels: the row it
// is centered on, its right edge and its height.
const HOLLOW = { middle: 545, right: 516, height: 324 };
// How the logo sets its letters against the glow in its emblem, as shares of
// the glow's height, measured on the logo master: how tall the letters are,
// how far right of the glow they start, and how far above the glow's middle
// theirs is.
const AS_IN_LOGO = { height: 0.7955, gap: 0.2219, raised: 0.0224 };
// The wordmark with its trademark symbol, as the press kit has it, and its
// letters in the file's own pixels: where they start, the row they are
// centered on and how tall they are.
const WORDMARK = {
  file: press("jinxwood-wordmark-for-dark.png"),
  left: 9,
  middle: 354,
  height: 690,
};

/**
 * Part of the tree picture, enlarged to `width` by `height`, with the
 * wordmark beside the hollow unless `wordmark` is false. `from` is the
 * picture's column the part starts at.
 */
async function treePart({ from, width, height, wordmark = true }) {
  const scale = height / 1080;
  const columns = Math.round(width / scale);
  const picture = sharp(TREE)
    .extract({ left: from, top: 0, width: columns, height: 1080 })
    .resize({ width, height, fit: "fill", kernel: "lanczos3" });
  if (!wordmark) return picture.png().toBuffer();

  const meta = await sharp(WORDMARK.file).metadata();
  // Wordmark file to image pixels.
  const k = ((AS_IN_LOGO.height * HOLLOW.height) / WORDMARK.height) * scale;
  const art = await sharp(WORDMARK.file)
    .resize({ width: Math.round(meta.width * k), kernel: "lanczos3" })
    .png()
    .toBuffer();
  const left = Math.round(
    (HOLLOW.right + AS_IN_LOGO.gap * HOLLOW.height - from) * scale -
      WORDMARK.left * k,
  );
  const top = Math.round(
    (HOLLOW.middle - AS_IN_LOGO.raised * HOLLOW.height) * scale -
      WORDMARK.middle * k,
  );
  // A pool of night behind the wordmark, so it reads against the sunset and
  // the castle it lies across.
  const cx = left + (meta.width * k) / 2;
  const cy = top + (meta.height * k) / 2;
  const pool =
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs><radialGradient id="g">${[0, 0.2, 0.4, 0.6, 0.8, 1].map((at) => `<stop offset="${at}" stop-color="${NIGHT_DEEP}" stop-opacity="${(0.72 * (1 - at) ** 1.4).toFixed(4)}"/>`).join("")}</radialGradient></defs>
  <ellipse cx="${cx}" cy="${cy}" rx="${meta.width * k * 0.72}" ry="${meta.height * k * 0.95}" fill="url(#g)"/>
</svg>`);
  return sharp(await picture.png().toBuffer())
    .composite([{ input: pool }, { input: art, left, top }])
    .png()
    .toBuffer();
}

/** Writes a tree wallpaper from its parts, top to bottom, and its preview. */
async function buildTree(name, parts, previewWidth) {
  const width = parts[0].width;
  const layers = [];
  let top = 0;
  for (const part of parts) {
    layers.push({ input: await treePart(part), left: 0, top });
    top += part.height;
  }
  await sharp({
    create: { width, height: top, channels: 3, background: NIGHT },
  })
    .composite(layers)
    .jpeg({ quality: 95, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(join(out, `${name}.jpg`));
  await preview({ preview: previewWidth }, `${name}.jpg`);
  console.log(`${name}: ${width}x${top}`);
}

await mkdir(out, { recursive: true });
await mkdir(previews, { recursive: true });
for (const wallpaper of [...SCREENS, duo()]) await build(wallpaper);

// A 16:9 monitor: the whole picture.
await buildTree(
  "jinxwood-desktop-tree",
  [{ from: 0, width: 3840, height: 2160 }],
  960,
);
// The 16-inch MacBook Pro's screen is a little squarer, so a little comes off
// each side of the picture.
await buildTree(
  "jinxwood-macbook-pro-16-tree",
  [{ from: 124, width: 3456, height: 2234 }],
  960,
);
// The Duo, laid out as its other wallpapers are. The top part, for the inner
// screen held sideways, is the picture from its left edge to just past the
// castle, with the wordmark. The bottom part, for the two upright views, is
// the tree with the hollow in the middle and no wordmark: there is no room
// for it at the logo's size.
{
  const { width, parts } = duo();
  await buildTree(
    "jinxwood-duo-tree",
    [
      { from: 0, width, height: parts[0] },
      { from: 29, width, height: parts[1], wordmark: false },
    ],
    560,
  );
}
