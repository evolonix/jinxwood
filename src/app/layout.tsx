import { RouteTreeDevtools } from "@evolonix/react-router-next-devtools/vite-client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import { Footer } from "./_components/footer";
import { Header } from "./_components/header";

export default function RootLayout() {
  return (
    <>
      <a
        href="#main-content"
        className="focus:bg-ember focus:text-night sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>
      <div className="flex min-h-full flex-col">
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          <Outlet />
        </main>
        <Footer />
      </div>
      {/* Before <ScrollRestoration />, so its effect runs first and the
          scroll that follows is the instant kind. */}
      <InstantPageScroll />
      <ScrollRestoration />
      {/* After the pages in the tree, so its effect runs once the new page
          has set its title. */}
      <RouteAnnouncer />
      {import.meta.env.DEV && <RouteTreeDevtools />}
    </>
  );
}

/**
 * Makes a move to another page land in place at once. The stylesheet scrolls
 * smoothly so that anchors within a page glide to their section, but that
 * would also make every page change start wherever the last page was left and
 * slide to the top (or, going back, to the saved position). Smooth scrolling
 * is switched off for the frame in which the path changes, which is when
 * <ScrollRestoration /> moves the page, and comes back for anchors after it.
 */
function InstantPageScroll() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.scrollBehavior = "auto";
    // Reading the style back makes the browser apply it now. Chrome skips
    // that step for a scroll to the very top, and would otherwise glide there
    // on the old value.
    void getComputedStyle(root).scrollBehavior;
    const frame = requestAnimationFrame(() => {
      root.style.scrollBehavior = "";
    });
    return () => {
      cancelAnimationFrame(frame);
      root.style.scrollBehavior = "";
    };
  }, [pathname]);

  return null;
}

/**
 * Tells a screen reader that the page changed. A link inside the site swaps
 * the content without a page load, which is silent on its own, so each move to
 * a new path reads out the new page's title and puts keyboard focus on the
 * main content, as a fresh page load would start there. A move to an anchor
 * (a path with a #) leaves focus alone: the reader is going to that section,
 * not to the top.
 */
function RouteAnnouncer() {
  const { pathname, hash } = useLocation();
  const region = useRef<HTMLParagraphElement>(null);
  const firstLoad = useRef(true);

  useEffect(() => {
    // The first page was announced by the browser when it loaded.
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    if (region.current) region.current.textContent = document.title;
    if (!hash) {
      document.getElementById("main-content")?.focus({ preventScroll: true });
    }
    // Only a change of path is a new page; a new anchor on the same one is
    // not, so `hash` is read but deliberately not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <p ref={region} aria-live="polite" aria-atomic="true" className="sr-only" />
  );
}
