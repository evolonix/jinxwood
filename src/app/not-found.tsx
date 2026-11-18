import { useLocation } from "react-router";
import { Button } from "./_components/button";
import { Eyebrow } from "./_components/eyebrow";
import { PeekingEyes } from "./_components/peeking-eyes";
import { NOT_FOUND_SEO } from "./_lib/seo";
import { usePageMeta } from "./_lib/use-page-meta";

export default function NotFound() {
  // A 404 can land on any path, so it carries its own metadata rather than a
  // PAGES lookup — and marks itself noindex, since GitHub Pages answers unknown
  // URLs with 404.html and the SPA fallback, not with a 404 status.
  const { pathname } = useLocation();
  usePageMeta(pathname, { seo: NOT_FOUND_SEO });
  return (
    <div className="px-safe-lg mx-auto flex max-w-2xl flex-col items-start gap-6 py-24">
      <PeekingEyes className="h-20 w-auto" />
      <Eyebrow>404</Eyebrow>
      <h1 className="text-4xl sm:text-5xl">
        You&apos;ve wandered off the path
      </h1>
      <p className="text-parchment-muted text-lg">
        There&apos;s nothing here but trees and a pair of eyes. The link may be
        broken, or the page may have moved.
      </p>
      <Button to="/">Back to the clearing</Button>
    </div>
  );
}
