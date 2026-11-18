import { notFound, useRouteParams } from "@evolonix/react-router-next";
import { AppLink } from "../../_components/app-link";
import { Button } from "../../_components/button";
import { Eyebrow } from "../../_components/eyebrow";
import { ArrowLeftIcon, ExternalIcon } from "../../_components/icons";
import { PlatformList } from "../../_components/platform-list";
import { StoreBadges } from "../../_components/store-badges";
import { gameBySlug, STUDIO, type Game } from "../../_lib/content";
import { canonicalUrl, gamePath } from "../../_lib/seo";
import { usePageMeta } from "../../_lib/use-page-meta";

export default function GamePage() {
  const { slug } = useRouteParams("games/[slug]");
  const game = gameBySlug(slug);
  // An unknown slug has no entry in the PAGES table either, so bail out to the
  // not-found page before anything looks its metadata up.
  if (!game) notFound();
  return <GameDetails game={game} />;
}

function GameDetails({ game }: { game: Game }) {
  const path = gamePath(game.slug);
  usePageMeta(path, {
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "VideoGame",
        name: game.name,
        description: game.description,
        url: canonicalUrl(path),
        image: `${STUDIO.url}${game.art.icon.src}`,
        gamePlatform: game.platforms,
        publisher: { "@type": "Organization", name: STUDIO.name },
      },
    ],
  });
  const [lead, ...moreShots] = game.art.shots;

  return (
    <div className="px-safe-lg mx-auto max-w-6xl py-10 sm:py-14">
      <AppLink to="/games" className="inline-flex items-center gap-1.5 text-sm">
        <ArrowLeftIcon />
        All games
      </AppLink>

      <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
        <div>
          <img
            src={game.art.icon.src}
            width={game.art.icon.width}
            height={game.art.icon.height}
            alt=""
            decoding="async"
            className="h-24 w-24 rounded-[22%] shadow-lg ring-1 ring-white/10"
          />
          <Eyebrow className="mt-6 mb-3">A {STUDIO.name} game</Eyebrow>
          <h1 className="text-4xl sm:text-5xl">{game.name}</h1>
          <p className="text-parchment-muted mt-2 text-xl">{game.subtitle}</p>
          <p className="font-display mt-6 text-2xl">{game.tagline}</p>
          <p className="text-parchment-muted mt-4 text-lg">
            {game.description}
          </p>
          <PlatformList platforms={game.platforms} className="mt-6" />
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <StoreBadges game={game} />
            <Button
              href={game.site}
              variant="outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit the {game.shortName} site
              <ExternalIcon />
            </Button>
          </div>
          <p className="text-moss-light mt-4 text-sm font-semibold">
            {game.price}
          </p>
        </div>
        {lead && <Screenshot shot={lead} eager />}
      </div>

      <section className="mt-16">
        <h2 className="text-2xl sm:text-3xl">What&apos;s in the box</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {game.highlights.map((highlight) => (
            <li
              key={highlight}
              className="bg-night-raised ring-night-line rounded-2xl p-5 font-semibold ring-1"
            >
              {highlight}
            </li>
          ))}
        </ul>
      </section>

      {moreShots.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl sm:text-3xl">A closer look</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {moreShots.map((shot) => (
              <Screenshot key={shot.src} shot={shot} />
            ))}
          </div>
        </section>
      )}

      <section className="border-night-line mt-16 border-t pt-10">
        <h2 className="text-2xl sm:text-3xl">Help and policies</h2>
        <p className="text-parchment-muted mt-4 max-w-2xl">
          {game.shortName} has its own site, with the rules, support, and the
          policies that apply to the game itself.
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
          <li>
            <AppLink href={game.site}>{game.shortName} website</AppLink>
          </li>
          <li>
            <AppLink href={game.links.support}>Support</AppLink>
          </li>
          <li>
            <AppLink href={game.links.privacy}>Privacy policy</AppLink>
          </li>
          <li>
            <AppLink href={game.links.terms}>Terms of use</AppLink>
          </li>
        </ul>
      </section>
    </div>
  );
}

function Screenshot({
  shot,
  eager = false,
}: {
  shot: Game["art"]["shots"][number];
  eager?: boolean;
}) {
  return (
    <img
      src={shot.src}
      width={shot.width}
      height={shot.height}
      alt={shot.alt}
      loading={eager ? undefined : "lazy"}
      decoding="async"
      className="ring-night-line h-auto w-full rounded-2xl shadow-2xl ring-1"
    />
  );
}
