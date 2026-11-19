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
 *
 * The whole card goes to the game's page. The link is the game's name, and its
 * ::after is stretched over the card, so there is still one link for a screen
 * reader and the pointer shows everywhere. The store badge and the button sit
 * above that layer to stay clickable in their own right.
 */
export function GameCard({ game, as: Heading = "h3" }: GameCardProps) {
  const [shot] = game.art.shots;
  const to = gamePath(game.slug);
  return (
    <article className="bg-night-raised ring-night-line group relative grid overflow-hidden rounded-3xl ring-1 transition-shadow duration-300 hover:shadow-glow lg:grid-cols-[1fr_1.15fr]">
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
              <Link
                to={to}
                viewTransition
                className="group-hover:text-ember transition-colors after:absolute after:inset-0"
              >
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
          <StoreBadges game={game} className="relative z-10" />
          <Button to={to} variant="outline" className="relative z-10">
            More about {game.shortName}
            <ArrowRightIcon />
          </Button>
        </div>
      </div>
      {shot && (
        <div className="bg-night-deep">
          <img
            src={shot.src}
            width={shot.width}
            height={shot.height}
            alt={shot.alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
      )}
    </article>
  );
}
