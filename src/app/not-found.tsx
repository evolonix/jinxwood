import { useLocation } from "react-router";
import { Button } from "./_components/button";
import { JinxEyes } from "./_components/jinx-eyes";
import { Sparkle } from "./_components/peeking-eyes";
import { NOT_FOUND_SEO } from "./_lib/seo";
import { usePageMeta } from "./_lib/use-page-meta";

export default function NotFound() {
  // A 404 can land on any path, so it carries its own metadata rather than a
  // PAGES lookup — and marks itself noindex, since GitHub Pages answers unknown
  // URLs with 404.html and the SPA fallback, not with a 404 status.
  const { pathname } = useLocation();
  usePageMeta(pathname, { seo: NOT_FOUND_SEO });
  return (
    <div className="relative isolate overflow-hidden">
      {/* A patch of darkness for the eyes to peer out of: two soft lobes
          behind the eyes and a wider one under them, behind the words. */}
      <div
        aria-hidden="true"
        className="not-found-dark pointer-events-none absolute top-6 left-1/2 -z-10 aspect-[4/3] w-[min(52rem,150vw)] -translate-x-1/2"
      />
      <div className="px-safe-lg mx-auto flex max-w-2xl flex-col items-center gap-5 py-16 text-center sm:py-24">
        <div className="blink-lids w-[min(22rem,76vw)]">
          <JinxEyes sizes="(max-width: 29rem) 76vw, 22rem" />
        </div>
        <p
          className="font-display text-parchment mt-4 flex items-center gap-3 text-6xl font-semibold sm:gap-4 sm:text-7xl"
          aria-label="Error 404"
        >
          <span
            aria-hidden="true"
            className="to-ember/70 h-px w-10 bg-gradient-to-r from-transparent sm:w-16"
          />
          <Sparkle className="w-3.5 shrink-0 sm:w-4" />
          404
          <Sparkle className="w-3.5 shrink-0 sm:w-4" />
          <span
            aria-hidden="true"
            className="from-ember/70 h-px w-10 bg-gradient-to-r to-transparent sm:w-16"
          />
        </p>
        <h1 className="text-3xl sm:text-4xl">
          You&apos;ve wandered off the path
        </h1>
        <p className="text-parchment-muted max-w-md text-lg">
          There&apos;s nothing here but trees and a pair of eyes. The link may
          be broken, or the page may have moved.
        </p>
        <Button to="/" className="mt-2">
          Back to the clearing
        </Button>
      </div>
    </div>
  );
}
