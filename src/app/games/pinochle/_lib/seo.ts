// Search titles and descriptions for the Pinochle pages. The site's own table
// (src/app/_lib/seo.ts) spreads these into PAGES, which is what gives each
// route its static HTML file and its sitemap entry.
//
// Node loads this file directly at build time, so the imports below spell out
// their .ts extensions and nothing here needs a bundler.

import { PLATFORM_LIST, PLAY } from "./content.ts";
import { route } from "./routes.ts";

export const PINOCHLE_PAGES: Record<
  string,
  { title: string; description: string }
> = {
  [route()]: {
    title: PLAY.live
      ? "Pinochle: Two-Handed — Two-Player Pinochle for iPhone and Android"
      : "Pinochle: Two-Handed — Two-Player Pinochle for Apple Devices",
    description: `The classic two-handed card duel for ${PLATFORM_LIST}. Full pinochle rules, a guided first game, the Daily Deal, three AI opponents, and online play${PLAY.live ? " on Apple devices" : ""}.`,
  },
  [route("/how-to-play")]: {
    title: "How to Play Two-Handed Pinochle — the Complete Rules",
    description:
      "Complete rules for two-handed pinochle: the 48-card deck, the deal, melding and meld values, the dix, the phase-two playoff, counting, and the race to 1,000.",
  },
  [route("/privacy")]: {
    title: "Privacy Policy — Pinochle: Two-Handed",
    description:
      "Pinochle: Two-Handed collects nothing at all — no accounts, no analytics, no advertising, no tracking. Read the full privacy policy.",
  },
  [route("/terms")]: {
    title: "Terms of Use — Pinochle: Two-Handed",
    description:
      "The terms for Pinochle: Two-Handed — your license, the 14-day free trial and one-time unlock, online play, and the usual fine print, in plain words.",
  },
  [route("/support")]: {
    title: "Support — Pinochle: Two-Handed",
    description:
      "Help with Pinochle: Two-Handed — bug reports, Game Center and SharePlay troubleshooting, rules questions, and answers to the things that come up most.",
  },
};
