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
  trademark: "Jinxwood is a trademark of Evolonix LLC.",
  url: "https://jinxwood.com",
  email: "hello@jinxwood.games",
  tagline: "Games with a little mischief and a little magic.",
  intro:
    "Jinxwood is a small studio making warm, well-crafted games, starting with the classics you love.",
  story: [
    "We make games that feel like a good evening at the table. The rules are familiar, the rivals are friendly, and nothing gets between you and the cards.",
    "A black cat is supposed to be bad luck. Ours sits in the hollow of an old tree and brings the good kind instead. Around here, the jinx is the lucky charm.",
    "We're a small, independent studio. Classic card games come first, and the wood has room for whatever grows next. Whenever you'd like a game, pull up a chair.",
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
  /** What follows the free part: said after `price` on the game's card. */
  priceNote: string;
  /** The version on sale, and when it and the first version came out. */
  release: { version: string; date: string; firstReleased: string };
  /** The name the game is published under. */
  developer: string;
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
      "Two-handed pinochle the way it is played at the kitchen table: one 48-card deck, melds, tricks, and a race to 1,000. Play against the computer, challenge a friend online, or deal a hand over FaceTime.",
    highlights: [
      "The complete two-handed rules",
      "Three AI opponents",
      "Online play through Game Center",
      "SharePlay over FaceTime",
    ],
    platforms: ["iPhone", "iPad", "Mac", "Apple TV"],
    price: "Free to try for 14 days",
    priceNote: "One purchase after that. No subscription, no ads.",
    release: {
      version: "2.0",
      date: "November 20, 2026",
      firstReleased: "July 31, 2026",
    },
    developer: "Jinxwood Games",
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
      note: "Transparent PNG, 1592 × 626",
    },
    {
      label: "Logo for light backgrounds",
      file: "/press/jinxwood-logo-for-light.png",
      preview: "lockup-light",
      on: "parchment",
      note: "Transparent PNG, 1592 × 626",
    },
    {
      label: "Wordmark for dark backgrounds",
      file: "/press/jinxwood-wordmark-for-dark.png",
      preview: "wordmark",
      on: "night",
      note: "Transparent PNG, 1430 × 552",
    },
    {
      label: "Wordmark for light backgrounds",
      file: "/press/jinxwood-wordmark-for-light.png",
      preview: "wordmark-light",
      on: "parchment",
      note: "Transparent PNG, 1430 × 552",
    },
    {
      label: "Emblem for dark backgrounds",
      file: "/press/jinxwood-emblem-for-dark.png",
      preview: "emblem",
      on: "night",
      note: "Transparent PNG, 670 × 626",
    },
    {
      label: "Emblem for light backgrounds",
      file: "/press/jinxwood-emblem-for-light.png",
      preview: "emblem-light",
      on: "parchment",
      note: "Transparent PNG, 670 × 626",
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
export const PRIVACY = { updated: "November 20, 2026" } as const;
export const TERMS = { updated: "November 20, 2026" } as const;

/** A list as a sentence would say it: "iPhone, iPad, Mac, and Apple TV". */
export function sentenceList(items: readonly string[]): string {
  return new Intl.ListFormat("en-US", {
    style: "long",
    type: "conjunction",
  }).format(items);
}

export function gameBySlug(slug: string): Game | undefined {
  return GAMES.find((game) => game.slug === slug);
}

/** Stores whose listing is public, in the order they are declared. */
export function liveStores(game: Game): StoreLink[] {
  return game.stores.filter((store) => store.live);
}
