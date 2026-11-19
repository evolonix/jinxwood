// Turns the SPA build into something a search engine can actually index.
//
// GitHub Pages has no server-side rewrite: it serves a file or it serves
// 404.html. Every route but "/" therefore answers with a real HTTP 404 status,
// and the SPA fallback in 404.html only repairs that *after* JavaScript runs —
// too late for a crawler, which has already recorded a missing page.
//
// So after `vite build`, copy dist/index.html to a directory per route and
// stamp each copy with that route's own <title>, description and canonical
// (from the same PAGES table the runtime hook uses). GitHub Pages then answers
// /press/ with 200 and correct metadata before a line of JS executes; React
// Router takes over from there and renders the same page. Also emits
// sitemap.xml from the same table so the URL list can't drift either, and
// robots.txt. While the site is held out of search (INDEXABLE in seo.ts), every
// page is stamped noindex instead and the sitemap is left out.
//
// Two things about loading are fixed up on the way: the heading font gets a
// preload (its hashed filename is only known after the build), and the hero
// image preload is kept on the home page alone, the only page that shows it.
//
// Runs as part of `npm run build`.

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalUrl,
  INDEXABLE,
  isNoindex,
  PAGES,
  SITE_URL,
  SOCIAL_IMAGE,
} from "../src/app/_lib/seo.ts";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(repoRoot, "dist");

// The Latin cut of each variable font is what every page needs for its first
// paint. Fraunces's "full" file carries the SOFT and WONK axes the headings use.
const fontFiles = (await readdir(join(dist, "assets"))).filter((file) =>
  /^(fraunces-latin-full-normal|nunito-sans-latin-wght-normal)-.*\.woff2$/.test(
    file,
  ),
);
if (fontFiles.length !== 2) {
  throw new Error(
    `build-routes: expected 2 font files to preload, found ${fontFiles.length}`,
  );
}
const fontPreloads = fontFiles
  .map(
    (file) =>
      `<link rel="preload" as="font" type="font/woff2" href="/assets/${file}" crossorigin />`,
  )
  .join("\n    ");

const shell = (await readFile(join(dist, "index.html"), "utf8")).replace(
  "</title>",
  `</title>\n    ${fontPreloads}`,
);

/** The hero art only appears on "/", so only "/" should fetch it early. */
function withoutHeroPreload(html) {
  return html.replace(/\s*<link\b[^>]*\bdata-hero-preload\b[^>]*>/g, "");
}

/** Replace a whole tag when it's there, otherwise append to <head>. */
function upsert(html, pattern, tag) {
  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace("</head>", `    ${tag}\n  </head>`);
}

function withMeta(html, path, seo) {
  const { title, description } = seo;
  const noindex = isNoindex(seo);
  const url = canonicalUrl(path);
  let out = html;
  out = upsert(
    out,
    /<meta\s+name="robots"[^>]*>/s,
    `<meta name="robots" content="${noindex ? "noindex, follow" : "index, follow"}" />`,
  );
  out = out.replace(/<title>.*?<\/title>/s, `<title>${escape(title)}</title>`);
  out = upsert(
    out,
    /<meta\s+name="description"[^>]*>/s,
    `<meta name="description" content="${escape(description)}" />`,
  );
  out = upsert(
    out,
    /<meta\s+property="og:title"[^>]*>/s,
    `<meta property="og:title" content="${escape(title)}" />`,
  );
  out = upsert(
    out,
    /<meta\s+property="og:description"[^>]*>/s,
    `<meta property="og:description" content="${escape(description)}" />`,
  );
  out = upsert(
    out,
    /<meta\s+property="og:url"[^>]*>/s,
    `<meta property="og:url" content="${url}" />`,
  );
  out = upsert(
    out,
    /<meta\s+property="og:image"[^>]*>/s,
    `<meta property="og:image" content="${SOCIAL_IMAGE}" />`,
  );
  out = upsert(
    out,
    /<link\s+rel="canonical"[^>]*>/s,
    noindex ? "" : `<link rel="canonical" href="${url}" />`,
  );
  return out;
}

/** Minimal escaping — these strings land inside a double-quoted attribute. */
function escape(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const written = [];
for (const [path, seo] of Object.entries(PAGES)) {
  const html = withMeta(
    path === "/" ? shell : withoutHeroPreload(shell),
    path,
    seo,
  );
  // "/" is dist/index.html itself; every other route gets its own directory,
  // which is the form GitHub Pages redirects the bare path to.
  const file =
    path === "/"
      ? join(dist, "index.html")
      : join(dist, path.replace(/^\//, ""), "index.html");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
  written.push(path);
}

// Crawling stays allowed either way: while the site is held back, a crawler
// has to be able to fetch a page to see its noindex.
const robots = ["User-agent: *", "Allow: /"];

if (INDEXABLE) {
  const urls = Object.entries(PAGES)
    .filter(([, seo]) => !isNoindex(seo))
    .map(([path]) => `  <url><loc>${canonicalUrl(path)}</loc></url>`)
    .join("\n");

  await writeFile(
    join(dist, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
  robots.push("", `Sitemap: ${SITE_URL}/sitemap.xml`);
}

await writeFile(join(dist, "robots.txt"), robots.join("\n") + "\n");

console.log(
  `build-routes: wrote ${written.length} route pages (${written.join(", ")}) + robots.txt` +
    (INDEXABLE
      ? " + sitemap.xml"
      : "; held out of search, so noindex and no sitemap"),
);
