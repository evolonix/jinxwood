import { liveStores, type Game } from "../_lib/content";
import { AppleIcon } from "./icons";

interface StoreBadgesProps {
  game: Game;
  className?: string;
}

/**
 * One badge per store where the game's listing is public. A store marked
 * `live: false` in content.ts shows nothing, so a listing can be recorded
 * before it opens.
 *
 * The App Store badge is drawn; Google's brand rules allow only their own
 * badge artwork, unaltered, so Google Play's is their image
 * (public/img/google-play-badge.png, from play.google.com/intl/en_us/badges,
 * 646 × 250). Its black shape is the middle 168px of that height, so at 86px
 * tall it stands as tall as the App Store badge (58px); the negative margins
 * take back Google's transparent clear space so the two line up and the gap
 * between them reads true.
 */
export function StoreBadges({ game, className }: StoreBadgesProps) {
  const stores = liveStores(game);
  if (stores.length === 0) return null;
  return (
    <div
      className={["flex flex-wrap gap-3", className].filter(Boolean).join(" ")}
    >
      {stores.map((store) =>
        store.kind === "app-store" ? (
          <a
            key={store.kind}
            href={store.url}
            target="_blank"
            rel="noopener noreferrer"
            // Starts with the words on the badge, so someone who speaks what
            // they see ("click Download on the App Store") hits it, then says
            // which game and that it leaves the site.
            aria-label={`Download on the App Store: ${game.name} (opens in a new tab)`}
            className="inline-flex items-center gap-2.5 rounded-xl bg-black px-4 py-2.5 text-white ring-1 ring-white/20 transition-colors hover:bg-zinc-900"
          >
            <AppleIcon className="h-7 w-7" />
            <span className="flex flex-col leading-none">
              <span className="text-[0.625rem] font-medium tracking-wide">
                Download on the
              </span>{" "}
              <span className="mt-0.5 text-xl font-semibold tracking-tight">
                App Store
              </span>
            </span>
          </a>
        ) : (
          <a
            key={store.kind}
            href={store.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Get it on Google Play: ${game.name} (opens in a new tab)`}
            className="inline-flex rounded-xl"
          >
            {/* No pointer events, so the whole badge shows the link's hand
                cursor rather than Safari's Live Text cursor over the words. */}
            <img
              src="/img/google-play-badge.png"
              alt=""
              width={222}
              height={86}
              draggable={false}
              className="pointer-events-none -mx-[13px] -my-[14px] h-[86px] w-auto max-w-none select-none"
            />
          </a>
        ),
      )}
    </div>
  );
}
