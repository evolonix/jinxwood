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
  youtube: "https://www.youtube.com/@jinxwoodgames",
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

/** A video on the studio's YouTube channel. */
export interface GameVideo {
  title: string;
  url: string;
  /** Running time as a player shows it: "3:21". */
  length: string;
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
  /** The game's public videos on YouTube, for the press page. */
  videos: readonly GameVideo[];
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
      "Two-handed pinochle the way it is played at the kitchen table: one 48-card deck, melds, tricks, and a race to 1,000. Play against the computer on Apple and Android devices, and on Apple devices challenge a friend online or deal a hand over FaceTime.",
    highlights: [
      "The complete two-handed rules",
      "Three AI opponents",
      "Achievements on Game Center and Google Play Games",
      "Online play and SharePlay on Apple devices",
    ],
    platforms: ["iPhone", "iPad", "Mac", "Apple TV", "Android"],
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
        live: true,
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
    videos: [
      {
        title: "Version 2.0 gameplay",
        url: "https://www.youtube.com/watch?v=sTu4v-9AmuM",
        length: "0:33",
      },
      {
        title: "Now on Google Play",
        url: "https://www.youtube.com/watch?v=fNI2BRRTUZ4",
        length: "0:33",
      },
      {
        title: "How to play: the rules in three minutes",
        url: "https://www.youtube.com/watch?v=KZ47CUTGEIk",
        length: "3:21",
      },
      {
        title: "The Daily Deal",
        url: "https://www.youtube.com/watch?v=iOSe9AA31cA",
        length: "0:33",
      },
      {
        title: "On Apple TV and iPhone Duo",
        url: "https://www.youtube.com/watch?v=r6DlMwoNE5k",
        length: "0:34",
      },
    ],
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
    "Jinxwood is an independent game studio and the gaming brand of Evolonix LLC. It makes warm, well-crafted games with a little mischief and a little magic, beginning with Pinochle: Two-Handed for iPhone, iPad, Mac, Apple TV, and Android.",
  downloads: [
    {
      label: "Logo for dark backgrounds",
      file: "/press/jinxwood-logo-for-dark.png",
      preview: "lockup",
      on: "night",
      note: "Transparent PNG, 1600 × 628",
    },
    {
      label: "Logo for light backgrounds",
      file: "/press/jinxwood-logo-for-light.png",
      preview: "lockup-light",
      on: "parchment",
      note: "Transparent PNG, 1600 × 628",
    },
    {
      label: "Wordmark for dark backgrounds",
      file: "/press/jinxwood-wordmark-for-dark.png",
      preview: "wordmark",
      on: "night",
      note: "Transparent PNG, 2072 × 788",
    },
    {
      label: "Wordmark for light backgrounds",
      file: "/press/jinxwood-wordmark-for-light.png",
      preview: "wordmark-light",
      on: "parchment",
      note: "Transparent PNG, 2072 × 788",
    },
    {
      label: "Emblem for any background",
      file: "/press/jinxwood-emblem.png",
      preview: "emblem",
      on: "night",
      note: "Transparent PNG, 672 × 628",
    },
  ],
  art: [
    {
      label: "Forest illustration",
      file: "/press/jinxwood-forest.jpg",
      preview: "/img/hero/hero-1280.webp",
      alt: "The Jinxwood forest illustration: a castle at twilight, seen through the trees.",
      note: "JPEG, 2560 × 1440",
      width: 2560,
      height: 1440,
    },
    {
      label: "Jinx in the tree",
      file: "/press/jinx-in-the-tree.jpg",
      preview: "/img/press/jinx-in-the-tree-1280.webp",
      alt: "Jinx the black cat sitting in the glowing hollow of a tree, with the castle beyond.",
      note: "JPEG, 1920 × 1080",
      width: 1920,
      height: 1080,
    },
  ],
  rules: [
    "Use the logo files as they are: no recoloring, stretching or redrawing.",
    "Give the logo room, at least the height of the “J” on every side.",
    "Put the dark-background logo on Enchanted Night or another plain dark color, not on a busy photo.",
  ],
} as const;

export interface Wallpaper {
  label: string;
  /** The download, under public/wallpapers/. */
  file: string;
  /** The small picture of it shown on the page. */
  preview: string;
  note: string;
  /** The download's size in pixels. */
  width: number;
  height: number;
}

/**
 * A device's wallpapers. scripts/build-wallpapers.mjs writes the files and
 * their previews under these names: four with the logo or emblem,
 * `<name>-<dark|light>-<flat|forest>`, and for a device that has one, the
 * picture of Jinx in the tree, `<name>-tree`.
 */
function wallpaperSet(
  name: string,
  size: string,
  { tree = false } = {},
): Wallpaper[] {
  const [width, height] = size.split("×").map((side) => parseInt(side, 10));
  const one = (label: string, variant: string, type: "png" | "jpg") => ({
    label,
    file: `/wallpapers/${name}-${variant}.${type}`,
    preview: `/img/wallpapers/${name}-${variant}.webp`,
    note: `${type === "png" ? "PNG" : "JPEG"}, ${size}`,
    width,
    height,
  });
  return [
    one("Dark", "dark-flat", "png"),
    one("Light", "light-flat", "png"),
    one("Forest, dark", "dark-forest", "jpg"),
    one("Forest, light", "light-forest", "jpg"),
    ...(tree ? [one("Jinx in the tree", "tree", "jpg")] : []),
  ];
}

/** The wallpapers page: what it says, and the downloads by device. */
export const WALLPAPERS = {
  intro:
    "The cat in the hollow, keeping an eye on your desktop or your phone. Each wallpaper comes dark or light, plain or over the forest, and the desktop, the MacBook Pro and the iPhone Duo also have Jinx in the tree. All of them are free for your own screens.",
  sets: [
    {
      device: "Phone",
      about:
        "The emblem in the middle of a tall screen, for iPhone and Android phones.",
      /** The size of each preview picture, for the page's layout. */
      preview: { width: 560, height: 1213 },
      files: wallpaperSet("jinxwood-phone", "1440 × 3120"),
    },
    {
      device: "Tablet",
      about:
        "The logo in the middle of a square image, so it fills the screen whichever way you hold the tablet.",
      preview: { width: 640, height: 640 },
      files: wallpaperSet("jinxwood-tablet", "2752 × 2752"),
    },
    {
      device: "Desktop",
      about:
        "The logo in the middle of a widescreen monitor, at 4K. Or Jinx in the hollow of the old tree, with the castle beyond.",
      preview: { width: 960, height: 540 },
      files: wallpaperSet("jinxwood-desktop", "3840 × 2160", { tree: true }),
    },
    {
      device: "MacBook Pro 16-inch",
      about:
        "The logo in the middle of the desktop, sized for the 16-inch MacBook Pro.",
      preview: { width: 960, height: 621 },
      files: wallpaperSet("jinxwood-macbook-pro-16", "3456 × 2234", {
        tree: true,
      }),
    },
    {
      device: "iPhone Duo",
      about:
        "One tall image holds all three views: the logo at the top for the open phone held sideways, and the emblem below it for the closed phone and the open phone held upright. Move each view over its part when you set the wallpaper.",
      preview: { width: 560, height: 1209 },
      files: wallpaperSet("jinxwood-duo", "2853 × 6158", { tree: true }),
    },
  ],
} as const;

/** Bump when the text of the policy pages changes. */
export const PRIVACY = { updated: "November 20, 2026" } as const;
export const TERMS = { updated: "November 24, 2026" } as const;

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
