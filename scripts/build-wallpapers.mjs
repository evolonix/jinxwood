// Composes the iPhone Duo wallpapers in brand/wallpapers/ from the published
// logo files and the forest art. The artwork sits dead center on each screen,
// left to right and top to bottom.
//
//   outer            1398 x 2034  emblem, for the closed phone
//   inner-portrait   2007 x 2853  emblem, for the open phone held upright
//   inner-landscape  2853 x 2007  logo, for the open phone held sideways
//
// Each comes in dark and light, on a flat brand color and on the forest art:
// twelve files. The site serves none of them; they are set by hand on the
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

// `artWidth` is how wide the artwork is drawn, in screen pixels. All three
// enlarge the published files (the emblem is 653 wide there), so the artwork
// is slightly soft at full zoom.
const SCREENS = [
  { key: "outer", width: 1398, height: 2034, logo: "emblem", artWidth: 860 },
  {
    key: "inner-portrait",
    width: 2007,
    height: 2853,
    logo: "emblem",
    artWidth: 1100,
  },
  {
    key: "inner-landscape",
    width: 2853,
    height: 2007,
    logo: "logo",
    artWidth: 1977,
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
 * A screen's logo as a composite layer with its artwork centered on the
 * screen, and the box the artwork fills there.
 */
async function logoLayer(screen, mode) {
  const logo = LOGOS[screen.logo];
  const file = logo.file(mode);
  const meta = await sharp(file).metadata();
  if (meta.width !== logo.size[0] || meta.height !== logo.size[1])
    throw new Error(
      `${file} is ${meta.width}x${meta.height}, not ${logo.size.join("x")}: measure its artwork again`,
    );

  const scale = screen.artWidth / logo.art;
  const input = await sharp(file)
    .resize({ width: Math.round(meta.width * scale), kernel: "lanczos3" })
    .png()
    .toBuffer();
  const [first, last] = await artRows(file);
  return {
    layer: {
      input,
      left: Math.round(screen.width / 2 - logo.axis * scale),
      top: Math.round(screen.height / 2 - ((first + last) / 2) * scale),
    },
    box: {
      cx: screen.width / 2,
      cy: screen.height / 2,
      width: screen.artWidth,
      height: (last - first) * scale,
    },
  };
}

const flat = (screen, color) =>
  sharp({
    create: {
      width: screen.width,
      height: screen.height,
      channels: 3,
      background: color,
    },
  })
    .png()
    .toBuffer();

/** The forest art cropped to the screen's shape around the castle. */
async function forest(screen) {
  const art = sharp(join(root, "brand/source/hero.webp"));
  const meta = await art.metadata();
  const width = Math.min(
    meta.width,
    Math.round((meta.height * screen.width) / screen.height),
  );
  const castle = meta.width * 0.35 + (meta.height * 0.75) / 2;
  const left = Math.max(
    0,
    Math.min(meta.width - width, Math.round(castle - width / 2)),
  );
  return art
    .extract({ left, top: 0, width, height: meta.height })
    .resize({ width: screen.width, height: screen.height, kernel: "lanczos3" })
    .png()
    .toBuffer();
}

/**
 * A wash over the forest art so the logo reads against it: a flat tint of
 * `color` at `base` opacity, plus a soft pool of it behind the logo that is
 * `pool` opaque at its middle.
 */
const wash = (screen, box, color, base, pool) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${screen.width}" height="${screen.height}">
  <defs><radialGradient id="g"><stop offset="0" stop-color="${color}" stop-opacity="${pool}"/><stop offset="0.6" stop-color="${color}" stop-opacity="${pool * 0.6}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>
  <rect width="100%" height="100%" fill="${color}" fill-opacity="${base}"/>
  <ellipse cx="${box.cx}" cy="${box.cy}" rx="${box.width * 0.85}" ry="${box.height * 0.95}" fill="url(#g)"/>
</svg>`);

await mkdir(out, { recursive: true });

for (const screen of SCREENS) {
  const art = await forest(screen);
  // There is no light version of the forest art, so the light wallpaper uses
  // the same art with its color turned down under a heavy parchment wash.
  const pale = await sharp(art).modulate({ saturation: 0.55 }).png().toBuffer();

  for (const mode of ["dark", "light"]) {
    const { layer, box } = await logoLayer(screen, mode);
    const name = `jinxwood-duo-${screen.key}-${mode}`;

    await sharp(await flat(screen, mode === "dark" ? NIGHT : PARCHMENT))
      .composite([layer])
      .png({ compressionLevel: 9 })
      .toFile(join(out, `${name}-flat.png`));

    const [base, tint] =
      mode === "dark"
        ? [art, wash(screen, box, NIGHT_DEEP, 0.5, 0.55)]
        : [pale, wash(screen, box, PARCHMENT, 0.8, 0.75)];
    await sharp(base)
      .composite([{ input: tint }, layer])
      .jpeg({ quality: 95, chromaSubsampling: "4:4:4", mozjpeg: true })
      .toFile(join(out, `${name}-forest.jpg`));

    console.log(`${name}: ${screen.width}x${screen.height}, flat and forest`);
  }
}
