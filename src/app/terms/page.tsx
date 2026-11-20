import { AppLink } from "../_components/app-link";
import { Clause } from "../_components/clause";
import { Eyebrow } from "../_components/eyebrow";
import { GAMES, STUDIO, TERMS } from "../_lib/content";
import { usePageMeta } from "../_lib/use-page-meta";

/**
 * The terms for this website only. Each game publishes its own terms on its
 * own pages, linked from here. Bump TERMS.updated in _lib/content.ts whenever
 * the text changes.
 */
export default function Terms() {
  usePageMeta("/terms");
  // Google asks for its credit line wherever its badge is shown.
  const onGooglePlay = GAMES.some((game) =>
    game.stores.some((store) => store.kind === "google-play" && store.live),
  );
  return (
    <div className="px-safe-lg mx-auto max-w-3xl py-12 sm:py-16">
      <Eyebrow className="mb-3">Legal</Eyebrow>
      <h1 className="text-4xl sm:text-5xl">Terms</h1>
      <p className="text-parchment-muted mt-3 text-sm">
        Last updated: {TERMS.updated}
      </p>
      <p className="mt-8 text-lg">
        These are the terms for using {STUDIO.url.replace("https://", "")}, the
        website of {STUDIO.name}. {STUDIO.legalLine} They cover this website
        only. By using the site you agree to them.
      </p>

      <Clause heading="Using this site">
        <p>
          You are welcome to browse the site, link to it and share it. Please do
          not use it in a way that harms the site or other people&apos;s use of
          it.
        </p>
      </Clause>

      <Clause heading="Ownership">
        <p>
          The {STUDIO.name} name, logo, artwork and the text on this site belong
          to {STUDIO.owner}. You may use the materials on the{" "}
          <AppLink to="/press">press page</AppLink> to write about or report on
          the studio and its games. Any other use needs our permission first.
        </p>
        <p>
          Apple, iPhone, iPad, Mac, and Apple TV are trademarks of Apple Inc.
          App Store is a service mark of Apple Inc.
          {onGooglePlay &&
            " Google Play and the Google Play logo are trademarks of Google LLC."}{" "}
          Other names and marks belong to their owners.
        </p>
      </Clause>

      <Clause heading="Our games">
        <p>
          Our games are separate products. Each has its own terms of use, and
          the store you get it from has terms of its own:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          {GAMES.map((game) => (
            <li key={game.slug}>
              <AppLink to={game.links.terms}>{game.name} terms of use</AppLink>
            </li>
          ))}
        </ul>
      </Clause>

      <Clause heading="No warranty">
        <p>
          The site is provided as it is. We try to keep it accurate and
          available, but we make no promises that it always will be, and to the
          extent the law allows we are not liable for loss arising from your use
          of it.
        </p>
      </Clause>

      <Clause heading="Links to other sites">
        <p>
          The site links to other websites that we do not control. We are not
          responsible for their content or how they operate.
        </p>
      </Clause>

      <Clause heading="Changes">
        <p>
          If these terms change, the new version will be posted on this page
          with a new date at the top.
        </p>
      </Clause>

      <Clause heading="Contact">
        <p>
          Questions about these terms can be sent to{" "}
          <AppLink href={`mailto:${STUDIO.email}`}>{STUDIO.email}</AppLink>.
        </p>
      </Clause>
    </div>
  );
}
