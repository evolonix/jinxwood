// Per-route search metadata, in one table because it has to be applied twice:
//
//   * at runtime by usePageMeta(), for people arriving through the SPA, and
//   * at build time by scripts/build-routes.mjs, which stamps the same title,
//     description and canonical into a real index.html per route.
//
// The build step is what makes these pages indexable at all. GitHub Pages has
// no server-side rewrite, so without a file at dist/press/index.html the URL
// answers 404.html — a genuine HTTP 404, which crawlers treat as a missing
// page no matter what the SPA fallback paints afterward.
//
// Node imports this .ts file directly (Node 24 strips types; the app's
// erasableSyntaxOnly keeps it strip-safe), so the two copies cannot drift. That
// is also why the one import below spells out its .ts extension, and why the
// files it reaches have to stay free of anything a bundler would resolve.

import { PINOCHLE_PAGES } from "../games/pinochle/_lib/seo.ts";

/** Canonical origin, no trailing slash. */
export const SITE_URL = "https://jinxwood.com";

/**
 * Whether search engines may list the site. While this is false, every page
 * carries a noindex directive and no sitemap is published, so the site stays
 * out of search results while it is being finished. Set it to true to launch.
 *
 * Crawlers are still allowed to fetch the pages (robots.txt does not block
 * them): a crawler that cannot fetch a page never sees its noindex, and a
 * blocked URL can still be listed, bare, if another site links to it.
 */
export const INDEXABLE = true;

/** The link-preview image every page shares (scripts/build-brand.mjs). */
export const SOCIAL_IMAGE = `${SITE_URL}/og.jpg`;

export interface PageSeo {
  /**
   * The whole <title>, written out — no site suffix is appended. Front-load the
   * words someone would actually search and stay near 60 characters, which is
   * about where Google truncates.
   */
  title: string;
  /** ~155 characters. Not a ranking factor, but it is the click-through pitch. */
  description: string;
  /** Kept out of the sitemap and marked noindex. */
  noindex?: boolean;
}

/** True when a page must tell search engines not to list it. */
export function isNoindex(seo: PageSeo): boolean {
  return !INDEXABLE || seo.noindex === true;
}

const STATIC_PAGES: Record<string, PageSeo> = {
  "/": {
    title: "Jinxwood — Games with a Little Mischief and a Little Magic",
    description:
      "Jinxwood is a small game studio making warm, well-crafted games with a little mischief and a little magic. Home of Pinochle: Two-Handed.",
  },
  "/games": {
    title: "Games — Jinxwood",
    description:
      "The games from Jinxwood, starting with Pinochle: Two-Handed, the classic two-player card duel for iPhone, iPad, Mac, Apple TV, and Android.",
  },
  "/press": {
    title: "Press and Brand Kit — Jinxwood",
    description:
      "Jinxwood's press kit: studio facts, logo downloads, the color palette and typography, and who to contact.",
  },
  "/privacy": {
    title: "Privacy — Jinxwood",
    description:
      "This website sets no cookies, runs no analytics and loads nothing from third parties. Each Jinxwood game has its own privacy policy.",
  },
  "/terms": {
    title: "Terms — Jinxwood",
    description:
      "The terms for using the Jinxwood website, in plain words. Each Jinxwood game has its own terms of use.",
  },
};

/** The route a game's home page lives at. */
export function gamePath(slug: string): string {
  return `/games/${slug}`;
}

/**
 * Every indexable route: the studio's pages plus each game's own, which the
 * game keeps beside its pages. Being in this table is what gives a route its
 * static HTML file and its sitemap entry — scripts/build-routes.mjs iterates
 * it.
 */
export const PAGES: Record<string, PageSeo> = {
  ...STATIC_PAGES,
  ...PINOCHLE_PAGES,
};

/** Applied to any URL that didn't match a route, so 404s stay out of the index. */
export const NOT_FOUND_SEO: PageSeo = {
  title: "Page not found — Jinxwood",
  description: "That page doesn't exist. Head back to the Jinxwood home page.",
  noindex: true,
};

/**
 * The URL a page declares as its own. GitHub Pages serves a route's directory
 * and redirects the bare path to it, so the canonical carries the trailing
 * slash the server actually settles on.
 */
export function canonicalUrl(path: string): string {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}/`;
}
