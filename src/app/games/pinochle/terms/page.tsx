import { AppLink } from "../../../_components/app-link";
import { Clause } from "../../../_components/clause";
import { Eyebrow } from "../../../_components/eyebrow";
import { PRIVACY, SUPPORT, TERMS } from "../_lib/content";
import { usePageMeta } from "../../../_lib/use-page-meta";
import { route } from "../_lib/routes";

/**
 * The game's terms of use of record, as its privacy page is the policy of record:
 * the prose here is the published text. Keep edits deliberate and bump
 * TERMS.updated in _lib/content.ts whenever it changes.
 */
export default function Terms() {
  usePageMeta(route("/terms"));
  return (
    <div className="px-safe-lg mx-auto max-w-3xl py-12 sm:py-16">
      <Eyebrow className="mb-3">Legal</Eyebrow>
      <h1 className="text-4xl sm:text-5xl">Pinochle Terms of Use</h1>
      <p className="mt-3 text-sm text-parchment-muted">
        Last updated: {TERMS.updated}
      </p>
      <p className="mt-8 text-lg">
        These terms cover Pinochle: Two-Handed (&ldquo;the app&rdquo;), a card
        game developed by Evolonix LLC and published under its Jinxwood brand
        (&ldquo;the developer&rdquo;). By downloading or playing the app, you
        agree to them.
      </p>

      <Clause heading="Your license">
        <p>
          The app is licensed to you, not sold. If you got it from Apple&apos;s
          App Store, your use is governed by{" "}
          <AppLink href={TERMS.appleEulaUrl}>
            Apple&apos;s Licensed Application End User License Agreement
          </AppLink>
          ; if you got it from Google Play, by the{" "}
          <AppLink href={TERMS.googlePlayTermsUrl}>
            Google Play Terms of Service
          </AppLink>
          . These terms add to those agreements, and where they disagree, the
          store&apos;s agreement wins.
        </p>
      </Clause>

      <Clause heading="Free trial and purchase">
        <p>
          The full game is free to play for 14 days from the first time you
          choose a game. After that, a one-time in-app purchase unlocks it for
          good. There is no subscription. A match you had already started can
          always be finished, and the Daily Deal stays free either way.
        </p>
        <p>
          Purchases are made and processed by Apple or Google; the developer
          never sees your payment details. Refunds are handled by the store
          under its own policies. On a new device, Restore Purchases brings an
          earlier purchase back when you sign in with the same store account.
        </p>
      </Clause>

      <Clause heading="Online play, leaderboards, and achievements">
        <p>
          Online matches, SharePlay, leaderboards, and achievements are provided
          by Apple&apos;s Game Center and Google Play Games, under their own
          terms. The developer doesn&apos;t run these services and can&apos;t
          promise they&apos;ll always be available. Please play fairly and treat
          other players with respect.
        </p>
      </Clause>

      <Clause heading="Just a game">
        <p>
          Pinochle is played for fun. There is no wagering, and nothing in the
          app (points, medals, streaks, or rewards) has any cash value or can be
          exchanged for anything.
        </p>
      </Clause>

      <Clause heading="Fair use">
        <p>
          Please don&apos;t copy, modify, or redistribute the app, try to
          extract its source code, or use it in a way that breaks the law or
          interferes with other players or the services the app relies on.
        </p>
      </Clause>

      <Clause heading="Ownership">
        <p>
          The app, including its design, artwork, sounds, and code, belongs to
          the developer. The game of pinochle itself belongs to everyone.
        </p>
      </Clause>

      <Clause heading="Your privacy">
        <p>
          The app collects nothing about you. The{" "}
          <AppLink to={route("/privacy")}>privacy policy</AppLink> explains what
          is stored where, and how to delete it.
        </p>
      </Clause>

      <Clause heading="No warranty">
        <p>
          The app is provided &ldquo;as is&rdquo;. The developer works to keep
          it running well but doesn&apos;t guarantee that it will be free of
          errors or always available. To the extent the law allows, the
          developer isn&apos;t liable for any loss arising from your use of the
          app, and in any case not for more than you paid for it.
        </p>
      </Clause>

      <Clause heading="Changes">
        <p>
          The app may be updated, changed, or retired over time. If these terms
          change, the new version will be posted at this URL with a new date;
          continuing to play after that means you accept it.
        </p>
      </Clause>

      <Clause heading="Contact">
        <p>
          Questions about these terms? Email{" "}
          <AppLink href={`mailto:${SUPPORT.email}`}>{SUPPORT.email}</AppLink>.
          For privacy questions, email{" "}
          <AppLink href={`mailto:${PRIVACY.contactEmail}`}>
            {PRIVACY.contactEmail}
          </AppLink>
          . For help with the app itself, use the{" "}
          <AppLink to={route("/support")}>support page</AppLink>.
        </p>
      </Clause>
    </div>
  );
}
