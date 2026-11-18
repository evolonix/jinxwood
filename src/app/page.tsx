import { Button } from "./_components/button";
import { Eyebrow } from "./_components/eyebrow";
import { GameCard } from "./_components/game-card";
import { Hero } from "./_components/hero";
import { Logo } from "./_components/logo";
import { Section } from "./_components/section";
import { GAMES, STUDIO } from "./_lib/content";
import { SITE_URL, SOCIAL_IMAGE } from "./_lib/seo";
import { usePageMeta } from "./_lib/use-page-meta";

const ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: STUDIO.name,
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/icon-512.png`,
  image: SOCIAL_IMAGE,
  email: STUDIO.email,
  parentOrganization: { "@type": "Organization", name: STUDIO.owner },
};

export default function Home() {
  usePageMeta("/", { jsonLd: [ORGANIZATION] });
  const featured = GAMES.filter((game) => game.status === "released");
  return (
    <>
      <Hero />

      <Section
        id="games"
        eyebrow="Now playing"
        title={featured.length === 1 ? "Our first game" : "Our games"}
        description="Classic games, made with care, on the devices you already own."
      >
        <div className="grid gap-8">
          {featured.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </Section>

      <section id="studio" className="border-night-line bg-night-deep border-y">
        <div className="px-safe-lg mx-auto grid max-w-6xl items-center gap-10 py-16 sm:py-20 md:grid-cols-[auto_1fr] md:gap-16">
          <Logo
            name="emblem"
            sizes="(max-width: 48rem) 11rem, 18rem"
            alt="The Jinxwood emblem: a black cat sitting in the hollow of a tree, its tail curling into the letter J."
            className="mx-auto h-auto w-44 md:w-72"
          />
          <div>
            <Eyebrow className="mb-3">The studio</Eyebrow>
            <h2 className="text-3xl sm:text-4xl">A lucky kind of jinx</h2>
            <div className="text-parchment-muted mt-6 max-w-2xl space-y-4 text-lg">
              {STUDIO.story.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contact">
        <div className="px-safe-lg mx-auto flex max-w-3xl flex-col items-center py-16 text-center sm:py-24">
          <Eyebrow className="mb-3">Say hello</Eyebrow>
          <h2 className="text-3xl sm:text-4xl">
            We&apos;d like to hear from you
          </h2>
          <p className="text-parchment-muted mt-4 max-w-xl text-lg">
            Questions, press, or a kind word about a game: it all reaches a
            person, and we read every message.
          </p>
          <Button href={`mailto:${STUDIO.email}`} size="lg" className="mt-8">
            {STUDIO.email}
          </Button>
        </div>
      </section>
    </>
  );
}
