# Jinxwood

The website for Jinxwood, the gaming brand of Evolonix LLC: <https://jinxwood.games>.

A small static site: a home page, a games index with a page per game, a press and brand kit page, and privacy and terms pages.

## Stack

React 19, Vite 8, TypeScript, Tailwind CSS 4, and file-based routing from [`@evolonix/react-router-next`](https://www.npmjs.com/package/@evolonix/react-router-next) (routes live in `src/app/**/page.tsx`). It is the same toolchain as the Pinochle site and jasonruesch.dev. Hosted on GitHub Pages.

## Develop

```bash
nvm use
```

```bash
npm install
```

```bash
npm run dev
```

| Script                  | What it does                                                     |
| ----------------------- | ---------------------------------------------------------------- |
| `npm run dev`           | Dev server                                                       |
| `npm run build`         | Type-check, build, then write a static page per route            |
| `npm run preview`       | Serve the production build                                       |
| `npm run preview:pages` | Serve the production build the way GitHub Pages does (real 404s) |
| `npm run lint`          | ESLint                                                           |
| `npm run format`        | Prettier, writing changes (`format:check` only reports)          |
| `npm run build:brand`   | Regenerate every brand image from `brand/source/`                |

## Where things are

- `src/app/_lib/content.ts` holds every fact and string the site states: the studio, the games, the press kit, the policy dates.
- `src/app/_lib/seo.ts` holds each route's search title and description.
- `src/index.css` holds the design tokens: the four brand colours and the tones built from them, the fonts, and the motion.
- `brand/source/` holds the source art. Everything under `public/img/`, the icons, `og.jpg` and `public/press/` is generated from it.

## Add a game

1. Put its icon and screenshots in `public/img/games/<slug>/`.
2. Add an entry to `GAMES` in `src/app/_lib/content.ts`.

That gives the game a card on the home page and `/games`, its own page at `/games/<slug>`, a static HTML file, and a sitemap entry. A store link marked `live: false` is recorded but not shown, so a listing can be added before it opens.

## Brand images

The logos exist only as flat images on a solid background, so `scripts/build-brand.mjs` cuts them out, then makes the hero sizes, the icons, the link-preview image and the press downloads. Its output is committed; run it only when the art changes:

```bash
npm run build:brand -- --preview
```

`--preview` also writes `brand/preview.png`, each cut-out shown over four backgrounds. Look at it for fringes around the edges, and look at the hero's sky for banding, before committing.

To replace the logo, put the new file in `brand/source/` under the same name. If the artwork moved, the seed point for the bowl of the "d" and the emblem's right edge near the top of the cut-out section will need adjusting. When vector logos exist, they can replace the cut-out step altogether.

Two things to keep true:

- Moss green (`#3E7C59`) is too dark for text on the night background. Use `moss-light` for green text.
- Button text on ember is always night, never parchment.

## Search and link previews

GitHub Pages serves a file or a 404, so a single-page app's routes would all answer 404 to a crawler. `scripts/build-routes.mjs` runs at the end of `npm run build` and writes a real `index.html` for every route in `PAGES`, each with its own title, description, canonical URL and link-preview tags, plus `sitemap.xml`.

## Privacy page

The privacy page says the site loads nothing from third parties. That is why the fonts are self-hosted. Adding analytics, an embed, or a hosted font means changing that page too, and bumping `PRIVACY.updated`.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which checks formatting, lints, builds, and publishes `dist` to GitHub Pages.

One-time setup:

1. In the repository's Pages settings, set the source to GitHub Actions and the custom domain to `jinxwood.games`. Set the domain straight away: without it the site is published under a subpath, where its root-relative URLs break.
2. At the domain's DNS host, point the apex at GitHub Pages with `A` records for `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153` (and the matching `AAAA` records from GitHub's documentation), and add a `CNAME` for `www` to `jasonruesch.github.io`.
3. Once the certificate is issued, turn on Enforce HTTPS.
