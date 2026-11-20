import { AppLink } from "../../_components/app-link";
import { StoreBadges } from "./_components/store-badges";
import { Button } from "../../_components/button";
import { Card } from "./_components/card";
import { DeviceFrame } from "./_components/device-frame";
import { Eyebrow } from "../../_components/eyebrow";
import { FeatureCard } from "./_components/feature-card";
import {
  AndroidIcon,
  AndroidTVIcon,
  AppleTVIcon,
  ChromebookIcon,
  IPadIcon,
  IPhoneIcon,
  MacIcon,
} from "./_components/icons";
import { ScreenshotGallery } from "./_components/screenshot-gallery";
import { StickyGetBar } from "./_components/sticky-get-bar";
import { VideoFrame } from "./_components/video-frame";
import { asset } from "./_lib/asset";
import {
  ACHIEVEMENTS,
  APP,
  DOWNLOAD_FAQS,
  REVIEWS,
  FEATURES,
  LEADERBOARDS,
  MELDS,
  PLATFORMS,
  RULES,
  RULES_DISCLAIMER,
  SHOTS,
  HERO_SHOT,
  STORE,
  HERO,
  STORE_URL,
  WHATS_NEW,
  EARLIER_RELEASE,
  type Badge,
  type PlatformIcon,
  OPERATING_SYSTEMS,
  PLAY,
} from "./_lib/content";
import { usePageMeta } from "../../_lib/use-page-meta";
import { route } from "./_lib/routes";

const PLATFORM_ICONS: Record<
  PlatformIcon,
  (props: { className?: string }) => React.ReactNode
> = {
  iphone: IPhoneIcon,
  ipad: IPadIcon,
  mac: MacIcon,
  appletv: AppleTVIcon,
  android: AndroidIcon,
  chromebook: ChromebookIcon,
  androidtv: AndroidTVIcon,
};

const HINTS_SHOT = SHOTS.find((s) => s.file === "mac-hints")!;

// Tells a crawler what the site is about in its own vocabulary: an app, on
// these platforms, at that store URL. The price is deliberately absent — the
// App Store listing is the source of truth for it (see APP.price).
const SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: APP.name,
    description: APP.subtitle,
    applicationCategory: "GameApplication",
    applicationSubCategory: "Card Game",
    operatingSystem: OPERATING_SYSTEMS,
    softwareVersion: STORE.version,
    installUrl: STORE_URL,
    author: {
      "@type": "Organization",
      name: "Jinxwood Games",
      legalName: "Evolonix LLC",
    },
    publisher: {
      "@type": "Organization",
      name: "Jinxwood Games",
      legalName: "Evolonix LLC",
    },
  },
];

export default function Home() {
  usePageMeta(route(), { jsonLd: SCHEMA });
  return (
    <>
      {/* Hero. It starts on the page color, so it meets the navigation above
          without a seam, and deepens toward its lower edge. The two glows
          keep clear of the top for the same reason. */}
      <section
        id="top"
        className="border-night-line from-night to-night-deep relative isolate overflow-hidden border-b bg-linear-to-b"
      >
        <div
          aria-hidden
          className="bg-ember/15 pointer-events-none absolute top-1/4 -right-24 -z-10 h-96 w-96 rounded-full blur-3xl"
        />
        <div
          aria-hidden
          className="bg-moss/25 pointer-events-none absolute -bottom-40 -left-24 -z-10 h-96 w-96 rounded-full blur-3xl"
        />
        <div className="px-safe-lg relative mx-auto grid max-w-6xl items-center gap-12 py-20 sm:py-28 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-4">
              <img
                src={asset("img/app-icon.webp")}
                alt="Pinochle app icon"
                className="h-16 w-16 rounded-[22%] shadow-lg ring-1 ring-white/10"
              />
              <div>
                <p className="font-display text-xl font-semibold">{APP.name}</p>
                <p className="text-moss-light text-xs font-semibold tracking-[0.18em] uppercase">
                  {APP.category}
                </p>
              </div>
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl">{HERO.headline}</h1>
            <p className="text-parchment-muted mt-4 max-w-xl text-lg sm:text-xl">
              {HERO.subhead}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <StoreBadges />
              <p className="text-parchment-muted text-sm">{APP.age}</p>
            </div>

            <ul className="mt-6 flex flex-col gap-2 text-sm font-medium text-parchment sm:text-base">
              {HERO.trust.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className="text-moss-light h-5 w-5 flex-none"
                    fill="currentColor"
                  >
                    <path d="M8.1 13.6 4.5 10l-1.4 1.4 5 5 9-9-1.4-1.4z" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>

            <ul className="mt-8 flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const Icon = PLATFORM_ICONS[p.icon];
                return (
                  <li
                    key={p.name}
                    className="border-night-line text-parchment-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
                  >
                    <Icon className="h-4 w-4" />
                    {p.name}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="lg:pl-6">
            <DeviceFrame shot={HERO_SHOT} showLabel={false} loading="eager" />
          </div>
        </div>
      </section>

      {/* Gameplay video — the 2.0 press clip, straight after the hero so the
          first thing below the fold is the game moving; What's New folds
          under it for returning players. Its end card names the stores, so
          the Google Play cut plays once Play is live (PLAY.live). */}
      <section className="px-safe-lg mx-auto max-w-5xl py-16 sm:py-20">
        <Eyebrow className="mb-3">See it in action</Eyebrow>
        <h2 className="text-3xl sm:text-4xl">Deal, meld, play</h2>
        <p className="mt-4 max-w-2xl text-lg text-parchment-muted">
          A real hand with the cameo court cards and the new Medallion card
          back: the deal, the first tricks, and a meld laid down for points.
        </p>
        <VideoFrame
          src={asset(
            PLAY.live
              ? "video/pinochle-2.0-preview-play.mp4"
              : "video/pinochle-2.0-preview.mp4",
          )}
          poster={asset("video/pinochle-2.0-preview-poster.webp")}
          label="Gameplay video: a title card, then a hand of two-handed pinochle being dealt, played, and melded against the computer"
          className="mt-10"
        />
        <Card className="mt-10">
          {/* Folded by default: most visitors are new, and a changelog reads as
              noise before they know the game; returning players open it. */}
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <h2 className="text-xl">What&apos;s new in {STORE.version}</h2>
              <span
                aria-hidden
                className="text-ember text-2xl leading-none transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <ul className="mt-4 list-disc space-y-2 pl-5 marker:text-ember text-parchment-muted">
              {WHATS_NEW.map((item) => (
                <li key={item.slice(0, 24)}>{item}</li>
              ))}
            </ul>
            {EARLIER_RELEASE && (
              <>
                <h3 className="mt-6 text-sm font-semibold text-parchment">
                  And in {EARLIER_RELEASE.version}
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm marker:text-ember text-parchment-muted">
                  {EARLIER_RELEASE.items.map((item) => (
                    <li key={item.slice(0, 24)}>{item}</li>
                  ))}
                </ul>
              </>
            )}
          </details>
        </Card>
      </section>

      {/* Features */}
      <section className="px-safe-lg mx-auto max-w-6xl py-16 sm:py-20">
        <div id="features" className="scroll-mt-24">
          <Eyebrow className="mb-3">Features</Eyebrow>
          <h2 className="text-3xl sm:text-4xl">
            Everything a pinochle player wants
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-parchment-muted">
            A real opponent, real rules, and the polish to make every deal a
            pleasure.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      {/* Screenshots */}
      <section
        id="screenshots"
        className="border-t border-night-line bg-night-deep"
      >
        <div className="px-safe-lg mx-auto max-w-6xl py-16 sm:py-20">
          <Eyebrow className="mb-3">Screenshots</Eyebrow>
          <h2 className="text-3xl sm:text-4xl">One deck, every screen</h2>
          <p className="mt-4 max-w-2xl text-lg text-parchment-muted">
            {PLAY.live
              ? "The new look, with kings, queens, and jacks in gold-framed profile, on Apple and Android phones, tablets, computers, and TVs."
              : "The new look, with kings, queens, and jacks in gold-framed profile, on iPhone, iPad, Mac, and Apple TV."}{" "}
            Pick a device to take a look.
          </p>
          <div className="mt-10">
            <ScreenshotGallery />
          </div>
        </div>
      </section>

      {/* Reviews — only once there are real ones to show (REVIEWS). */}
      {REVIEWS.length > 0 && (
        <section className="px-safe-lg mx-auto max-w-6xl py-16 sm:py-20">
          <Eyebrow className="mb-3">Reviews</Eyebrow>
          <h2 className="text-3xl sm:text-4xl">What players say</h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {REVIEWS.map((r) => (
              <li key={r.author + r.quote.slice(0, 16)}>
                <Card>
                  {/* aria-label is not read on a paragraph, so the rating is
                      real text and the stars are hidden from screen readers. */}
                  <p className="text-ember">
                    <span aria-hidden="true">
                      {"★".repeat(r.stars)}
                      <span className="text-night-line">
                        {"★".repeat(5 - r.stars)}
                      </span>
                    </span>
                    <span className="sr-only">{r.stars} out of 5 stars</span>
                  </p>
                  <blockquote className="mt-3 text-parchment-muted">
                    “{r.quote}”
                  </blockquote>
                  <p className="mt-3 text-sm font-medium text-parchment-muted">
                    {r.author}, App Store review
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Before you download — the questions that stop a visitor short of the
          badge, answered where they'd ask them. */}
      <section id="faq" className="border-night-line scroll-mt-24 border-t">
        <div className="px-safe-lg mx-auto max-w-6xl py-16 sm:py-20">
          <Eyebrow className="mb-3">Before you download</Eyebrow>
          <h2 className="text-3xl sm:text-4xl">Good questions</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {DOWNLOAD_FAQS.map((faq) => (
              <Card key={faq.question}>
                <h3 className="text-base font-semibold text-parchment">
                  {faq.question}
                </h3>
                <p className="mt-2 text-sm text-parchment-muted">
                  {faq.answer}
                  {faq.link && (
                    <>
                      {" "}
                      {faq.link.href.startsWith("/") ? (
                        <AppLink to={route(faq.link.href)}>
                          {faq.link.label}
                        </AppLink>
                      ) : (
                        <AppLink href={faq.link.href}>{faq.link.label}</AppLink>
                      )}
                    </>
                  )}
                </p>
              </Card>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <StoreBadges />
            <p className="text-sm text-parchment-muted">
              {HERO.trust[0]} · {HERO.trust[1]}
            </p>
          </div>
        </div>
      </section>

      {/* How to play */}
      <section
        id="how-to-play"
        className="border-t border-night-line bg-night-deep"
      >
        <div className="px-safe-lg mx-auto max-w-6xl py-16 sm:py-20">
          <Eyebrow className="mb-3">How to play</Eyebrow>
          <h2 className="text-3xl sm:text-4xl">The game in six steps</h2>
          <p className="mt-4 max-w-2xl text-lg text-parchment-muted">
            Two-handed pinochle plays in two phases. Here&apos;s the shape of
            it, start to 1,000 — the app teaches the rest as you go, and the{" "}
            <AppLink to={route("/how-to-play")}>
              complete two-handed pinochle rules
            </AppLink>{" "}
            are written out in full.
          </p>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <ol className="space-y-6">
              {RULES.map((rule, i) => (
                <li key={rule.heading} className="flex gap-4">
                  <span className="text-ember flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold bg-ember/10">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-parchment">
                      {rule.heading}
                    </h3>
                    <p className="mt-1 text-sm text-parchment-muted">
                      {rule.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-parchment">
                  Meld scoring
                </h3>
                <dl className="mt-4 divide-y divide-night-line">
                  {MELDS.map((meld) => (
                    <div
                      key={meld.name}
                      className="flex items-baseline justify-between gap-4 py-2"
                    >
                      <dt>
                        <span className="font-medium text-parchment">
                          {meld.name}
                        </span>{" "}
                        <span className="text-sm text-parchment-muted">
                          {meld.detail}
                        </span>
                      </dt>
                      <dd className="text-ember shrink-0 font-semibold tabular-nums">
                        {meld.points}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>
              <DeviceFrame shot={HINTS_SHOT} />
            </div>
          </div>

          <div className="mt-10">
            <Button to={route("/how-to-play")}>Read the complete rules</Button>
          </div>

          <p className="mt-10 max-w-2xl text-xs text-parchment-muted">
            {RULES_DISCLAIMER}
          </p>
        </div>
      </section>

      {/* Achievements & leaderboards */}
      <section className="px-safe-lg mx-auto max-w-6xl py-16 sm:py-20">
        <div id="achievements" className="scroll-mt-24">
          <Eyebrow className="mb-3">
            {PLAY.live ? "Game Center & Google Play Games" : "Game Center"}
          </Eyebrow>
          <h2 className="text-3xl sm:text-4xl">
            {PLAY.live
              ? "Achievements to chase"
              : "Fifteen achievements to chase"}
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-parchment-muted">
            {PLAY.live
              ? "Fifteen on Game Center, fourteen on Google Play Games. Wins, streaks, and legendary hands earn them, and five leaderboards on each rank you against other players."
              : "Wins, streaks, and legendary hands earn achievements, and five Game Center leaderboards rank you against other players."}
          </p>
        </div>

        <BadgeGrid badges={ACHIEVEMENTS} />

        <h3 className="mt-14 text-lg font-semibold text-parchment">
          Leaderboards
        </h3>
        <BadgeGrid badges={LEADERBOARDS} />
      </section>

      {/* Final CTA */}
      <section className="border-night-line bg-night-deep relative isolate overflow-hidden border-t">
        <div
          aria-hidden
          className="bg-ember/15 pointer-events-none absolute top-1/2 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        />
        <div className="px-safe-lg relative mx-auto flex max-w-3xl flex-col items-center py-20 text-center sm:py-24">
          <h2 className="text-3xl sm:text-4xl">{APP.tagline}</h2>
          <p className="text-parchment-muted mt-3 text-lg">{APP.closer}</p>
          <div className="mt-8">
            <StoreBadges />
          </div>
          <ul className="mt-8 flex flex-wrap justify-center gap-2">
            {PLATFORMS.map((p) => {
              const Icon = PLATFORM_ICONS[p.icon];
              return (
                <li
                  key={p.name}
                  className="border-night-line text-parchment-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
                >
                  <Icon className="h-4 w-4" />
                  {p.name}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <StickyGetBar watchId="top" />
    </>
  );
}

function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
      {badges.map((badge) => (
        <li key={badge.file} className="flex flex-col items-center gap-2">
          <img
            src={asset(`img/gc/${badge.file}.webp`)}
            alt={`${badge.name} — card artwork`}
            loading="lazy"
            decoding="async"
            className="aspect-square w-full rounded-2xl object-cover ring-1 ring-night-line"
          />
          <span className="text-center text-sm font-medium text-parchment-muted">
            {badge.name}
          </span>
        </li>
      ))}
    </ul>
  );
}
