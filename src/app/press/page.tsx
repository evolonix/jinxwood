import type { ReactNode } from "react";
import { AppLink } from "../_components/app-link";
import { Eyebrow } from "../_components/eyebrow";
import { DownloadIcon } from "../_components/icons";
import { Logo, TrademarkSymbol, type LogoName } from "../_components/logo";
import { IMAGE_SIZES } from "../_lib/brand.gen";
import {
  GAMES,
  liveStores,
  PALETTE,
  PRESS,
  sentenceList,
  STUDIO,
} from "../_lib/content";
import { gamePath } from "../_lib/seo";
import { usePageMeta } from "../_lib/use-page-meta";

export default function Press() {
  usePageMeta("/press");
  return (
    <div className="px-safe-lg mx-auto max-w-6xl py-12 sm:py-16">
      <Eyebrow className="mb-3">Press and brand kit</Eyebrow>
      <h1 className="text-4xl sm:text-5xl">Writing about {STUDIO.name}?</h1>
      <p className="text-parchment-muted mt-4 max-w-2xl text-lg">
        Here is who we are, the logos and colors, and where to reach us.
        Everything on this page is free to use in coverage of the studio and its
        games.
      </p>

      <Block title="About the studio">
        <p className="max-w-3xl text-lg">{PRESS.boilerplate}</p>
        <dl className="mt-8 grid max-w-3xl gap-x-8 gap-y-4 sm:grid-cols-[10rem_1fr]">
          <Fact term="Studio">{STUDIO.name}</Fact>
          <Fact term="Company">{STUDIO.owner}</Fact>
          <Fact term="Games">
            {GAMES.map((game, i) => (
              <span key={game.slug}>
                {i > 0 && ", "}
                <AppLink to={gamePath(game.slug)}>{game.name}</AppLink>
              </span>
            ))}
          </Fact>
          <Fact term="Website">
            <AppLink to="/">{STUDIO.url.replace("https://", "")}</AppLink>
          </Fact>
          <Fact term="Contact">
            <AppLink href={`mailto:${STUDIO.email}`}>{STUDIO.email}</AppLink>
          </Fact>
        </dl>
      </Block>

      {GAMES.filter((game) => game.status === "released").map((game) => {
        const playToFollow = game.stores.some(
          (store) => store.kind === "google-play" && !store.live,
        );
        return (
          <Block key={game.slug} title={`${game.name} at a glance`}>
            <dl className="grid max-w-3xl gap-x-8 gap-y-4 sm:grid-cols-[10rem_1fr]">
              <Fact term="Version">
                {game.release.version}, released {game.release.date} (first
                released {game.release.firstReleased})
              </Fact>
              <Fact term="Price">
                {game.price}. {game.priceNote}
              </Fact>
              <Fact term="Platforms">
                {sentenceList(game.platforms)}
                {playToFollow && "; Android on Google Play to follow"}
              </Fact>
              <Fact term="Developer">{game.developer}</Fact>
              <Fact term="Get it">
                {liveStores(game).map((store, i) => (
                  <span key={store.kind}>
                    {i > 0 && ", "}
                    <AppLink href={store.url}>
                      {store.kind === "app-store" ? "App Store" : "Google Play"}
                    </AppLink>
                  </span>
                ))}
              </Fact>
              <Fact term="Press contact">
                <AppLink href={`mailto:${STUDIO.email}`}>
                  {STUDIO.email}
                </AppLink>
              </Fact>
            </dl>
            <p className="text-parchment-muted mt-6 max-w-3xl">
              The screenshots and gameplay video on{" "}
              <AppLink to={gamePath(game.slug)}>the game&apos;s page</AppLink>{" "}
              are free to use in coverage.
            </p>
          </Block>
        );
      })}

      <Block title="Logos">
        <ul className="grid gap-6 sm:grid-cols-2">
          {PRESS.downloads.map((item) => {
            const name: LogoName = item.preview;
            const { width, height } = IMAGE_SIZES[name];
            return (
              <li
                key={item.file}
                className="ring-night-line overflow-hidden rounded-2xl ring-1"
              >
                <div
                  className={`flex h-48 items-center justify-center p-8 ${
                    item.on === "parchment" ? "bg-parchment" : "bg-night-deep"
                  }`}
                >
                  {/* A box of exactly the logo's shape, as tall as the 8rem
                      this tile leaves or as wide as it allows, so the
                      trademark symbol lands where the download has it. */}
                  <div
                    className="relative"
                    style={{
                      width: `min(100%, ${(8 * width) / height}rem)`,
                      aspectRatio: `${width} / ${height}`,
                    }}
                  >
                    <Logo
                      name={name}
                      sizes="20rem"
                      alt=""
                      className="h-full w-full"
                    />
                    <TrademarkSymbol name={name} />
                  </div>
                </div>
                <Download
                  href={item.file}
                  label={item.label}
                  note={item.note}
                />
              </li>
            );
          })}
        </ul>
        <ul className="text-parchment-muted mt-8 max-w-3xl list-disc space-y-2 pl-5">
          {PRESS.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </Block>

      <Block title="Colors">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PALETTE.map((color) => (
            <li
              key={color.hex}
              className="ring-night-line flex flex-col overflow-hidden rounded-2xl ring-1"
            >
              {/* The hex value sits on its own dark chip: parchment straight
                  on the moss swatch is 4.3:1, short of the 4.5:1 small text
                  needs. */}
              <div
                className="flex h-28 items-end p-4"
                style={{ backgroundColor: color.hex }}
              >
                <span className="bg-night-deep text-parchment rounded-md px-2 py-1 font-mono text-sm font-semibold">
                  {color.hex}
                </span>
              </div>
              <div className="bg-night-raised flex-1 p-4">
                <h3 className="text-lg">{color.name}</h3>
                <p className="text-parchment-muted mt-1 text-sm">{color.use}</p>
              </div>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Typography">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-night-raised ring-night-line rounded-2xl p-6 ring-1">
            <p className="font-display text-5xl font-semibold">Fraunces</p>
            <p className="font-display mt-3 text-2xl">
              A little mischief, a little magic
            </p>
            <p className="text-parchment-muted mt-4 text-sm">
              Headings. SemiBold to Bold, with the Soft axis up and Wonk on.
            </p>
          </div>
          <div className="bg-night-raised ring-night-line rounded-2xl p-6 ring-1">
            <p className="text-5xl font-semibold">Nunito Sans</p>
            <p className="mt-3 text-2xl">Friendly, rounded and readable</p>
            <p className="text-parchment-muted mt-4 text-sm">
              Body text. Regular for reading, SemiBold for buttons and labels.
            </p>
          </div>
        </div>
        <p className="text-parchment-muted mt-6 max-w-3xl">
          Both are open-source typefaces, free to use from Google Fonts.
        </p>
      </Block>

      <Block title="Artwork">
        <div className="ring-night-line max-w-3xl overflow-hidden rounded-2xl ring-1">
          <img
            src="/img/hero/hero-1280.webp"
            width={1280}
            height={720}
            alt="The Jinxwood forest illustration: a castle at twilight, seen through the trees."
            loading="lazy"
            decoding="async"
            className="h-auto w-full"
          />
          <Download
            href={PRESS.art.file}
            label={PRESS.art.label}
            note={PRESS.art.note}
          />
        </div>
      </Block>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-night-line mt-14 border-t pt-10">
      <h2 className="mb-6 text-2xl sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-parchment-muted text-sm font-semibold tracking-wide uppercase">
        {term}
      </dt>
      <dd>{children}</dd>
    </>
  );
}

function Download({
  href,
  label,
  note,
}: {
  href: string;
  label: string;
  note: string;
}) {
  return (
    <div className="bg-night-raised flex items-center justify-between gap-4 p-4">
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-parchment-muted text-sm">{note}</p>
      </div>
      <a
        href={href}
        download
        aria-label={`Download: ${label}`}
        className="bg-ember text-night hover:bg-ember-bright inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
      >
        <DownloadIcon />
        Download
      </a>
    </div>
  );
}
