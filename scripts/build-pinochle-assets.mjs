// Optimizes the Pinochle app's marketing assets into public/media/pinochle/img/
// for the web.
//
//   store-raw/*.png            ->  shots/*.webp    (device screenshots)
//   gc-assets/*.png            ->  gc/*.webp       (Game Center card art)
//   Assets/Icons/icon-1024.png ->  app-icon.webp   (in-page app icon)
//
// Source lives in the app repo (a Unity project), expected beside this one as
// ../pinochle-app. Override with PINOCHLE_DIR=/path/to/pinochle-app if it lives
// elsewhere. The optimized outputs are committed to this repo, so CI never
// needs the source.
//
// Run with: npm run build:pinochle

import { existsSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = process.env.PINOCHLE_DIR || join(repoRoot, "..", "pinochle-app");

// Raw device captures, not Docs/store-shots — those are App Store panels with
// marketing headlines baked in, and this site frames the shots itself.
const shotsSrc = join(SRC, "Builds", "store-raw");
const gcSrc = join(SRC, "Docs", "gc-assets");
const iconSrc = join(SRC, "Assets", "Icons", "icon-1024.png");

const img = join(repoRoot, "public", "media", "pinochle", "img");
const shotsOut = join(img, "shots");
const gcOut = join(img, "gc");

if (!existsSync(SRC)) {
  console.error(
    `\nSource app project not found at:\n  ${SRC}\n\n` +
      `Set PINOCHLE_DIR to the Pinochle app repo, e.g.\n` +
      `  PINOCHLE_DIR=/path/to/pinochle-app npm run build:pinochle\n`,
  );
  process.exit(1);
}

await mkdir(shotsOut, { recursive: true });
await mkdir(gcOut, { recursive: true });

let count = 0;

// Screenshots: cap the long edge at 1200px — the gallery shows them at most
// ~560 CSS px wide, so that is still crisp on a 2x screen.
//
// The felt is a shallow gradient the game dithers to keep it from banding into
// concentric rings. Two things would undo that: an 8-bit resize (it averages
// the noise away and rounds the gradient back into steps) and lossy WebP (it
// flattens smooth areas, whatever the quality). So: resize in 16 bits, dither
// back down to 8 with the game's own noise, and save near-lossless.
// ~200–500 KB a shot instead of ~40 KB, but no rings.
async function ditheredShot(input, output) {
  const { data, info } = await sharp(input)
    .removeAlpha()
    .pipelineColourspace("rgb16")
    .toColourspace("rgb16")
    .resize({
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true,
    })
    .raw({ depth: "ushort" })
    .toBuffer({ resolveWithObject: true });
  const px = new Uint16Array(data.buffer, data.byteOffset, data.length / 2);
  const out = Buffer.alloc(info.width * info.height * 3);
  for (let y = 0, i = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      // Interleaved gradient noise (Jimenez), as in the app's FeltGlow shader.
      const f = 52.9829189 * ((0.06711056 * x + 0.00583715 * y) % 1);
      const n = f - Math.floor(f) - 0.5;
      for (let c = 0; c < 3; c++, i++)
        out[i] = Math.max(0, Math.min(255, Math.round(px[i] / 257 + n)));
    }
  await sharp(out, {
    raw: { width: info.width, height: info.height, channels: 3 },
  })
    .webp({ nearLossless: true, quality: 60, effort: 6 })
    .toFile(output);
}

if (existsSync(shotsSrc)) {
  const files = (await readdir(shotsSrc)).filter((f) => f.endsWith(".png"));
  for (const file of files) {
    await ditheredShot(
      join(shotsSrc, file),
      join(shotsOut, file.replace(/\.png$/, ".webp")),
    );
    count++;
  }
  console.log(`  shots:  ${files.length} -> shots/*.webp`);
}

// Game Center card art: 512², webp quality 82.
if (existsSync(gcSrc)) {
  const files = (await readdir(gcSrc)).filter((f) => f.endsWith(".png"));
  for (const file of files) {
    const out = join(gcOut, file.replace(/\.png$/, ".webp"));
    await sharp(join(gcSrc, file))
      .resize({
        width: 512,
        height: 512,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(out);
    count++;
  }
  console.log(`  gc:     ${files.length} -> gc/*.webp`);
}

// App icon -> the in-page webp. The site's own favicon and app icons are the
// studio's, from scripts/build-brand.mjs.
if (existsSync(iconSrc)) {
  await sharp(iconSrc)
    .resize(512, 512)
    .webp({ quality: 90 })
    .toFile(join(img, "app-icon.webp"));
  count += 1;
  console.log(`  icon:   -> app-icon.webp`);
}

console.log(`\nOptimized ${count} assets into public/media/pinochle/img/.`);
