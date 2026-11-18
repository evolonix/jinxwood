import { Eyebrow } from "../_components/eyebrow";
import { GameCard } from "../_components/game-card";
import { PeekingEyes } from "../_components/peeking-eyes";
import { GAMES } from "../_lib/content";
import { usePageMeta } from "../_lib/use-page-meta";

export default function Games() {
  usePageMeta("/games");
  return (
    <div className="px-safe-lg mx-auto max-w-6xl py-12 sm:py-16">
      <Eyebrow className="mb-3">Games</Eyebrow>
      <h1 className="text-4xl sm:text-5xl">What we&apos;ve made</h1>
      <p className="text-parchment-muted mt-4 max-w-2xl text-lg">
        Classic games, made with care, on the devices you already own.
      </p>

      <div className="mt-10 grid gap-8">
        {GAMES.map((game) => (
          <GameCard key={game.slug} game={game} as="h2" />
        ))}

        {/* No titles are named until they are real. */}
        <div className="border-night-line flex flex-col items-center gap-4 rounded-3xl border border-dashed px-6 py-12 text-center">
          <PeekingEyes className="h-12 w-auto" />
          <h2 className="text-2xl">More from the wood soon</h2>
          <p className="text-parchment-muted max-w-md">
            Something is stirring in the trees. When it is ready to come out, it
            will be here.
          </p>
        </div>
      </div>
    </div>
  );
}
