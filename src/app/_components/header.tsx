import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { STUDIO } from "../_lib/content";
import { useScrolled } from "../_lib/use-scrolled";
import { useWordmarkDock } from "../_lib/use-wordmark-dock";
import { Button } from "./button";
import { Logo, TrademarkSymbol } from "./logo";

/**
 * Sticky site header. Transparent at the top of a page, so the home hero shows
 * through it, and solid night once the page has scrolled. Three links fit on
 * a phone, so there is no menu to open. At 320px wide, which is also a desktop
 * window zoomed to 400%, only two fit: "Say hello" steps aside there, and the
 * same address is in the footer of every page.
 *
 * The home page is the exception on both counts. Its hero shows the wordmark
 * large, so the header carries none at first, and its bar stays clear until
 * the scroll reaches that wordmark. From there the wordmark travels up into
 * the header and the bar fades in behind it, both following the scroll (see
 * useWordmarkDock).
 */
export function Header() {
  const scrolled = useScrolled();
  const { pathname } = useLocation();
  // GitHub Pages redirects a route's bare path to its trailing-slash form, so
  // normalize before comparing.
  const path = pathname.replace(/\/+$/, "") || "/";
  const home = path === "/";
  const dock = useWordmarkDock(home);
  const hideLogo = home && dock === "rest";

  return (
    // Nearly opaque once scrolled: whatever passes underneath shows through
    // the rest, and a bright screenshot under a more see-through bar pulls the
    // highlighted link below 4.5:1.
    <header
      data-site-header
      className={`pt-safe sticky top-0 z-40 border-b ${
        home
          ? "header-docking"
          : `transition-colors duration-300 ${
              scrolled
                ? "border-night-line bg-night/95 backdrop-blur"
                : "border-transparent"
            }`
      }`}
    >
      <div className="px-safe-lg mx-auto flex h-(--header-h) max-w-6xl items-center gap-2 sm:gap-3">
        {/* No fade on the wordmark: on the home page it has to appear in the
            same instant the hero's copy disappears. The class hides it until
            useWordmarkDock is running; from then the hook shows and hides it
            itself, frame by frame. */}
        <Link
          data-wordmark-slot
          to="/"
          viewTransition
          aria-label={`${STUDIO.name} home`}
          aria-hidden={hideLogo || undefined}
          tabIndex={hideLogo ? -1 : undefined}
          className={`shrink-0 ${hideLogo ? "pointer-events-none invisible" : ""}`}
        >
          <span
            data-wordmark-mark
            className={`relative block origin-top-left ${
              dock === "moving" ? "will-change-transform" : ""
            }`}
          >
            {/* On the home page it starts at the hero's size, so it asks for
                the file the hero already loaded. */}
            <Logo
              name="wordmark"
              sizes={home ? "(max-width: 30rem) 76vw, 22rem" : "7rem"}
              alt=""
              className="h-9 w-auto sm:h-11"
            />
            <TrademarkSymbol name="wordmark" />
          </span>
        </Link>
        <nav
          aria-label="Primary"
          className="ml-auto flex items-center gap-1 sm:gap-2"
        >
          <NavItem to="/games" current={path.startsWith("/games")}>
            Games
          </NavItem>
          <NavItem to="/press" current={path === "/press"}>
            Press
          </NavItem>
          <Button
            href={`mailto:${STUDIO.email}`}
            variant="outline"
            size="sm"
            className="bg-night/40 ml-1 backdrop-blur-sm max-sm:px-3 max-[22.4rem]:hidden"
          >
            Say hello
          </Button>
        </nav>
      </div>
    </header>
  );
}

function NavItem({
  to,
  current,
  children,
}: {
  to: string;
  current: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      viewTransition
      aria-current={current ? "page" : undefined}
      className={`rounded-full px-2.5 py-2 text-sm font-semibold transition-colors sm:px-3 ${
        current
          ? "bg-parchment/10 text-ember"
          : "text-parchment hover:text-ember"
      }`}
    >
      {children}
    </Link>
  );
}
