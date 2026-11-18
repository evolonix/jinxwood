import { liveStores, type Game, type StoreLink } from "../_lib/content";
import { AppleIcon } from "./icons";

const STORE: Record<
  StoreLink["kind"],
  { lead: string; name: string; label: (game: string) => string }
> = {
  "app-store": {
    lead: "Download on the",
    name: "App Store",
    label: (game) => `Download ${game} on the App Store`,
  },
  "google-play": {
    lead: "Get it on",
    name: "Google Play",
    label: (game) => `Get ${game} on Google Play`,
  },
};

interface StoreBadgesProps {
  game: Game;
  className?: string;
}

/**
 * One badge per store where the game's listing is public. A store marked
 * `live: false` in content.ts shows nothing, so a listing can be recorded
 * before it opens.
 */
export function StoreBadges({ game, className }: StoreBadgesProps) {
  const stores = liveStores(game);
  if (stores.length === 0) return null;
  return (
    <div
      className={["flex flex-wrap gap-3", className].filter(Boolean).join(" ")}
    >
      {stores.map((store) => {
        const { lead, name, label } = STORE[store.kind];
        return (
          <a
            key={store.kind}
            href={store.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label(game.name)}
            className="inline-flex items-center gap-2.5 rounded-xl bg-black px-4 py-2.5 text-white ring-1 ring-white/20 transition-colors hover:bg-zinc-900"
          >
            {store.kind === "app-store" && <AppleIcon className="h-7 w-7" />}
            <span className="flex flex-col leading-none">
              <span className="text-[0.625rem] font-medium tracking-wide">
                {lead}
              </span>
              <span className="mt-0.5 text-xl font-semibold tracking-tight">
                {name}
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
