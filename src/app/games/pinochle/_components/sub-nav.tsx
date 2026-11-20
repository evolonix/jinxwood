import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { asset } from "../_lib/asset";
import { APP } from "../_lib/content";
import { PINOCHLE_BASE, route } from "../_lib/routes";
import { useActiveSection } from "../_lib/use-active-section";

// The game's own navigation, under the site header on every Pinochle page.
// Most items are sections of the game's home page. The full rules are a route
// of their own, the page search traffic lands on, so "How to Play" links there
// while its `hash` ties it to the home page's rules band: scrolling past that
// band lights it too.
const ITEMS: { hash?: string; to?: string; label: string }[] = [
  { hash: "#features", label: "Features" },
  { hash: "#screenshots", label: "Screenshots" },
  { hash: "#faq", label: "FAQ" },
  { hash: "#how-to-play", to: "/how-to-play", label: "How to Play" },
  { hash: "#achievements", label: "Achievements" },
  { to: "/support", label: "Support" },
];

// Sections tracked for the in-view highlight, in document order.
const TRACKED = ITEMS.map((item) => item.hash).filter(
  (hash): hash is string => hash !== undefined,
);

export function SubNav() {
  const { pathname } = useLocation();
  // GitHub Pages redirects a route's bare path to its trailing-slash form, so
  // normalize before comparing.
  const path = pathname.replace(/\/+$/, "");
  const onHome = path === PINOCHLE_BASE;
  // Other Pinochle pages have their own anchors (the rules page has an #faq
  // too), so only the home page's sections light these items.
  const active = useActiveSection(onHome ? TRACKED : []);

  return (
    // Sticks under the site header from tablet width up. On a phone the two
    // bars together would take too much of the screen, so this one scrolls
    // away. index.css reads data-subnav to keep anchors clear of both bars.
    // Nearly opaque, for the same reason the header is: what scrolls under a
    // more see-through bar can pull the highlighted item below 4.5:1.
    // The 1px is the header's bottom border, which is part of its height:
    // without it the bar would sit a pixel lower at the top of the page than
    // it does once it sticks.
    <div
      data-subnav
      className="border-night-line bg-night/95 z-30 border-b backdrop-blur sm:sticky sm:top-[calc(var(--header-h)+env(safe-area-inset-top)+1px)]"
    >
      <div className="px-safe-lg mx-auto flex max-w-6xl flex-col gap-1 py-2 sm:h-(--subnav-h) sm:flex-row sm:items-center sm:gap-4 sm:py-0">
        <SectionLink
          hash="#top"
          onHome={onHome}
          className="flex shrink-0 items-center gap-2"
        >
          <img
            src={asset("img/app-icon.webp")}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-[0.4rem] ring-1 ring-white/10"
          />
          <span className="font-display text-lg font-semibold">
            {APP.shortName}
          </span>
        </SectionLink>

        {/* Six items do not fit across a phone, so there they wrap onto a
            second row under the game's name. Nothing scrolls sideways: at
            320px wide (a 400% zoom) every item is still on screen. */}
        <nav
          aria-label={APP.shortName}
          className="-mx-3 flex flex-wrap items-center gap-x-1 sm:mx-0 sm:-mr-2 sm:ml-auto sm:flex-nowrap"
        >
          {ITEMS.map((item) => {
            // "page" when the item's own route is the one being viewed, "true"
            // when its section is in view: a section of this page is not the
            // same claim as being on that page, and assistive tech is told
            // which.
            const current =
              item.to && path === route(item.to)
                ? ("page" as const)
                : item.hash && item.hash === active
                  ? ("true" as const)
                  : undefined;
            const className = `shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              current
                ? "bg-parchment/10 text-ember"
                : "text-parchment-muted hover:text-ember"
            }`;
            return item.to ? (
              <Link
                key={item.label}
                to={route(item.to)}
                viewTransition
                aria-current={current}
                className={className}
              >
                {item.label}
              </Link>
            ) : (
              <SectionLink
                key={item.label}
                hash={item.hash!}
                onHome={onHome}
                ariaCurrent={current === "true" ? "true" : undefined}
                className={className}
              >
                {item.label}
              </SectionLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

interface SectionLinkProps {
  /** An anchor on the game's home page, e.g. "#features". */
  hash: string;
  onHome: boolean;
  className?: string;
  ariaCurrent?: "true";
  children: ReactNode;
}

/**
 * Link to a section of the game's home page. On that page it is a native
 * anchor, so the browser does the smooth scroll and clears the sticky bars
 * (index.css). From the game's other pages the target has to route home first;
 * <ScrollRestoration /> in the root layout then jumps to the anchor.
 */
function SectionLink({
  hash,
  onHome,
  className,
  ariaCurrent,
  children,
}: SectionLinkProps) {
  if (onHome) {
    return (
      <a href={hash} className={className} aria-current={ariaCurrent}>
        {children}
      </a>
    );
  }
  return (
    <Link
      to={{ pathname: PINOCHLE_BASE, hash }}
      viewTransition
      className={className}
      aria-current={ariaCurrent}
    >
      {children}
    </Link>
  );
}
