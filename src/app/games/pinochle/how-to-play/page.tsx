import type { ReactNode } from "react";
import { AppLink } from "../../../_components/app-link";
import { StoreBadges } from "../_components/store-badges";
import { Card } from "../_components/card";
import { DeviceFrame } from "../_components/device-frame";
import { Eyebrow } from "../../../_components/eyebrow";
import { asset } from "../_lib/asset";
import {
  APP,
  COUNTERS,
  DEAL_POINTS,
  MELD_CLASSES,
  MELDS,
  PLATFORM_LIST,
  PLAY,
  RANK_ORDER,
  RULES_DISCLAIMER,
  RULES_FACTS,
  RULES_FAQS,
  RULES_TIPS,
  SHOTS,
  type MeldClass,
  OPERATING_SYSTEMS,
} from "../_lib/content";
import { canonicalUrl, PAGES } from "../../../_lib/seo";
import { useActiveSection } from "../_lib/use-active-section";
import { usePageMeta } from "../../../_lib/use-page-meta";
import { route } from "../_lib/routes";

/**
 * The full two-handed pinochle rules — the site's one piece of content written
 * for search rather than for the store listing ("how to play pinochle 2
 * players" is a steady query with few good modern pages, and every reader is a
 * prospect). The prose lives here rather than in _lib/content.ts, the way the
 * policy does on /privacy: it reads as one document. Only the tables come from
 * content.ts, where they are pinned to the app's own Core rules.
 *
 * Everything here is the ruleset the app actually plays. If the engine's
 * defaults change (RulesConfig), this page changes with it.
 */

const PATH = route("/how-to-play");

const SECTIONS = [
  { id: "at-a-glance", nav: "At a glance", title: "The game at a glance" },
  { id: "the-cards", nav: "The cards", title: "The pinochle deck" },
  { id: "the-deal", nav: "The deal", title: "The deal" },
  {
    id: "phase-one",
    nav: "Phase one",
    title: "Phase one — while the stock lasts",
  },
  { id: "melding", nav: "Melding", title: "Melding and what melds are worth" },
  { id: "the-dix", nav: "The dix", title: "The dix" },
  { id: "phase-two", nav: "Phase two", title: "Phase two — the playoff" },
  { id: "scoring", nav: "Scoring", title: "Counting the tricks" },
  { id: "winning", nav: "Winning", title: "Winning the game" },
  { id: "strategy", nav: "Strategy", title: "Six tips for a stronger game" },
  { id: "faq", nav: "Questions", title: "Frequently asked questions" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/** Look a section up by id, so the heading and its nav entry can't drift. */
function section(id: SectionId) {
  return SECTIONS.find((s) => s.id === id)!;
}

const HINTS_SHOT = SHOTS.find((s) => s.file === "mac-hints")!;

// schema.org description of the page. Google retired HowTo rich results, so
// this is not chasing a snippet — it is what tells a crawler (and an answer
// engine) that this page is the rules of a specific game, by a named author,
// alongside a specific app.
const SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Play Two-Handed Pinochle",
    description: PAGES[PATH].description,
    mainEntityOfPage: canonicalUrl(PATH),
    inLanguage: "en",
    author: { "@type": "Organization", name: "Jinxwood" },
    publisher: { "@type": "Organization", name: "Evolonix LLC" },
    about: { "@type": "Thing", name: "Pinochle", alternateName: "Binocle" },
    mentions: {
      "@type": "SoftwareApplication",
      name: APP.name,
      applicationCategory: "GameApplication",
      operatingSystem: OPERATING_SYSTEMS,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: RULES_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  },
];

export default function HowToPlay() {
  usePageMeta(PATH, { jsonLd: SCHEMA });
  const active = useActiveSection(SECTIONS.map((s) => `#${s.id}`));

  return (
    <>
      {/* Intro, with the badge above the fold for a reader who arrived from
          search and is one click from the store. It starts on the page colour
          so it meets the navigation above without a seam. */}
      <section className="border-night-line from-night to-night-deep relative isolate overflow-hidden border-b bg-linear-to-b">
        <div
          aria-hidden
          className="bg-ember/15 pointer-events-none absolute top-1/4 -right-24 -z-10 h-96 w-96 rounded-full blur-3xl"
        />
        <div className="px-safe-lg relative mx-auto max-w-6xl py-16 sm:py-20">
          <Eyebrow>The complete rules</Eyebrow>
          <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl">
            How to play two-handed pinochle
          </h1>
          <p className="text-parchment-muted mt-5 max-w-2xl text-lg">
            Pinochle for two players is the original game, not a cut-down
            version of the partnership one — one 48-card deck, twelve cards
            each, and a stock you draw from until it runs dry. Here is the whole
            ruleset: the deal, the melds and what they score, the dix, the
            playoff after the stock is gone, and the race to 1,000.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <StoreBadges page="learn" />
            <p className="text-parchment-muted max-w-xs text-sm">
              Let {APP.shortName} deal, score, and enforce every rule below on{" "}
              {PLATFORM_LIST}.
            </p>
          </div>
        </div>
      </section>

      <div className="px-safe-lg mx-auto max-w-6xl py-12 sm:py-16">
        {/* minmax(0, 1fr) at every width: a plain single column would grow to
            fit its widest table and push the text past the page's gutter. */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
          {/* The contents list is a sidebar. Below desktop width there is no
              side to put it on and it would only push the rules down the page,
              so it is left out. */}
          <aside className="hidden lg:sticky lg:top-[calc(var(--header-h)+var(--subnav-h)+1.5rem)] lg:block lg:self-start">
            <nav aria-labelledby="toc-heading">
              <Eyebrow as="h2" id="toc-heading" className="mb-3">
                On this page
              </Eyebrow>
              <ol className="space-y-1 text-sm">
                {SECTIONS.map((s) => {
                  const isActive = active === `#${s.id}`;
                  return (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        aria-current={isActive ? "true" : undefined}
                        className={
                          isActive
                            ? "text-ember block rounded-md px-3 py-1.5 font-semibold bg-ember/10"
                            : "hover:text-ember block rounded-md px-3 py-1.5 transition-colors text-parchment-muted hover:bg-night-line"
                        }
                      >
                        {s.nav}
                      </a>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <Card className="mt-8">
              <img
                src={asset("img/app-icon.webp")}
                alt=""
                aria-hidden="true"
                className="h-12 w-12 rounded-[22%] ring-1 ring-white/10"
              />
              <p className="mt-3 text-sm font-semibold text-parchment">
                {PLAY.live
                  ? "Play it on your phone, tablet, computer, or TV"
                  : "Play it on your Apple devices"}
              </p>
              <p className="mt-1 text-sm text-parchment-muted">
                Legal moves highlighted, melds suggested, scoring handled.
              </p>
              <StoreBadges page="learn" className="mt-4 scale-90 origin-left" />
            </Card>
          </aside>

          <article className="max-w-3xl">
            <RuleSection {...section("at-a-glance")}>
              <p>
                Two-handed pinochle is a trick-taking game for exactly two
                players, and every deal comes in two halves. While the stock
                lasts you may play any card you like, and the winner of each
                trick scores a meld and draws a replacement. Once the stock is
                gone the rules tighten, melding stops, and the two of you play
                out the twelve cards left in hand for the points inside them.
              </p>
              <dl className="mt-6 grid gap-x-8 gap-y-3 rounded-2xl p-6 ring-1 sm:grid-cols-2 bg-night-raised ring-night-line">
                {RULES_FACTS.map((fact) => (
                  <div key={fact.term}>
                    <dt className="text-xs font-semibold tracking-[0.14em] uppercase text-parchment-muted">
                      {fact.term}
                    </dt>
                    <dd className="mt-0.5 text-sm text-parchment">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </RuleSection>

            <RuleSection {...section("the-cards")}>
              <p>
                Pinochle has its own deck: 48 cards, two copies each of the ace,
                ten, king, queen, jack and nine in every suit. Nothing below a
                nine is used. Away from a screen you can build one from two
                ordinary 52-card decks — pull those six ranks in all four suits
                from both decks and shuffle the 48 together.
              </p>
              <RankStrip />
              <p>
                That ranking is the first thing to catch a new player out: the
                ten is not a low card. It sits second, above the king, beaten
                only by the ace — and it is worth ten points to whoever captures
                it.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Twelve cards of each suit are in the deck, so whichever suit
                  is trump, there are twelve trumps in play and you will see
                  most of them.
                </li>
                <li>
                  Because every card has a twin, two identical cards regularly
                  meet in one trick. The one played first wins it.
                </li>
              </ul>
            </RuleSection>

            <RuleSection {...section("the-deal")}>
              <p>
                Cut for the first deal; after that it alternates. The dealer
                gives each player twelve cards — three rounds of four at a time,
                non-dealer first. The next card off the pile is turned face up:
                its suit is <strong>trump</strong> for the whole deal. The
                remaining 23 cards go face down across it and form the{" "}
                <strong>stock</strong>.
              </p>
              <p>
                The non-dealer leads the first trick. And if the card turned for
                trump happens to be the nine of trump — the{" "}
                <AppLink href="#the-dix">dix</AppLink> — the dealer scores 10
                for it straight away, before a card is played.
              </p>
            </RuleSection>

            <RuleSection {...section("phase-one")}>
              <p>
                The first twelve tricks are played under loose rules. There is
                no obligation to follow suit and no obligation to try to win:
                play any card in your hand.
              </p>
              <p>
                The trick goes to the higher card of the suit led, unless a
                trump beats it. A card of any other suit cannot win, however
                high — and if both cards are identical, the leader wins.
              </p>
              <p>After each trick, three things happen in order:</p>
              <ol className="list-decimal space-y-2 pl-5 marker:font-semibold">
                <li>
                  The winner may lay down <strong>one meld</strong> and scores
                  it immediately.
                </li>
                <li>
                  The winner draws the top card of the stock; the loser draws
                  the next. Both hands are back to twelve.
                </li>
                <li>The winner leads the next trick.</li>
              </ol>
              <p>
                The last replenishment has a flourish: the final stock card is
                turned face up for both players to see as the trick winner takes
                it, and the loser takes the trump card lying on the table. From
                that point each of you knows one card in the other&apos;s hand —
                and the stock is gone.
              </p>
            </RuleSection>

            <RuleSection {...section("melding")}>
              <p>
                A meld is a scoring combination laid face up on the table in
                front of you. It scores the moment it is declared. The cards
                stay on show but they still belong to your hand: you may play
                any of them to a trick, and whatever survives comes back to your
                hand when the stock runs out.
              </p>
              <p>Three rules govern melding:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Only the winner of the trick just played may meld, and only{" "}
                  <strong>one meld per trick</strong>.
                </li>
                <li>
                  At least one card of the meld must come{" "}
                  <strong>fresh from your hand</strong> — you cannot assemble
                  one entirely from cards already on the table.
                </li>
                <li>
                  A card already melded may join a new meld only in a{" "}
                  <strong>different class</strong>, or in a{" "}
                  <strong>higher-scoring meld of the same class</strong>. A
                  royal marriage can grow into a flush; a flush cannot be broken
                  back down into a marriage.
                </li>
              </ul>
              <MeldTable />
              <p>
                Classes exist only for that third rule. The queen of spades in a
                marriage can go on to make a pinochle (class A to class C) and
                then join the sixty queens (class B) — three scores from one
                card. What she cannot do is make a second marriage.
              </p>
              <p>
                Duplicates score in their own right: a second marriage in the
                same suit, built from the other king and queen, is another 20.
              </p>
            </RuleSection>

            <RuleSection {...section("the-dix")}>
              <p>
                The dix — say <em>deece</em> — is the nine of trump, and it is
                worth 10. It behaves unlike any other meld:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Turned for trump at the deal, it pays{" "}
                  <strong>the dealer</strong> 10 at once.
                </li>
                <li>
                  Held in hand, it is played by exchange: after winning a trick,
                  swap your dix for the trump card lying face up on the table
                  and score 10. You get the better card; the table keeps a nine.
                </li>
                <li>
                  Once a dix is the card on the table — turned there, or already
                  swapped in — there is nothing left to trade for. A second dix
                  is simply shown for its 10 and stays in your hand.
                </li>
                <li>
                  Declaring the dix does <strong>not</strong> use up your meld
                  for that trick. You may swap it and lay down a meld off the
                  same trick.
                </li>
              </ul>
            </RuleSection>

            <RuleSection {...section("phase-two")}>
              <p>
                When the stock is exhausted, melding is over. Every melded card
                returns to its owner&apos;s hand and you each hold twelve — a
                known quantity, much of it already seen.
              </p>
              <p>Now the rules bite. On each trick you must, in this order:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>follow the suit led, if you hold it;</li>
                <li>
                  when <strong>trump</strong> is led, play a higher trump if you
                  have one — you must try to win;
                </li>
                <li>trump the trick if you cannot follow suit;</li>
                <li>and only if you can do none of those, play anything.</li>
              </ul>
              <p>
                In a plain suit you are never forced to overtake — following
                suit is enough. Only trump obliges you to head the trick. The
                winner of the very last trick scores an extra 10.
              </p>
            </RuleSection>

            <RuleSection {...section("scoring")}>
              <p>
                Melds are already banked. What remains is to count the cards you
                captured in tricks:
              </p>
              <CounterTable />
              <p>
                That is {DEAL_POINTS.counters} points sitting in the deck. Add{" "}
                {DEAL_POINTS.lastTrick} for the last trick and every deal is
                worth exactly <strong>{DEAL_POINTS.total}</strong> in counters —
                melds on top of it.
              </p>
              <p>
                Round your trick total to the nearest ten before adding it up: a
                total ending in 7, 8 or 9 rounds up, anything less rounds down.
                47 counts 50; 46 counts 40. Your score for the deal is your
                melds plus your rounded trick points.
              </p>
            </RuleSection>

            <RuleSection {...section("winning")}>
              <p>
                <strong>A single deal</strong> is a complete short game: the
                higher total after one deal wins, and it is the best way to
                learn.
              </p>
              <p>
                <strong>The race to 1,000</strong> is the standard game. Deals
                continue, the deal alternating, until a player reaches 1,000.
              </p>
              <p>
                <strong>Declaring out</strong> is how the race usually ends. At
                any point when it is your turn to act, you may claim you are
                out: that your banked score, this deal&apos;s melds, and the
                counters you have already taken add up to the target. Your
                tricks are counted on the spot. Right, and you win the match
                immediately. Wrong, and you lose it. Cards you have captured are
                yours, so a player who counts carefully can end the game a trick
                early — and a player who guesses can hand it away.
              </p>
              <p>
                If neither of you declares and you both cross 1,000 in the same
                deal, nobody wins on the raw total. The target climbs to 1,250
                and play goes on — then 1,500, and so on, until one of you is
                alone above the line.
              </p>
            </RuleSection>

            <RuleSection {...section("strategy")}>
              <p>
                The rules above are the whole game. These are the habits that
                separate a player who knows them from one who wins with them.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {RULES_TIPS.map((tip) => (
                  <Card key={tip.heading}>
                    <h3 className="text-base font-semibold text-parchment">
                      {tip.heading}
                    </h3>
                    <p className="mt-2 text-sm text-parchment-muted">
                      {tip.body}
                    </p>
                  </Card>
                ))}
              </div>
            </RuleSection>

            <RuleSection {...section("faq")}>
              <dl className="divide-y divide-night-line">
                {RULES_FAQS.map((faq) => (
                  <div key={faq.question} className="py-5 first:pt-0 last:pb-0">
                    <dt className="text-base font-semibold text-parchment">
                      {faq.question}
                    </dt>
                    <dd className="mt-2 text-parchment-muted">{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </RuleSection>

            <div className="mt-14 border-t pt-8 border-night-line">
              <DeviceFrame shot={HINTS_SHOT} />
              <p className="mt-4 text-sm text-parchment-muted">
                Learning it at the table is easier with a referee. {APP.name}{" "}
                highlights the cards you may legally play, suggests the melds in
                your hand, and does every count above for you —{" "}
                <AppLink to={{ pathname: route(), hash: "#features" }}>
                  see what else it does
                </AppLink>{" "}
                or ask a rules question on the{" "}
                <AppLink to={route("/support")}>support page</AppLink>.
              </p>
              <p className="mt-6 text-xs text-parchment-muted">
                {RULES_DISCLAIMER}
              </p>
            </div>
          </article>
        </div>
      </div>

      {/* Closing CTA — mirrors the home page's, for readers who scrolled the
          whole ruleset and are the likeliest to install. */}
      <section className="border-night-line bg-night-deep relative isolate overflow-hidden border-t">
        <div
          aria-hidden
          className="bg-ember/15 pointer-events-none absolute top-1/2 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        />
        <div className="px-safe-lg relative mx-auto flex max-w-3xl flex-col items-center py-16 text-center sm:py-20">
          <h2 className="text-3xl sm:text-4xl">Now find someone to play</h2>
          <p className="text-parchment-muted mt-3 text-lg">
            {PLAY.live
              ? `Three AI opponents on ${PLATFORM_LIST} — plus online matches over Game Center and SharePlay over FaceTime on Apple devices.`
              : "Three AI opponents, online matches over Game Center, and SharePlay over FaceTime — on iPhone, iPad, Mac, and Apple TV."}
          </p>
          <div className="mt-8">
            <StoreBadges page="learn" />
          </div>
        </div>
      </section>
    </>
  );
}

/** One numbered rule section: an <h2> anchor plus its prose. */
function RuleSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="mt-12 scroll-mt-24 border-t pt-10 first:mt-0 first:border-t-0 first:pt-0 border-night-line"
    >
      <h2 id={`${id}-heading`} className="text-2xl sm:text-3xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-parchment-muted">{children}</div>
    </section>
  );
}

/** Ace high to nine low — the ranking that surprises people. */
function RankStrip() {
  return (
    <div className="mt-6 flex items-center gap-2 sm:gap-3">
      <span className="text-xs font-semibold tracking-[0.14em] uppercase text-parchment-muted">
        High
      </span>
      <ol className="flex flex-1 items-center gap-1.5 sm:gap-2">
        {RANK_ORDER.map((rank) => (
          <li
            key={rank}
            className="flex h-11 flex-1 items-center justify-center rounded-lg text-base font-semibold ring-1 bg-night-raised text-parchment ring-night-line"
          >
            {rank}
          </li>
        ))}
      </ol>
      <span className="text-xs font-semibold tracking-[0.14em] uppercase text-parchment-muted">
        Low
      </span>
    </div>
  );
}

const MELD_CLASS_ORDER: MeldClass[] = ["A", "B", "C"];

/** Every meld and its value, grouped by the class that governs re-melding. */
function MeldTable() {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl ring-1 ring-night-line">
      {/* 20rem is the narrowest the three columns stay readable. It fits the
          column on a 375px phone; anything narrower scrolls sideways. */}
      <table className="w-full min-w-80 border-collapse text-left text-sm">
        <caption className="sr-only">
          Pinochle melds, their cards, and their point values
        </caption>
        <thead>
          <tr className="bg-night-raised">
            <th scope="col" className="px-4 py-3 font-semibold text-parchment">
              Meld
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-parchment">
              Cards
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right font-semibold text-parchment"
            >
              Points
            </th>
          </tr>
        </thead>
        {MELD_CLASS_ORDER.map((cls) => (
          <tbody
            key={cls}
            className="divide-y border-t divide-night-line border-night-line"
          >
            <tr>
              <th
                scope="colgroup"
                colSpan={3}
                className="px-4 py-2 text-xs font-semibold tracking-[0.14em] uppercase bg-night-raised/60 text-parchment-muted"
              >
                Class {cls} · {MELD_CLASSES[cls]}
              </th>
            </tr>
            {MELDS.filter((meld) => meld.cls === cls).map((meld) => (
              <tr key={meld.name}>
                <td className="px-4 py-3 align-top font-medium text-parchment">
                  {meld.name}
                  {meld.also && (
                    <span className="block text-xs font-normal text-parchment-muted">
                      also called {meld.also}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 align-top text-parchment-muted">
                  {meld.detail}
                </td>
                <td className="text-ember px-4 py-3 text-right align-top font-semibold tabular-nums">
                  {meld.points}
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

/** What each captured card is worth when the tricks are counted. */
function CounterTable() {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl ring-1 ring-night-line">
      <table className="w-full min-w-72 border-collapse text-left text-sm">
        <caption className="sr-only">
          Point value of each rank when captured in a trick
        </caption>
        <thead>
          <tr className="bg-night-raised">
            <th scope="col" className="px-4 py-3 font-semibold text-parchment">
              Card
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-parchment">
              In the deck
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right font-semibold text-parchment"
            >
              Each
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right font-semibold text-parchment"
            >
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y border-t divide-night-line border-night-line">
          {COUNTERS.map((counter) => (
            <tr key={counter.rank}>
              <td className="px-4 py-3 font-medium text-parchment">
                {counter.rank}
              </td>
              <td className="px-4 py-3 tabular-nums text-parchment-muted">
                {counter.count}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-parchment-muted">
                {counter.points}
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-parchment">
                {counter.points * counter.count}
              </td>
            </tr>
          ))}
          <tr className="bg-night-raised">
            <td colSpan={3} className="px-4 py-3 font-medium text-parchment">
              Counters in the deck
            </td>
            <td className="px-4 py-3 text-right font-semibold tabular-nums text-parchment">
              {DEAL_POINTS.counters}
            </td>
          </tr>
          <tr className="bg-night-raised">
            <td colSpan={3} className="px-4 py-3 font-medium text-parchment">
              Last trick
            </td>
            <td className="px-4 py-3 text-right font-semibold tabular-nums text-parchment">
              {DEAL_POINTS.lastTrick}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
