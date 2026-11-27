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

        {/* No titles are named until they are real. The tile is a card:
            a parchment face set in a plum back, which Jinx's paws grip and
            which hides the rest of the eyes behind it. */}
        <PeekingEyes>
          <div className="rounded-[2rem] bg-linear-to-b from-[#5b2d6e] to-[#3a1a49] p-3 shadow-[0_0_0_1px_rgb(242_169_59/0.35),0_24px_48px_-24px_rgb(0_0_0/0.7)] sm:p-4">
            <div className="border-ember/70 bg-parchment flex flex-col items-center gap-4 rounded-[1.375rem] border-2 px-6 py-12 text-center">
              <h2 className="text-2xl text-[#2e1e37]">
                More from the wood soon
              </h2>
              <p className="max-w-md text-[#5b4868]">
                Something is stirring in the trees. When it is ready to come
                out, it will be here.
              </p>
            </div>
          </div>
        </PeekingEyes>
      </div>
    </div>
  );
}
