# Jinxwood

The website for Jinxwood, the gaming brand of Evolonix LLC: <https://jinxwood.com>.

A small static site: a home page, a games index, a press and brand kit page, and privacy and terms pages. Each game has its own set of pages under `/games/<slug>`; Pinochle: Two-Handed has a home page, the complete rules, support, a privacy policy and terms of use.

## Stack

React 19, Vite 8, TypeScript, Tailwind CSS 4, and file-based routing from [`@evolonix/react-router-next`](https://www.npmjs.com/package/@evolonix/react-router-next) (routes live in `src/app/**/page.tsx`). It is the same toolchain as jasonruesch.dev. Hosted on GitHub Pages.

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

| Script                   | What it does                                                     |
| ------------------------ | ---------------------------------------------------------------- |
| `npm run dev`            | Dev server                                                       |
| `npm run build`          | Type-check, build, then write a static page per route            |
| `npm run preview`        | Serve the production build                                       |
| `npm run preview:pages`  | Serve the production build the way GitHub Pages does (real 404s) |
| `npm run lint`           | ESLint                                                           |
| `npm run format`         | Prettier, writing changes (`format:check` only reports)          |
| `npm run build:brand`    | Regenerate every brand image from `brand/source/`                |
| `npm run build:pinochle` | Regenerate the Pinochle screenshots and art from the app repo    |

## Where things are

- `src/app/_lib/content.ts` holds every fact and string the site states: the studio, the games, the press kit, the policy dates.
- `src/app/_lib/seo.ts` holds each route's search title and description.
- `src/index.css` holds the design tokens: the four brand colours and the tones built from them, the fonts, and the motion.
- `brand/source/` holds the source art. Everything under `public/img/`, the icons, `og.jpg` and `public/press/` is generated from it.
- `src/app/games/pinochle/` holds the Pinochle pages, with their own components (`_components/`) and copy, routes and search metadata (`_lib/`). Their media is in `public/media/pinochle/`.

## Add a game

1. Add an entry to `GAMES` in `src/app/_lib/content.ts`. That gives the game its card on the home page and on `/games`. A store link marked `live: false` is recorded but not shown, so a listing can be added before it opens.
2. Build its pages in `src/app/games/<slug>/`, the way `games/pinochle/` is laid out: a `layout.tsx` for the game's own navigation, a `page.tsx` per route, and its media in `public/media/<slug>/`.
3. Export the pages' titles and descriptions from the game's `_lib/seo.ts` and spread them into `PAGES` in `src/app/_lib/seo.ts`. That is what gives each route a static HTML file and a sitemap entry.

## Pinochle pages

The Pinochle pages were moved here from the game's own site (the `feat/v2.0` branch of the `pinochle` repo) and restyled to the Jinxwood theme. The store listings point at these URLs for support, privacy and terms, so those three pages have to stay reachable, and their text is the published text: bump `PRIVACY.updated` or `TERMS.updated` in `games/pinochle/_lib/content.ts` when it changes.

Everything Android on these pages (the Google Play badge, the Android screenshots and FAQs, the privacy wording) waits on `PLAY.live` in that file.

Screenshots, Game Center art and the app icon are generated from the app repo (`pinochle-app`, expected beside this one) into `public/media/pinochle/img/` and committed:

```bash
PINOCHLE_DIR=/path/to/pinochle-app npm run build:pinochle
```

Screenshots are resized in 16 bits, dithered back to 8 bits with the game's own noise and saved as near-lossless WebP at 1200 px (about 150 to 500 KB each). The felt is a shallow gradient the game dithers so it does not band into rings, and both an 8-bit resize and lossy WebP would undo that.

The gameplay clip on the game's home page, `public/media/pinochle/video/pinochle-2.0-preview.mp4` (about 20 MB, loaded only on play), is the 2.0 press clip, and `pinochle-2.0-preview-play.mp4` is the same clip with an end card that adds Google Play, played once `PLAY.live` is on. Neither is produced by `build:pinochle`. The app repo's `Docs/PressKit.md` describes how the clip is recorded and encoded; `scripts/pinochle-press-video/title-cards.py` renders its opening and closing cards.

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

## Accessibility

The site is built to WCAG 2.2 level AA. The rules that are easy to break:

- **Text contrast.** Small text needs 4.5:1 and large text 3:1. The colour tokens in `src/index.css` note which pairs pass: ember and parchment on the night tones do, moss as text does not, and nothing light goes on ember. `night-edge` is the outline colour for form fields; `night-line` is too faint for that.
- **Words over the hero art.** Each scrim behind the hero's words is tied to where the words are, not to a share of the screen, so the contrast holds at every window shape. Check a short phone and a square window after changing the hero.
- **Motion.** Anything that moves by itself for more than five seconds needs a way to stop it. The fireflies have the pause button in the hero; the peeking eyes blink twice and stop. Both are off under reduced motion.
- **Bars that stick.** The header and a game's navigation are nearly opaque so text on them keeps its contrast over whatever scrolls underneath, and `scroll-padding` in `src/index.css` keeps focused elements clear of them and of the phone download bar.
- **Narrow screens.** Nothing but a data table scrolls sideways at 320px wide, which is also what a desktop window zoomed to 400% gets.
- **Names.** A link or button with its own `aria-label` starts with the words shown on it. A link that opens a new tab says so.
- **Page changes.** `RouteAnnouncer` in `src/app/layout.tsx` reads out the new page's title and moves focus to the main content when a link changes the page without a reload.

## Search and link previews

GitHub Pages serves a file or a 404, so a single-page app's routes would all answer 404 to a crawler. `scripts/build-routes.mjs` runs at the end of `npm run build` and writes a real `index.html` for every route in `PAGES`, each with its own title, description, canonical URL and link-preview tags, plus `sitemap.xml` and `robots.txt`.

The site is currently held out of search: `INDEXABLE` in `src/app/_lib/seo.ts` is `false`, so every page carries `noindex` and no sitemap is published. Set it to `true` to launch. `robots.txt` allows crawling in both states on purpose, because a crawler that is blocked from a page never sees its `noindex`.

## Privacy page

The privacy page says the site loads nothing from third parties. That is why the fonts and the Pinochle clip are self-hosted. Adding analytics, an embed, or a hosted font means changing that page too, and bumping `PRIVACY.updated`. The Pinochle support form sends nothing to the site: it composes an email in the visitor's own mail app.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which checks formatting, lints, builds, and publishes `dist` to GitHub Pages.

One-time setup:

1. In the repository's Pages settings, set the source to GitHub Actions and the custom domain to `jinxwood.com`. Set the domain straight away: without it the site is published under a subpath, where its root-relative URLs break.
2. At the domain's DNS host, point the apex at GitHub Pages with `A` records for `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153` (and the matching `AAAA` records from GitHub's documentation), and add a `CNAME` for `www` to `evolonix.github.io`.
3. Once the certificate is issued, turn on Enforce HTTPS.
