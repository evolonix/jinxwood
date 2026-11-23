// Composes the iPhone Duo wallpapers in brand/wallpapers/ from the published
// logo files and the forest art.
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
// It comes in dark and light, on a flat brand color and on the forest art:
// four files. The site serves none of them; they are set by hand on the
// phone. Output is committed, so this only needs to run when the logos or the
// forest art change, after `npm run build:brand`.
//
// Run with: npm run build:wallpapers

import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "brand/wallpapers");
const press = (f) => join(root, "public/press", f);

const NIGHT = "#2B1E3F";
const NIGHT_DEEP = "#1A122D";
const PARCHMENT = "#F4EDE0";

// The Duo's screens in pixels: the outer one, and the inner one both ways up.
const OUTER = [1398, 2034];
const UPRIGHT = [2007, 2853];
const SIDEWAYS = [2853, 2007];

const WIDTH = SIDEWAYS[0];
/** How much of the image's height an unzoomed view of a screen shows. */
const viewHeight = ([w, h]) => (WIDTH * h) / w;

// The top part is the sideways screen itself. The bottom part is as tall as
// the taller of the two upright views, so neither reaches into the top part.
const LOGO_PART = SIDEWAYS[1];
const EMBLEM_PART = Math.ceil(Math.max(viewHeight(OUTER), viewHeight(UPRIGHT)));
const HEIGHT = LOGO_PART + EMBLEM_PART;

// The published logo files, as build-brand.mjs writes them. `axis` is the
// middle of the artwork left to right, in the file's own pixels, and `art` is
// the artwork's width. Both leave out the trademark symbol: it hangs past the
// lettering on the logo, so centering the whole canvas would sit the artwork
// left of center. `size` is the canvas those two were measured on; if a file
// stops matching it, they need measuring again.
const LOGOS = {
  emblem: {
    file: (mode) => press(`jinxwood-emblem-for-${mode}.png`),
    size: [670, 626],
    axis: 334.5,
    art: 653,
  },
  logo: {
    file: (mode) => press(`jinxwood-logo-for-${mode}.png`),
    size: [1592, 626],
    axis: 769,
    art: 1521,
  },
};

// Where each logo sits on the image. `artWidth` is how wide its artwork is
// drawn and `middle` is the row its artwork is centered on. The logo fills
// about two thirds of the sideways screen. The emblem fills a little over
// half of an upright one, centered between the middles of the two unzoomed
// upright views, which both end at the bottom of the image. Both are drawn
// larger than the published files, so they are slightly soft at full zoom.
const PLACED = [
  { logo: "logo", artWidth: 1977, middle: LOGO_PART / 2 },
  {
    logo: "emblem",
    artWidth: 1564,
    middle: HEIGHT - (viewHeight(OUTER) + viewHeight(UPRIGHT)) / 4,
  },
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
 * on the image and top to bottom on its `middle`, and the box the artwork
 * fills there.
 */
async function logoLayer({ logo: name, artWidth, middle }, mode) {
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
      left: Math.round(WIDTH / 2 - logo.axis * scale),
      top: Math.round(middle - ((first + last) / 2) * scale),
    },
    box: {
      cx: WIDTH / 2,
      cy: middle,
      width: artWidth,
      height: (last - first) * scale,
    },
  };
}

/** The forest art cropped around the castle to fill a part `height` tall. */
async function forest(height) {
  const art = sharp(join(root, "brand/source/hero.webp"));
  const meta = await art.metadata();
  const width = Math.min(
    meta.width,
    Math.round((meta.height * WIDTH) / height),
  );
  const castle = meta.width * 0.35 + (meta.height * 0.75) / 2;
  const left = Math.max(
    0,
    Math.min(meta.width - width, Math.round(castle - width / 2)),
  );
  return art
    .extract({ left, top: 0, width, height: meta.height })
    .resize({ width: WIDTH, height, kernel: "lanczos3" })
    .png()
    .toBuffer();
}

/**
 * A wash over the forest art so the logos read against it: a flat tint of
 * `color` at `base` opacity, plus a soft pool of it behind each logo that is
 * `pool` opaque at its middle.
 */
const wash = (boxes, color, base, pool) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs><radialGradient id="g"><stop offset="0" stop-color="${color}" stop-opacity="${pool}"/><stop offset="0.6" stop-color="${color}" stop-opacity="${pool * 0.6}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>
  <rect width="100%" height="100%" fill="${color}" fill-opacity="${base}"/>
  ${boxes
    .map(
      (box) =>
        `<ellipse cx="${box.cx}" cy="${box.cy}" rx="${box.width * 0.85}" ry="${box.height * 0.95}" fill="url(#g)"/>`,
    )
    .join("\n  ")}
</svg>`);

const canvas = (background) =>
  sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 3, background },
  });

await mkdir(out, { recursive: true });

// Each part gets its own crop of the forest art, so each view shows the
// castle and bridge whole. The line where the two crops meet is the edge of
// the top part, which no unzoomed view crosses.
const art = await canvas(NIGHT)
  .composite([
    { input: await forest(LOGO_PART), left: 0, top: 0 },
    { input: await forest(EMBLEM_PART), left: 0, top: LOGO_PART },
  ])
  .png()
  .toBuffer();
// There is no light version of the forest art, so the light wallpaper uses
// the same art with its color turned down under a heavy parchment wash.
const pale = await sharp(art).modulate({ saturation: 0.55 }).png().toBuffer();

for (const mode of ["dark", "light"]) {
  const placed = await Promise.all(PLACED.map((p) => logoLayer(p, mode)));
  const layers = placed.map((p) => p.layer);
  const boxes = placed.map((p) => p.box);
  const name = `jinxwood-duo-${mode}`;

  await canvas(mode === "dark" ? NIGHT : PARCHMENT)
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toFile(join(out, `${name}-flat.png`));

  const [base, tint] =
    mode === "dark"
      ? [art, wash(boxes, NIGHT_DEEP, 0.5, 0.55)]
      : [pale, wash(boxes, PARCHMENT, 0.8, 0.75)];
  await sharp(base)
    .composite([{ input: tint }, ...layers])
    .jpeg({ quality: 95, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(join(out, `${name}-forest.jpg`));

  console.log(`${name}: ${WIDTH}x${HEIGHT}, flat and forest`);
}
