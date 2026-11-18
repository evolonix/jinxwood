import { Link } from "react-router";
import type { Game } from "../_lib/content";
import { gamePath } from "../_lib/seo";
import { Button } from "./button";
import { ArrowRightIcon } from "./icons";
import { PlatformList } from "./platform-list";
import { StoreBadges } from "./store-badges";

interface GameCardProps {
  game: Game;
  /** Heading level for the game's name, to fit the page's outline. */
  as?: "h2" | "h3";
}

/**
 * A game at a glance: icon, name, pitch, platforms and where to get it, beside
 * a screenshot. Used on the home page and the games index.
 */
export function GameCard({ game, as: Heading = "h3" }: GameCardProps) {
  const [shot] = game.art.shots;
  const to = gamePath(game.slug);
  return (
    <article className="bg-night-raised ring-night-line grid overflow-hidden rounded-3xl ring-1 transition-shadow duration-300 hover:shadow-glow lg:grid-cols-[1fr_1.15fr]">
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <img
            src={game.art.icon.src}
            width={game.art.icon.width}
            height={game.art.icon.height}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-20 w-20 shrink-0 rounded-[22%] shadow-lg ring-1 ring-white/10"
          />
          <div>
            <Heading className="text-2xl sm:text-3xl">
              <Link to={to} viewTransition className="hover:text-ember">
                {game.name}
              </Link>
            </Heading>
            <p className="text-parchment-muted mt-1">{game.subtitle}</p>
          </div>
        </div>
        <p className="font-display text-xl">{game.tagline}</p>
        <p className="text-parchment-muted">{game.description}</p>
        <PlatformList platforms={game.platforms} />
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-2">
          <StoreBadges game={game} />
          <Button to={to} variant="outline">
            More about {game.shortName}
            <ArrowRightIcon />
          </Button>
        </div>
      </div>
      {shot && (
        <Link
          to={to}
          viewTransition
          tabIndex={-1}
          aria-hidden="true"
          className="bg-night-deep block"
        >
          <img
            src={shot.src}
            width={shot.width}
            height={shot.height}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </Link>
      )}
    </article>
  );
}
