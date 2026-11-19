import { useEffect, useState } from "react";
import { APP, HERO } from "../_lib/content";
import { GAME_FOOTER_ID } from "./game-footer";
import { StoreBadges } from "./store-badges";

/**
 * Phones only: once the hero's own badge has scrolled away, a slim bar keeps the
 * download one tap away for the rest of a long page. It watches the element with
 * id `watchId` (the hero) and stays hidden while that is on screen. It also
 * steps aside once the footers arrive, so it never covers their links.
 */
export function StickyGetBar({ watchId }: { watchId: string }) {
  const [pastHero, setPastHero] = useState(false);
  const [atFooter, setAtFooter] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(watchId);
    const footer = document.getElementById(GAME_FOOTER_ID);
    if (!hero || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) setPastHero(!entry.isIntersecting);
        // On screen, or already scrolled past: either way the page is ending.
        else
          setAtFooter(entry.isIntersecting || entry.boundingClientRect.top < 0);
      }
    });
    observer.observe(hero);
    if (footer) observer.observe(footer);
    return () => observer.disconnect();
  }, [watchId]);

  const show = pastHero && !atFooter;

  return (
    <div
      aria-hidden={!show}
      inert={!show}
      className={[
        "border-night-line bg-night-deep/90 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur transition-transform duration-300 md:hidden",
        show ? "translate-y-0" : "pointer-events-none translate-y-full",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{APP.shortName}</p>
          <p className="text-parchment-muted truncate text-xs">
            {HERO.trust[0]}
          </p>
        </div>
        <StoreBadges single className="flex-none origin-right scale-90" />
      </div>
    </div>
  );
}
