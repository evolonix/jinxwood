import { AppLink } from "../../../_components/app-link";
import { APP } from "../_lib/content";
import { route } from "../_lib/routes";

/** The id the phone's download bar watches, to get out of the way of the footers. */
export const GAME_FOOTER_ID = "pinochle-footer";

/**
 * The game's own closing band, above the site footer on every Pinochle page:
 * what the game promises, and its rules, support and policy pages.
 */
export function GameFooter() {
  return (
    <aside
      id={GAME_FOOTER_ID}
      aria-label={`About ${APP.shortName}`}
      className="border-night-line bg-night-deep border-t"
    >
      <div className="px-safe-lg mx-auto flex max-w-6xl flex-col gap-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-parchment-muted flex flex-col gap-1">
          <p>
            {APP.name}. No ads &middot; no tracking &middot; nothing collected.
          </p>
          <p className="text-xs">
            Pinochle is a trick-taking card game — no wagering, no stakes.
          </p>
        </div>
        <nav
          aria-label={`${APP.shortName} pages`}
          className="flex flex-wrap items-center gap-x-6 gap-y-3"
        >
          <AppLink to={route("/how-to-play")}>How to Play</AppLink>
          <AppLink to={route("/support")}>Support</AppLink>
          <AppLink to={route("/privacy")}>Privacy</AppLink>
          <AppLink to={route("/terms")}>Terms</AppLink>
        </nav>
      </div>
    </aside>
  );
}
