import { AppLink } from "../_components/app-link";
import { Clause } from "../_components/clause";
import { Eyebrow } from "../_components/eyebrow";
import { GAMES, PRIVACY, STUDIO } from "../_lib/content";
import { usePageMeta } from "../_lib/use-page-meta";

/**
 * The privacy policy for this website only. Each game publishes its own policy
 * on its own site, linked from here. The prose is the published policy: keep
 * edits deliberate, keep it true (it promises no third-party requests, so do
 * not add a hosted font, analytics script or embed without changing it), and
 * bump PRIVACY.updated in _lib/content.ts whenever the text changes.
 */
export default function Privacy() {
  usePageMeta("/privacy");
  return (
    <div className="px-safe-lg mx-auto max-w-3xl py-12 sm:py-16">
      <Eyebrow className="mb-3">Legal</Eyebrow>
      <h1 className="text-4xl sm:text-5xl">Privacy</h1>
      <p className="text-parchment-muted mt-3 text-sm">
        Last updated: {PRIVACY.updated}
      </p>
      <p className="mt-8 text-lg">
        This is the privacy policy for {STUDIO.url.replace("https://", "")}, the
        website of {STUDIO.name}. {STUDIO.legalLine} It covers this website
        only. Each of our games has its own policy, listed below.
      </p>

      <Clause heading="What this site collects">
        <p>
          Nothing. The site has no accounts, no forms, no cookies, no analytics
          and no advertising. Its fonts, images and scripts are all served from
          this domain, so loading a page does not contact any third party.
        </p>
      </Clause>

      <Clause heading="Hosting">
        <p>
          The site is hosted on GitHub Pages. Like any web host, GitHub receives
          your IP address and basic details of each request when your browser
          loads a page, and handles them under{" "}
          <AppLink href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
            GitHub&apos;s privacy statement
          </AppLink>
          . We do not receive or have access to that information.
        </p>
      </Clause>

      <Clause heading="Email">
        <p>
          If you write to{" "}
          <AppLink href={`mailto:${STUDIO.email}`}>{STUDIO.email}</AppLink>, we
          receive your email address and whatever you choose to send. We use it
          only to reply to you. We do not add you to a mailing list or share
          your message with anyone else.
        </p>
      </Clause>

      <Clause heading="Our games">
        <p>
          Our games are separate products with their own privacy policies, which
          describe what each game does and does not collect:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          {GAMES.map((game) => (
            <li key={game.slug}>
              <AppLink href={game.links.privacy}>
                {game.name} privacy policy
              </AppLink>
            </li>
          ))}
        </ul>
      </Clause>

      <Clause heading="Links to other sites">
        <p>
          This site links to app stores and to each game&apos;s own website.
          Those sites have their own privacy practices, which this policy does
          not cover.
        </p>
      </Clause>

      <Clause heading="Children">
        <p>
          The site is suitable for all ages. It does not knowingly collect
          personal information from anyone, children included.
        </p>
      </Clause>

      <Clause heading="Changes">
        <p>
          If this policy changes, the new version will be posted on this page
          with a new date at the top.
        </p>
      </Clause>

      <Clause heading="Contact">
        <p>
          Questions about this policy can be sent to{" "}
          <AppLink href={`mailto:${STUDIO.email}`}>{STUDIO.email}</AppLink>.
        </p>
      </Clause>
    </div>
  );
}
