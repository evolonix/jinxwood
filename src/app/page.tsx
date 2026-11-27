import { Button } from "./_components/button";
import { Eyebrow } from "./_components/eyebrow";
import { GameCard } from "./_components/game-card";
import { Hero } from "./_components/hero";
import { Section } from "./_components/section";
import { VideoFrame } from "./_components/video-frame";
import { BRAND_VIDEO, GAMES, STUDIO } from "./_lib/content";
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
  // With one game out, the heading and the line under it talk about that
  // game; they turn plural by themselves when a second one is released.
  const single = featured.length === 1;
  return (
    <>
      <Hero />

      <Section
        id="games"
        eyebrow="Now playing"
        title={single ? "Our first game" : "Our games"}
        description={
          single
            ? "A classic game, made with care, on the devices you already own."
            : "Classic games, made with care, on the devices you already own."
        }
      >
        <div className="grid gap-8">
          {featured.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </Section>

      <section id="studio" className="border-night-line bg-night-deep border-y">
        <div className="px-safe-lg mx-auto grid max-w-6xl items-center gap-10 py-16 sm:py-20 md:grid-cols-2 md:gap-12 lg:gap-16">
          {/* The brand video tells the emblem's story: Jinx walks through
              the forest, over the bridge and into the hollow of the tree,
              and ends as the emblem. It waits for a press of play. */}
          <figure>
            <VideoFrame
              src={BRAND_VIDEO.src}
              smaller={BRAND_VIDEO.smaller}
              poster={BRAND_VIDEO.poster}
              label={BRAND_VIDEO.label}
              ambient={false}
            />
            <figcaption className="text-parchment-muted mt-3 text-center text-sm">
              {BRAND_VIDEO.title} · {BRAND_VIDEO.length}
            </figcaption>
          </figure>
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
            Questions, press requests, and kind words about a game are all
            welcome. A person reads every message.
          </p>
          <Button href={`mailto:${STUDIO.email}`} size="lg" className="mt-8">
            {STUDIO.email}
          </Button>
        </div>
      </section>
    </>
  );
}
