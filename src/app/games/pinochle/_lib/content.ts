// All marketing copy is sourced verbatim (or lightly condensed) from the app's
// App Store listing kit (Docs/StoreListing.md in the pinochle-app repo) and the
// in-app "How to Play" screen. Keep this the single source of truth for the
// Pinochle pages.
//
// scripts/build-routes.mjs loads this file directly in Node (through seo.ts),
// so keep it plain data: no imports, no import.meta.

/* -- App Store listing ---------------------------------------------------- */
// TODO(release): these are placeholders — replace with the real values from the
// live App Store Connect record before merging. `appId` is the only one the
// links actually resolve on: it's the numeric id in the listing URL
// (apps.apple.com/app/<slug>/id123456789). The slug is cosmetic.
export const STORE = {
  appId: "6759009060",
  slug: "pinochle-two-handed",
  /** Marketing version live on the store. */
  version: "2.0",
} as const;

/** Canonical App Store listing URL. Every store link on the site uses this. */
export const STORE_URL = `https://apps.apple.com/app/${STORE.slug}/id${STORE.appId}`;

/** The App Store's custom product pages (App Store Connect → Custom Product
 * Pages): the same listing with screenshots and promo text aimed at one kind of
 * visitor. Learn Pinochle is for newcomers; Daily Deal for daily players. */
export const STORE_PAGES = {
  learn: "e016d57f-d47f-40c7-aace-e4a19da28f68",
  daily: "a501f276-beaa-486f-8f5a-baec5762e33c",
} as const;

export type StorePage = keyof typeof STORE_PAGES;

/** The listing, or one of its custom product pages. */
export function storeUrl(page?: StorePage): string {
  return page ? `${STORE_URL}?ppid=${STORE_PAGES[page]}` : STORE_URL;
}

/* -- How-to-play video ----------------------------------------------------- */
// The narrated guided hand on the How to Play page. The site serves its own
// copy, like every other file here, so playing it contacts nobody else; the
// same video is on the studio's YouTube channel for anyone who would rather
// watch or share it there. Paths are relative to public/media/pinochle/.
export const RULES_VIDEO = {
  title: "How to Play Two-Handed Pinochle: Rules in 3 Minutes",
  description:
    "One guided hand of two-handed pinochle against the computer, narrated: how trump is set, how the cards rank, what tricks and melds score, and how the playoff works.",
  file: "video/pinochle-how-to-play.mp4",
  poster: "video/pinochle-how-to-play-poster.webp",
  captions: "video/pinochle-how-to-play.en.vtt",
  youtube: "https://www.youtube.com/watch?v=KZ47CUTGEIk",
  /** ISO 8601 length and publication date, for search engines. */
  duration: "PT3M21S",
  published: "2026-11-22",
} as const;

/* -- Google Play listing (2.0) --------------------------------------------- */
// Everything Android on the site — the Google Play badge, "and Android" in the
// platform list and the Android FAQs — waits on `live`. The privacy policy is
// the exception: it covers Android already, because the Play listing links to
// it while Google reviews the app. 2.0 launched on the App Store first;
// Google Play followed on November 24, 2026, and this went true that day (see
// the app repo's Docs/AndroidPlan.md, "Launch day"). Setting it back to false
// returns the site to Apple-only copy.
export const PLAY = {
  packageName: "games.jinxwood.pinochle",
  live: true,
} as const;

export const PLAY_URL = `https://play.google.com/store/apps/details?id=${PLAY.packageName}`;

/** The operating systems the app runs on, for search engines' structured data. */
export const OPERATING_SYSTEMS = PLAY.live
  ? "iOS, iPadOS, macOS, tvOS, Android, ChromeOS"
  : "iOS, iPadOS, macOS, tvOS";

/** Every device the game is sold for, as a sentence list. */
export const PLATFORM_LIST = PLAY.live
  ? "iPhone, iPad, Mac, Apple TV, and Android"
  : "iPhone, iPad, Mac, and Apple TV";

export const APP = {
  name: "Pinochle: Two-Handed",
  shortName: "Pinochle",
  subtitle: "The classic two-handed duel",
  promo:
    "Deal in. Meld your marriages, flush the trump, and race to 1,000 against a sharp AI or a live opponent over Game Center.",
  /** The listing's promotional text, condensed — what's new in this version. */
  whatsNew:
    "All-new Pinochle: play upright on iPhone, a fresh look, a guided first game, and a free Daily Deal every day. Try every opponent free for 14 days.",
  category: "Games · Card & Strategy",
  // Deliberately no dollar amount — the App Store listing is the source of
  // truth for price, and hardcoding it here would go stale on any sale or
  // price change.
  price: "Free to try for 14 days",
  age: "Rated 4+",
  copyright: "© 2026 Evolonix LLC",
  tagline: "One deck, two players, two hundred fifty points a deal.",
  closer: "See you at 1,000.",
} as const;

/** The hero: what a player gets, then the three things that settle "should I
 * try it" — no cost to start, no subscription trap, no rules to learn first. */
export const HERO = {
  headline: "Two-handed pinochle, whenever you want a game",
  subhead: `Three computer opponents, a free Daily Deal, and a guided first game that teaches you as you play. On ${PLATFORM_LIST}.`,
  trust: [
    "Free to try for 14 days",
    "One purchase — no subscription, no ads",
    "Never played? The first game teaches you",
  ],
} as const;

export const DESCRIPTION: string[] = [
  "Pinochle brings the classic two-handed card duel to your table — the classic rules, a beautiful minimal deck, and opponents that put up a real fight. Play it upright on iPhone, your hand right under your thumb, or turn it sideways.",
  `Try the whole game free for 14 days. After that, one purchase unlocks it for good — on your ${PLATFORM_LIST}. No subscription. And the Daily Deal stays free, every day, either way.`,
  "Play a quick single deal or the full race to 1,000 with declare-out. Draw from the stock, time your melds, and squeeze every counter out of the playoff, where following suit is the law and every trick matters.",
  "New to Pinochle? A guided first game walks you through a real deal — the trump, your first trick, your first meld, the playoff — one short tip at a time.",
];

/* -- What's new ----------------------------------------------------------- */
// The listing's "What's New" notes, lightly condensed: this version first,
// then the release before it when there is one worth repeating (EARLIER_RELEASE).
// 2.0 follows 1.1 directly, so its highlights cover everything new since 1.1.
export const WHATS_NEW: string[] = [
  ...(PLAY.live
    ? [
        "Now on Google Play: Android phones, tablets, and foldables, Chromebooks, and Android TV.",
      ]
    : []),
  "Play upright on iPhone: the table stacks top to bottom and your hand sits in one arc under your thumb. Turn the phone any time and the table follows.",
  "Made for iPhone Duo: folded or open, upright or sideways, switching as you fold and unfold.",
  "A whole new look, with cameo court cards: kings, queens, and jacks in gold-framed profile.",
  "The Daily Deal, free for good: build a streak, with streak freezes, and match or beat Ace's score on the same cards for gold.",
  "Meet your opponents: Dix, Jack, and Ace are the Easy, Medium, and Hard computers.",
  "A guided first game, and a coach after every deal.",
  "Your stats, and a ladder: beat each computer three times to earn a new card-back color, the Walnut table, and the Crown card back.",
];

/** The release before this one, listed under the new one, or null when the
 * listing has nothing earlier worth repeating. */
export const EARLIER_RELEASE: { version: string; items: string[] } | null =
  null;

/* -- Before you download -------------------------------------------------- */
// The home page's FAQ: the questions that stop someone short of the download
// button — what it costs, which rules, whether a beginner can keep up, and who
// they can play with. Kept to what the app actually does.
export const DOWNLOAD_FAQS: Faq[] = [
  {
    question: "What does it cost?",
    answer: `Nothing to start: every opponent and mode is free for 14 days from the moment you start the trial. After that, one purchase unlocks the full game for good on your ${PLATFORM_LIST}, with no subscription and no ads. The Daily Deal and the guided first game stay free either way. ${PLAY.live ? "The store" : "The App Store"} shows the price in your currency before you buy.`,
  },
  {
    question: "Which pinochle rules does it use?",
    answer:
      "Classic two-handed pinochle as Bicycle publishes it: a 48-card deck, a meld after each trick you win while the stock lasts, then the playoff, where you must follow suit and beat a trump lead if you can. Play a single deal or the race to 1,000, with declaring out.",
    link: { label: "Read the full rules", href: "/how-to-play" },
  },
  {
    question: "I've never played. Can I learn here?",
    answer:
      "Yes. A guided first game teaches you a real deal, one short tip at a time. After that, Dix, the Easy opponent, points out a good card when you're stuck, and a coach names your costliest slip after every deal. How to Play shows every meld in real cards.",
  },
  {
    question: "Can I play with family and friends?",
    answer:
      "Yes. Play online through Game Center with a quick match or an invite, or on a FaceTime call with SharePlay on iPhone, iPad, and Mac. Online play is part of the one-time unlock once the trial ends." +
      (PLAY.live ? " It isn't on Android yet." : ""),
  },
  {
    question: "Does it work offline?",
    answer:
      "Yes. Playing the computer needs no connection and no account. You need the internet only to start the trial, buy the unlock, or play online.",
  },
  {
    question: "Is it easy to see and use?",
    answer: `Each suit has its own color, so spades, hearts, clubs, and diamonds never blur together. ${PLAY.live ? "VoiceOver and TalkBack read" : "VoiceOver reads"} every card and play. On ${PLAY.live ? "Apple TV and Android TV" : "Apple TV"}, the game is built to be read from the couch and played with ${PLAY.live ? "a remote" : "the Siri Remote"} or a controller.`,
  },
  {
    question: "What happens to my data?",
    answer:
      "Nothing is collected. Your games and settings stay on your device; your Game Center scores belong to your Apple Account" +
      (PLAY.live
        ? ", and Google Play Games scores to your Google Account."
        : "."),
  },
  ...(PLAY.live
    ? [
        {
          question: "Does my purchase work on both iPhone and Android?",
          answer:
            "No — the App Store and Google Play sell separately, so an unlock bought on one doesn't carry to the other. Within each, one purchase covers all your devices, and the Daily Deal and the guided first game are free on both.",
        },
      ]
    : [
        // Answers the Android visitor until the Play badge is on the page.
        {
          question: "Is there an Android version?",
          answer:
            "It's on its way to Google Play. The badge will appear on this page the day it's available.",
        },
      ]),
];

/* -- Reviews ----------------------------------------------------------------- */
/** Real App Store reviews, quoted with the reviewer's App Store nickname. The
 * section stays hidden while this is empty — never fill it with anything that
 * isn't a genuine review. */
export interface Review {
  quote: string;
  author: string;
  stars: 1 | 2 | 3 | 4 | 5;
}
export const REVIEWS: Review[] = [];

/* -- Platforms ------------------------------------------------------------ */
export type PlatformIcon =
  | "iphone"
  | "ipad"
  | "mac"
  | "appletv"
  | "android"
  | "chromebook"
  | "androidtv";

export interface Platform {
  name: string;
  icon: PlatformIcon;
}

export const PLATFORMS: Platform[] = [
  { name: "iPhone", icon: "iphone" },
  { name: "iPad", icon: "ipad" },
  { name: "Mac", icon: "mac" },
  { name: "Apple TV", icon: "appletv" },
  ...(PLAY.live
    ? ([
        { name: "Android", icon: "android" },
        { name: "Chromebook", icon: "chromebook" },
        { name: "Android TV", icon: "androidtv" },
      ] as Platform[])
    : []),
];

/* -- Features ------------------------------------------------------------- */
export type FeatureIcon =
  | "cards"
  | "calendar"
  | "palette"
  | "cpu"
  | "globe"
  | "facetime"
  | "controller"
  | "trophy"
  | "book"
  | "shield";

export interface Feature {
  title: string;
  body: string;
  icon: FeatureIcon;
  /** The App Store custom product page that tells this feature's story. */
  storePage?: StorePage;
}

export const FEATURES: Feature[] = [
  {
    title: "Classic two-handed rules",
    body: "The full classic ruleset — flushes, marriages, pinochles, the dix, and declaring out. Nothing simplified away.",
    icon: "cards",
  },
  {
    title: "A guided first game",
    body: "New to pinochle? Play a real deal with a short tip at each step. After that, the game always shows which cards you can play, and Dix, the Easy opponent, suggests one when you stall.",
    icon: "book",
    storePage: "learn",
  },
  {
    title: "The Daily Deal",
    body: "The same cards for everyone, every day, and free for good. Match or beat the score Ace, the Hard opponent, makes on those cards to win gold. Build a streak, with streak freezes for the days life gets in the way.",
    icon: "calendar",
    storePage: "daily",
  },
  {
    title: "Three opponents, and a ladder",
    body: "Dix, Jack, and Ace run from an easygoing teacher to a shark that counts every card played. Beat each one three times to earn a new card back or table. After every deal, a coach shows you where the points went.",
    icon: "cpu",
  },
  {
    title: "Online, and on FaceTime",
    body:
      "Find a quick match or invite a friend through Game Center, or deal in on a FaceTime call with SharePlay on iPhone, iPad, and Mac." +
      (PLAY.live ? " (Apple devices; not on Android yet.)" : ""),
    icon: "globe",
  },
  {
    title: "Make it yours",
    body: `Cameo court cards, five table themes, card backs in three patterns and six colors, three game speeds, and haptics on ${PLAY.live ? "iPhone and Android phones" : "iPhone"}. Three more designs can only be won: the Plum card back, the Walnut table, and the Crown card back.`,
    icon: "palette",
  },
  {
    title: "Made for the living room",
    body: PLAY.live
      ? "Full game-controller support, VoiceOver and TalkBack throughout, and a layout built to be read and steered from the couch on Apple TV and Android TV."
      : "Full game-controller support, VoiceOver throughout, and a layout built to be read and steered from the couch on Apple TV.",
    icon: "controller",
  },
  {
    title: "No ads, no tracking",
    body: PLAY.live
      ? "No ads, no tracking, and no subscription. One purchase covers every device on the store you bought it from. Just cards."
      : "No ads, no tracking, and no subscription. One purchase unlocks the game on every Apple device you own. Just cards.",
    icon: "shield",
  },
];

/* -- How to play ---------------------------------------------------------- */
export interface Rule {
  heading: string;
  body: string;
}

export const RULES: Rule[] = [
  {
    heading: "The cards",
    body: "48 cards: two copies of A, 10, K, Q, J and 9 in each suit. They rank in that order — the 10 beats everything but the ace.",
  },
  {
    heading: "The deal",
    body: "Each player gets 12 cards. The next card is turned face up: its suit is trump for the whole deal. The remaining cards form the stock.",
  },
  {
    heading: "Phase one — while the stock lasts",
    body: "Play any card; you need not follow suit yet. The higher card of the suit led wins unless a trump beats it. After each trick the winner may lay down one meld, then both players draw back up to twelve.",
  },
  {
    heading: "Melding",
    body: "Melds score immediately and stay face up — those cards can still be played to tricks. One meld per trick won, and at least one card must come fresh from your hand.",
  },
  {
    heading: "Phase two — the playoff",
    body: "Once the stock runs out, you must follow suit, trump if you can't, and beat a trump lead if you're able. Every point card now matters as you play out your final twelve.",
  },
  {
    heading: "The race",
    body: "Win a single deal, or play the full match to 1,000. If both players pass 1,000 in the same deal, the target rises to 1,250. Sure you're already there? Declare out and win on the spot, or lose if you miscounted. 250 trick points are on the table each deal, with melds on top.",
  },
];

// Nominative reference + non-affiliation disclaimer, mirroring the wording in
// the app's own "How to Play" footer (MenuView.cs). The game and our rules
// prose need no license, but naming the mark without this implies endorsement.
export const RULES_DISCLAIMER =
  "Follows the two-handed pinochle rules as published at bicyclecards.com. " +
  "Bicycle® is a trademark of The United States Playing Card Company; this " +
  "app is not affiliated with or endorsed by USPC.";

/**
 * The three meld classes (MeldDefs.ClassOf in the app's Core). They only matter
 * for the re-meld rule — a card already on the table can join a new meld in a
 * different class, or a higher-scoring meld of the same class.
 */
export type MeldClass = "A" | "B" | "C";

export const MELD_CLASSES: Record<MeldClass, string> = {
  A: "Flushes & marriages",
  B: "Arounds",
  C: "Pinochles",
};

export interface Meld {
  name: string;
  detail: string;
  points: number;
  cls: MeldClass;
  /** Equally common alternate name, shown on the full rules page. */
  also?: string;
}

export const MELDS: Meld[] = [
  { name: "Flush", detail: "A 10 K Q J of trump", points: 150, cls: "A" },
  { name: "Royal marriage", detail: "K + Q of trump", points: 40, cls: "A" },
  { name: "Marriage", detail: "K + Q, any other suit", points: 20, cls: "A" },
  { name: "Dix", detail: "9 of trump", points: 10, cls: "A" },
  {
    name: "Hundred aces",
    detail: "A of every suit",
    points: 100,
    cls: "B",
    also: "Aces around",
  },
  {
    name: "Eighty kings",
    detail: "K of every suit",
    points: 80,
    cls: "B",
    also: "Kings around",
  },
  {
    name: "Sixty queens",
    detail: "Q of every suit",
    points: 60,
    cls: "B",
    also: "Queens around",
  },
  {
    name: "Forty jacks",
    detail: "J of every suit",
    points: 40,
    cls: "B",
    also: "Jacks around",
  },
  {
    name: "Pinochle",
    detail: "Q of spades + J of diamonds",
    points: 40,
    cls: "C",
  },
  {
    name: "Double pinochle",
    detail: "both pinochles at once",
    points: 300,
    cls: "C",
  },
];

/* -- Full rules page (/how-to-play) --------------------------------------- */
// The prose lives in src/app/how-to-play/page.tsx — it reads as one document
// there, the way the policy does on /privacy. Only the tabular parts live here.
// Every value is the app's own behavior (Core/Rules/Scoring.cs, MeldDefs,
// RulesConfig defaults), so the page can't drift from the game it teaches.

/** Card values when captured in a trick — Cards.PointsOf in the app's Core. */
export interface Counter {
  rank: string;
  points: number;
  /** How many of that rank are in the 48-card deck. */
  count: number;
}

export const COUNTERS: Counter[] = [
  { rank: "Ace", points: 11, count: 8 },
  { rank: "Ten", points: 10, count: 8 },
  { rank: "King", points: 4, count: 8 },
  { rank: "Queen", points: 3, count: 8 },
  { rank: "Jack", points: 2, count: 8 },
  { rank: "Nine", points: 0, count: 8 },
];

/** Counters in the deck (240) plus the last-trick bonus (10) — Scoring.cs. */
export const DEAL_POINTS = {
  counters: 240,
  lastTrick: 10,
  total: 250,
} as const;

/** Rank order, high to low. The ten sitting second is pinochle's odd note. */
export const RANK_ORDER = ["A", "10", "K", "Q", "J", "9"] as const;

/** The at-a-glance table at the top of /how-to-play. */
export const RULES_FACTS: { term: string; value: string }[] = [
  { term: "Players", value: "2" },
  { term: "Deck", value: "48 cards — A 10 K Q J 9, twice in each suit" },
  { term: "Dealt", value: "12 cards each; the next card turned for trump" },
  {
    term: "Trick points per deal",
    value: "250 (240 in counters, 10 for the last trick), with melds on top",
  },
  { term: "Game", value: "First to 1,000, or a single deal" },
  { term: "A deal takes", value: "About ten minutes" },
];

export interface Tip {
  heading: string;
  body: string;
}

export const RULES_TIPS: Tip[] = [
  {
    heading: "Trump is currency, not treasure",
    body: "There are only 12 trumps in the deck and you will see most of them. Spending a low trump to steal a trick in phase one buys you a meld and a draw; hoarding trump you never play wins nothing. The exception is the five cards of a flush — never break those up for a single trick.",
  },
  {
    heading: "Respect the ten",
    body: "The ten ranks second, above the king, and is worth 10 points. That makes it the most dangerous card in your hand: lead a bare ten and you are offering your opponent ten points and the lead. Save tens to capture with, or lead them only when you hold the ace.",
  },
  {
    heading: "Melded cards are still your hand",
    body: "A meld on the table is only borrowed — those cards come back for phase two, and in the meantime you may have to play one to a trick. Before you break up a marriage to win a trick, count what phase two will cost you.",
  },
  {
    heading: "Meld small early, big late",
    body: "Melds score the instant they hit the table, so there is no reward for waiting — except that laying down a marriage now may cost you the flush later. Take the cheap 20 early when your hand is unformed, and hold cards that are one draw from a flush or an around.",
  },
  {
    heading: "Throw nines, not counters",
    body: "In phase one you never have to follow suit, so a trick you do not want costs you nothing but the card you throw. Nines are worth zero — feed them to your opponent's aces and keep every counter for the tricks you intend to win.",
  },
  {
    heading: "Play the last tricks of phase one for phase two",
    body: "Once the stock is gone, following suit becomes law and a void in a plain suit turns your small trump into a winner. Late in phase one, stop collecting and start shaping: shed a whole suit, keep your trump length, and take the last trick's draw with the lead in hand.",
  },
];

export const RULES_FAQS: Faq[] = [
  {
    question: "Can you play pinochle with only 2 players?",
    answer:
      "Yes — two-handed pinochle is a classic form of the game, and it is a genuine duel rather than a cut-down version of the four-player partnership game. One 48-card pinochle deck, 12 cards each, and a stock you draw from until it runs out.",
  },
  {
    question: "How many cards are in a pinochle deck?",
    answer:
      "48. Two copies each of the ace, ten, king, queen, jack and nine in all four suits. You can build one from two standard 52-card decks by pulling those six ranks from each and shuffling them together.",
  },
  {
    question: "What beats what in pinochle?",
    answer:
      "Ace, ten, king, queen, jack, nine — high to low. The ten is the surprise: it outranks the king and is beaten only by the ace. Any trump beats any plain-suit card, and when two identical cards meet, the one played first wins the trick.",
  },
  {
    question: "Do you have to follow suit in two-handed pinochle?",
    answer:
      "Not while the stock lasts — in phase one you may play any card in your hand. Once the stock is exhausted the rules tighten: you must follow suit, you must trump when you cannot follow, and when trump is led you must beat it if you can.",
  },
  {
    question: "What is a pinochle?",
    answer:
      "The meld that gives the game its name: the queen of spades together with the jack of diamonds, worth 40. Holding both queens of spades and both jacks of diamonds is a double pinochle — 300 points, and the biggest meld in the game.",
  },
  {
    question: "What is the dix in pinochle?",
    answer:
      "The dix (say “deece”) is the nine of trump, worth 10. If the card turned for trump is the dix, the dealer scores 10 at once. Otherwise, after winning a trick you may swap a dix from your hand for the turned-up trump card and score its 10.",
  },
  {
    question: "How many points do you need to win at pinochle?",
    answer:
      "The standard game is a race to 1,000 across as many deals as it takes, with 250 trick points on the table each deal, plus melds. A single deal on its own is a perfectly good short game — the higher total after one deal wins.",
  },
  {
    question: "How long does a game of two-handed pinochle take?",
    answer:
      "As a rough guide, a single deal is about ten minutes. A full race to 1,000 usually runs four to six deals, so roughly three quarters of an hour, or less when the melds fall your way.",
  },
];

/* -- Screenshots ---------------------------------------------------------- */
export type Device =
  | "iPhone"
  | "iPad"
  | "Mac"
  | "Apple TV"
  | "Android"
  | "Android tablet"
  | "Chromebook"
  | "Android TV";

export interface Shot {
  device: Device;
  platformIcon: PlatformIcon;
  label: string;
  /** Base filename under public/media/pinochle/img/shots/ (without extension). */
  file: string;
  alt: string;
  /** Intrinsic aspect ratio (width / height) of the screenshot. */
  ratio: number;
}

// Optimized from the pinochle-app repo's Builds/store-raw/ by
// scripts/build-pinochle-assets.mjs into public/media/pinochle/img/shots/*.webp. Those are the bare
// device captures; the App Store panels in Docs/store-shots bake in marketing
// headlines, which would double up inside this site's own DeviceFrame.
//
// Scenes run in the App Store upload order (Docs/StoreListing.md). Apple TV
// skips the tutorial — its tips talk about tapping — so it has five. Android
// has no online play, so its devices skip that scene too (TVs, the tutorial).
type Scene = "classic" | "daily" | "tutorial" | "online" | "tables" | "hints";

const SCENES: Record<Scene, { label: string; alt: string }> = {
  classic: {
    label: "Classic play",
    alt: "A deal against the computer with cameo court cards in hand",
  },
  daily: {
    label: "Daily Deal",
    alt: "The home screen with today's Daily Deal and Ace's score to beat, an eight-day streak with one day saved by a streak freeze, and your record",
  },
  tutorial: {
    label: "Guided first game",
    alt: "A guided-first-game tip explaining how to answer the lead",
  },
  online: {
    label: "Online play",
    alt: "An online Game Center match in progress",
  },
  tables: {
    label: "Table themes",
    alt: "The pause menu with game speed, card back, and table theme choices",
  },
  hints: {
    label: "Hints",
    alt: "Easy mode highlighting a suggested card",
  },
};

const ALL_SCENES: Scene[] = [
  "classic",
  "daily",
  "tutorial",
  "online",
  "tables",
  "hints",
];

const ANDROID_SCENES = ALL_SCENES.filter((s) => s !== "online");

function shotsFor(
  device: Device,
  platformIcon: PlatformIcon,
  prefix: string,
  ratio: number,
  scenes: Scene[] = ALL_SCENES,
): Shot[] {
  return scenes.map((scene) => ({
    device,
    platformIcon,
    label: SCENES[scene].label,
    file: `${prefix}-${scene}`,
    alt: `${SCENES[scene].alt}, on ${device}`,
    ratio,
  }));
}

export const SHOTS: Shot[] = [
  // iPhone 6.9", upright (2.0 plays upright; the sideways set stays for the hero).
  ...shotsFor("iPhone", "iphone", "iphone69p", 1320 / 2868),
  ...shotsFor("iPad", "ipad", "ipad13", 2752 / 2064), // iPad 13"
  ...shotsFor("Mac", "mac", "mac", 2880 / 1800),
  ...shotsFor(
    "Apple TV",
    "appletv",
    "appletv",
    3840 / 2160,
    ALL_SCENES.filter((s) => s !== "tutorial"),
  ),
  // Google Play's sets (app repo Docs/AndroidPlan.md → "Play store art").
  ...(PLAY.live
    ? [
        ...shotsFor(
          "Android",
          "android",
          "android-phone",
          1080 / 1920,
          ANDROID_SCENES,
        ),
        ...shotsFor(
          "Android tablet",
          "android",
          "android-tab10",
          2560 / 1600,
          ANDROID_SCENES,
        ),
        ...shotsFor(
          "Chromebook",
          "chromebook",
          "chromebook",
          1920 / 1080,
          ANDROID_SCENES,
        ),
        ...shotsFor(
          "Android TV",
          "androidtv",
          "androidtv",
          1920 / 1080,
          ANDROID_SCENES.filter((s) => s !== "tutorial"),
        ),
      ]
    : []),
];

export const DEVICES: Device[] = [
  "iPhone",
  "iPad",
  "Mac",
  "Apple TV",
  ...(PLAY.live
    ? (["Android", "Android tablet", "Chromebook", "Android TV"] as Device[])
    : []),
];

/** The single hero screenshot (iPhone melding — the most colorful shot). It
 * stays the sideways capture: the hero frame is laid out landscape. */
export const HERO_SHOT: Shot = {
  device: "iPhone",
  platformIcon: "iphone",
  label: SCENES.classic.label,
  file: "iphone69-classic",
  alt: `${SCENES.classic.alt}, on iPhone`,
  ratio: 2868 / 1320,
};

/* -- Game Center: achievements & leaderboards ----------------------------- */
// Card artwork optimized from the pinochle-app repo's Docs/gc-assets/ into
// public/media/pinochle/img/gc/*.webp. Names are the app's achievement / leaderboard titles.
export interface Badge {
  file: string;
  name: string;
}

export const ACHIEVEMENTS: Badge[] = [
  { file: "ach.first_win", name: "Welcome to the Table" },
  { file: "ach.regular", name: "Regular" },
  { file: "ach.on_a_tear", name: "On a Tear" },
  { file: "ach.comeback", name: "The Comeback" },
  { file: "ach.sweep", name: "Clean Sweep" },
  { file: "ach.skunked", name: "Skunked" },
  { file: "ach.big_deal", name: "Big Deal" },
  { file: "ach.double_pinochle", name: "Double Pinochle" },
  { file: "ach.run", name: "Run It" },
  { file: "ach.aces_around", name: "Aces Around" },
  { file: "ach.club_champion", name: "Club Champion" },
  { file: "ach.called_it", name: "Called It" },
  { file: "ach.matchmaker", name: "Matchmaker" },
  { file: "ach.nine_lives", name: "Nine Lives" },
  { file: "ach.everywhere", name: "Any Table, Anywhere" },
];

export const LEADERBOARDS: Badge[] = [
  { file: "lb.wins.total", name: "Total Match Wins" },
  { file: "lb.wins.weekly", name: "Weekly Wins" },
  { file: "lb.streak.best", name: "Longest Win Streak" },
  { file: "lb.deal.best", name: "Best Single Deal" },
  { file: "lb.meld.best", name: "Biggest Meld Hand" },
];

/* -- Support -------------------------------------------------------------- */
// /support is the app's Support URL in App Store Connect, so it has to stay
// reachable and answer what the listing can't. Anything factual here (Game
// Center, SharePlay, on-device storage) must stay consistent with /privacy and
// the app's own behavior.
export const SUPPORT = {
  /** The support address given on /support and in the App Store listing. */
  email: "support@jinxwood.games",
  /** Turnaround quoted on the page — keep it a promise that can be kept. */
  responseTime: "within a few days",
  /** Apple owns billing, so refunds and receipts go through them, not us. */
  refundUrl: "https://reportaproblem.apple.com",
  /** Google owns billing on Android: its refund help. */
  playRefundUrl: "https://support.google.com/googleplay/answer/2479637",
} as const;

/** Subject-line categories in the support form's topic picker. */
export const SUPPORT_TOPICS: string[] = [
  "Bug report",
  "Online play / Game Center",
  "SharePlay",
  ...(PLAY.live ? ["Google Play / Android"] : []),
  "Rules question",
  "Feature request",
  "Accessibility",
  "Something else",
];

export interface Faq {
  question: string;
  answer: string;
  /** Optional follow-up link rendered after the answer. */
  link?: { label: string; href: string };
}

/** Android's own answers, added to the support FAQs once Google Play is live. */
const ANDROID_FAQS: Faq[] = [
  {
    question: "Can I play online on Android?",
    answer:
      "Not yet. Online matches run on Apple's Game Center and FaceTime, so they're only on Apple devices. Everything else, the Daily Deal included, is the same on Android.",
  },
  {
    question: "Where are my achievements on Android?",
    answer:
      "In Google Play Games. Open Your Record and tap Achievements or Leaderboards. The first time, sign in to Play Games. They follow your Google Account, separately from Game Center on Apple devices.",
  },
  {
    question:
      "I bought the unlock on Android. How do I get it on another device?",
    answer:
      "On another Android device signed into the same Google Account, tap Restore Purchases on the unlock screen or in Settings. Google Play and the App Store sell separately, so an unlock bought on one doesn't carry to the other.",
  },
  {
    question: "Can I play on Android TV with a remote?",
    answer:
      "Yes. Android TV has the same couch-friendly layout as Apple TV. Use the remote's arrows and select, or a game controller; Back pauses a match.",
  },
  {
    question: "I want a refund for a Google Play purchase.",
    answer:
      "Purchases on Android go through Google Play; the developer never sees a payment. Google's refund help explains how to request one.",
    link: { label: "Google Play refunds", href: SUPPORT.playRefundUrl },
  },
];

export const SUPPORT_FAQS: Faq[] = [
  {
    question: "My online match won't start or won't find an opponent.",
    answer:
      "Online play runs on Apple's Game Center. Open Settings › Game Center and make sure you're signed in and that multiplayer isn't restricted under Screen Time, then try the match again. Quick match needs another player looking at the same time — if nobody turns up, invite a friend instead.",
  },
  {
    question: "SharePlay isn't offered on my FaceTime call.",
    answer:
      "Start the FaceTime call first, then open Pinochle and start the match — SharePlay appears once the call is already active. Everyone on the call needs the app installed and up to date, on iPhone, iPad, or Mac. SharePlay isn't available on Apple TV.",
  },
  {
    question: "My achievements or leaderboard scores are missing.",
    answer:
      "Achievements and leaderboards live in your Game Center profile, not in the app, and follow the Apple Account you're signed in with. If they look empty on a second device, check that it's signed into the same account.",
  },
  {
    question: "Does my progress carry between devices?",
    answer:
      "Match progress and settings are stored on the device itself — nothing is collected or synced by the developer. Your Game Center record (wins, streaks, best deal and meld) does follow your Apple Account across devices.",
  },
  {
    question: "The game wouldn't let me play a card.",
    answer:
      "Once the stock runs out, phase two begins: you must follow the suit led, trump if you can't, and beat a trump lead if you can. Cards you can't legally play are dimmed. How to Play in the app walks through it, and so do the complete rules here.",
    link: { label: "Read the complete rules", href: "/how-to-play" },
  },
  {
    question: "Can I play on Apple TV with a controller?",
    answer:
      "Yes. The Apple TV version is built for the Siri Remote and game controllers, and controllers also work on iPhone, iPad, and Mac.",
  },
  {
    question: "What happens when my free trial ends?",
    answer:
      "The Daily Deal and the guided first game stay free, every day, for good — and a match you'd already started can always be finished. Single deals and Race to 1,000 against the computer, and online play, need the one-time unlock. Bought it on another device? Restore Purchases, on the unlock screen and in Settings, brings it back.",
  },
  {
    question: "How do streak freezes work?",
    answer:
      "Every 7 days in a row of the Daily Deal earns a streak freeze, and you can hold two. Miss a day and a freeze covers it the next time you play, so the streak carries on (the frozen day shows in ice blue on the home screen). Miss more days than you have freezes and the streak starts over — but you keep the freezes.",
  },
  {
    question: "How do I turn the daily reminder on or off?",
    answer:
      "In Settings, under Play, switch Daily reminder on or off. It comes once a day around the time you usually play and stops by itself if you haven't opened the app for three days. If it won't switch on, notifications for Pinochle are off in your device's Settings › Notifications. It's a local notification — nothing is sent anywhere. " +
      (PLAY.live ? "(Not on Apple TV or Android TV.)" : "(Not on Apple TV.)"),
  },
  {
    question: "How do I get the Plum, Walnut, and Crown designs?",
    answer:
      "Win. Three wins against the Easy computer earn the Plum card-back color, three against Medium the Walnut table, and three against Hard the Crown card back. Tap Your Record on the home screen to see the ladder and how close you are. They can't be bought, and the Daily Deal and practice matches (where you used undo) don't count.",
  },
  {
    question: "Where does the Daily Deal's target score come from?",
    answer:
      "It's what Ace, the Hard computer, scores playing your seat on the same cards, worked out on your device — so everyone gets the same target. Match or beat it for gold; 85% of it or more is silver, 70% or more bronze.",
  },
  {
    question: "I bought Pinochle before it was free. Do I have to pay again?",
    answer:
      "No. The app recognizes the original purchase from your Apple Account and stays fully unlocked — no trial, nothing to buy, nothing to do. On a new device, sign in with the same Apple Account.",
  },
  {
    question: "I want a refund, or I was charged incorrectly.",
    answer:
      "Purchases and billing are handled entirely by Apple; the developer never sees a payment. Refunds and receipts go through Apple's own reporting page.",
    link: { label: "reportaproblem.apple.com", href: SUPPORT.refundUrl },
  },
  ...(PLAY.live ? ANDROID_FAQS : []),
];

/* -- Privacy policy ------------------------------------------------------- */
// The policy prose itself lives in src/app/privacy/page.tsx — it reads as one
// legal document there. Only the facts that have to stay in sync (or that the
// App Store listing points at) live here.
export const PRIVACY = {
  /** Rendered as "Last updated" on /privacy. Bump whenever the prose changes. */
  updated: "November 20, 2026",
  /** Apple governs Game Center and SharePlay data under its own policy. */
  applePolicyUrl: "https://www.apple.com/legal/privacy/",
  /** Google governs Play Billing, Play Games and Block Store data (Android). */
  googlePolicyUrl: "https://policies.google.com/privacy",
  /** The support address given in the policy and the App Store listing. */
  contactEmail: "privacy@jinxwood.games",
} as const;

/* -- Terms of use --------------------------------------------------------- */
// The terms prose lives in src/app/terms/page.tsx, like the privacy policy's.
export const TERMS = {
  /** Rendered as "Last updated" on /terms. Bump whenever the prose changes. */
  updated: "November 20, 2026",
  /** Apple's standard EULA governs App Store downloads. */
  appleEulaUrl:
    "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/",
  /** Google Play's terms govern Play downloads. */
  googlePlayTermsUrl: "https://play.google.com/about/play-terms/",
} as const;
