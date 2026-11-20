// Every fact and string the site states, in one place.
//
// scripts/build-routes.mjs loads this file directly in Node (through seo.ts)
// to stamp each route's static HTML, so keep it plain data: no imports, no
// import.meta, nothing that needs a bundler.

export const STUDIO = {
  name: "Jinxwood",
  owner: "Evolonix LLC",
  copyright: "© 2026 Evolonix LLC",
  legalLine: "Jinxwood is the gaming brand of Evolonix LLC.",
  url: "https://jinxwood.com",
  email: "hello@jinxwood.games",
  tagline: "Games with a little mischief and a little magic.",
  intro:
    "Jinxwood is a small studio making warm, well-crafted games, starting with the classics people already love.",
  story: [
    "Jinxwood makes games that feel like a good evening at the table: familiar rules, friendly rivals, and enough polish that nothing gets in the way of the play.",
    "A black cat is supposed to be bad luck. Ours sits in the hollow of an old tree and brings the good kind. We like turning a superstition on its head, so here the jinx is the lucky charm.",
    "We are small and independent. Classic card games come first, and the wood has room for whatever grows next.",
  ],
} as const;

export type Platform = "iPhone" | "iPad" | "Mac" | "Apple TV" | "Android";

export interface StoreLink {
  kind: "app-store" | "google-play";
  url: string;
  /** False keeps the badge off the site until that store listing is public. */
  live: boolean;
}

export interface GameImage {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface Game {
  /** URL segment: /games/<slug>. */
  slug: string;
  name: string;
  shortName: string;
  subtitle: string;
  tagline: string;
  description: string;
  highlights: readonly string[];
  platforms: readonly Platform[];
  price: string;
  status: "released" | "coming-soon";
  stores: readonly StoreLink[];
  /** Routes of the game's own support and policy pages on this site. */
  links: { support: string; privacy: string; terms: string };
  art: { icon: GameImage; shots: readonly GameImage[] };
}

/**
 * Every game the studio lists: what its card on the home page and on /games
 * says. The game's own pages live in src/app/games/<slug>/, with their copy,
 * search metadata and media (public/media/<slug>/) alongside.
 */
export const GAMES: readonly Game[] = [
  {
    slug: "pinochle",
    name: "Pinochle: Two-Handed",
    shortName: "Pinochle",
    subtitle: "The classic two-handed duel",
    tagline: "One deck, two players, two hundred fifty points a deal.",
    description:
      "Two-handed pinochle the way it is played at the kitchen table: one 48-card deck, melds, tricks and a race to 1,000. Play against the computer, challenge a friend online, or deal a hand over FaceTime.",
    highlights: [
      "The complete two-handed rules",
      "Three AI opponents",
      "Online play through Game Center",
      "SharePlay over FaceTime",
    ],
    platforms: ["iPhone", "iPad", "Mac", "Apple TV"],
    price: "Free to try for 14 days",
    status: "released",
    stores: [
      {
        kind: "app-store",
        url: "https://apps.apple.com/app/pinochle-two-handed/id6759009060",
        live: true,
      },
      {
        kind: "google-play",
        url: "https://play.google.com/store/apps/details?id=games.jinxwood.pinochle",
        live: false,
      },
    ],
    links: {
      support: "/games/pinochle/support",
      privacy: "/games/pinochle/privacy",
      terms: "/games/pinochle/terms",
    },
    art: {
      icon: {
        src: "/media/pinochle/img/app-icon.webp",
        width: 512,
        height: 512,
        alt: "",
      },
      shots: [
        {
          src: "/media/pinochle/img/shots/mac-classic.webp",
          width: 1200,
          height: 750,
          alt: "A deal of two-handed pinochle against the computer, with cameo court cards in hand",
        },
      ],
    },
  },
];

export const PALETTE = [
  {
    name: "Enchanted Night",
    hex: "#2B1E3F",
    use: "Main background. Mystery, imagination, a premium feel.",
    dark: true,
  },
  {
    name: "Jinx Ember",
    hex: "#F2A93B",
    use: "Buttons, highlights and the glowing eyes. Energy, luck, fun.",
    dark: false,
  },
  {
    name: "Woodland Moss",
    hex: "#3E7C59",
    use: "Leaves and accents. Growth and calm, the “wood” in the name.",
    dark: true,
  },
  {
    name: "Moonlight Parchment",
    hex: "#F4EDE0",
    use: "Text on dark and light surfaces. Clarity, a card-table feel.",
    dark: false,
  },
] as const;

export const PRESS = {
  boilerplate:
    "Jinxwood is an independent game studio and the gaming brand of Evolonix LLC. It makes warm, well-crafted games with a little mischief and a little magic, beginning with Pinochle: Two-Handed for iPhone, iPad, Mac, and Apple TV.",
  downloads: [
    {
      label: "Logo for dark backgrounds",
      file: "/press/jinxwood-logo-for-dark.png",
      preview: "lockup",
      on: "night",
      note: "Transparent PNG, 1538 × 626",
    },
    {
      label: "Logo for light backgrounds",
      file: "/press/jinxwood-logo-for-light.png",
      preview: "lockup-light",
      on: "parchment",
      note: "Transparent PNG, 1538 × 626",
    },
    {
      label: "Wordmark for dark backgrounds",
      file: "/press/jinxwood-wordmark-for-dark.png",
      preview: "wordmark",
      on: "night",
      note: "Transparent PNG, 1367 × 551",
    },
    {
      label: "Wordmark for light backgrounds",
      file: "/press/jinxwood-wordmark-for-light.png",
      preview: "wordmark-light",
      on: "parchment",
      note: "Transparent PNG, 979 × 397",
    },
    {
      label: "Emblem",
      file: "/press/jinxwood-emblem.png",
      preview: "emblem",
      on: "night",
      note: "Transparent PNG, 669 × 626",
    },
  ],
  art: {
    label: "Forest illustration",
    file: "/press/jinxwood-forest.jpg",
    note: "JPEG, 2560 × 1440",
  },
  rules: [
    "Use the logo files as they are: no recoloring, stretching or redrawing.",
    "Give the logo room, at least the height of the “J” on every side.",
    "Put the dark-background logo on Enchanted Night or another plain dark color, not on a busy photo.",
  ],
} as const;

/** Bump when the text of the policy pages changes. */
export const PRIVACY = { updated: "November 18, 2026" } as const;
export const TERMS = { updated: "November 18, 2026" } as const;

export function gameBySlug(slug: string): Game | undefined {
  return GAMES.find((game) => game.slug === slug);
}

/** Stores whose listing is public, in the order they are declared. */
export function liveStores(game: Game): StoreLink[] {
  return game.stores.filter((store) => store.live);
}
