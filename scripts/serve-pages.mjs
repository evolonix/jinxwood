// Serves dist/ the way GitHub Pages does, for checking the production build:
//
//   npm run build && npm run preview:pages
//
// `vite preview` falls back to index.html for any unknown path, which hides
// exactly the behavior worth testing. GitHub Pages does not: it serves a file,
// or a directory's index.html (redirecting the bare path to the trailing-slash
// form), or 404.html with a real 404 status. This does the same, so the static
// route pages and the 404.html redirect can be seen working.

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const port = Number(process.argv[2] ?? 5178);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
};

const isFile = (path) => existsSync(path) && statSync(path).isFile();
const isDir = (path) => existsSync(path) && statSync(path).isDirectory();

createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  // normalize() collapses any "../" so a request cannot climb out of dist.
  const path = join(dist, normalize(decodeURIComponent(url.pathname)));

  const send = (file, status = 200) => {
    res.writeHead(status, {
      "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
    });
    createReadStream(file).pipe(res);
  };

  if (isFile(path)) return send(path);
  if (isDir(path) && isFile(join(path, "index.html"))) {
    if (!url.pathname.endsWith("/")) {
      res.writeHead(301, { Location: `${url.pathname}/${url.search}` });
      return res.end();
    }
    return send(join(path, "index.html"));
  }
  send(join(dist, "404.html"), 404);
}).listen(port, () => {
  console.log(`serve-pages: dist/ at http://localhost:${port}`);
});
