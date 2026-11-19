// Where the Pinochle pages sit inside the Jinxwood site. Pages and links name
// a path relative to the game ("/support") and route() places it.
//
// scripts/build-routes.mjs loads this file directly in Node (through seo.ts),
// so keep it plain: no imports, no import.meta.

export const PINOCHLE_BASE = "/games/pinochle";

/** The site route for one of the game's pages; no argument is the game's home. */
export function route(path = "/"): string {
  return path === "/" ? PINOCHLE_BASE : `${PINOCHLE_BASE}${path}`;
}
