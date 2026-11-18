import { IMAGE_SIZES } from "../_lib/brand.gen";
import { STUDIO } from "../_lib/content";
import { ArrowRightIcon } from "./icons";
import { Button } from "./button";
import { Fireflies } from "./fireflies";
import { Logo } from "./logo";

// The sizes scripts/build-brand.mjs writes. index.html preloads the same AVIF
// lists, so keep all three in step.
const LANDSCAPE = [768, 1280, 1920, 2560];
const PORTRAIT = [640, 960, 1280];
/** Phones held upright get the portrait crop. Mirrors the `tall:` variant. */
const TALL = "(max-aspect-ratio: 4/5)";

function srcSet(name: string, widths: number[], ext: "avif" | "webp") {
  return widths.map((w) => `/img/hero/${name}-${w}.${ext} ${w}w`).join(", ");
}

/**
 * The home page's opening: the forest illustration edge to edge, sliding up
 * under the transparent header.
 *
 * The middle of the art (the sunset behind the castle) is its brightest part,
 * where parchment text falls to about 2:1, so nothing is centred on it. On wide
 * screens the words sit in a column at the left over a night scrim; on an
 * upright phone they split, the name and headline over the dark canopy at the
 * top and the buttons over a fade at the bottom, leaving the castle clear. The
 * image box is also taller than the section there, which slides the castle
 * down out from under the headline.
 */
export function Hero() {
  return (
    <section className="tall:min-h-[92svh] relative isolate -mt-(--header-h) flex min-h-[max(36rem,min(100svh,56.25vw))] overflow-hidden">
      <picture>
        <source
          media={TALL}
          type="image/avif"
          srcSet={srcSet("hero-portrait", PORTRAIT, "avif")}
          sizes="100vw"
          width={IMAGE_SIZES.heroPortrait.width}
          height={IMAGE_SIZES.heroPortrait.height}
        />
        <source
          media={TALL}
          type="image/webp"
          srcSet={srcSet("hero-portrait", PORTRAIT, "webp")}
          sizes="100vw"
          width={IMAGE_SIZES.heroPortrait.width}
          height={IMAGE_SIZES.heroPortrait.height}
        />
        <source
          type="image/avif"
          srcSet={srcSet("hero", LANDSCAPE, "avif")}
          sizes="100vw"
        />
        <img
          src="/img/hero/hero-1280.webp"
          srcSet={srcSet("hero", LANDSCAPE, "webp")}
          sizes="100vw"
          width={IMAGE_SIZES.hero.width}
          height={IMAGE_SIZES.hero.height}
          alt="A forest at twilight: a small castle with glowing windows on a hill, and a wooden bridge over a stream."
          fetchPriority="high"
          decoding="async"
          className="tall:bottom-auto tall:h-[120%] absolute inset-0 h-full w-full object-cover object-[62%_50%]"
        />
      </picture>

      {/* Scrims. Top: keeps the header legible. Side (wide) or top and bottom
          (tall): puts the words on night. Bottom: fades the art into the page
          so the image has no hard edge. */}
      <div
        aria-hidden="true"
        className="from-night-deep/80 tall:h-[56%] tall:from-night-deep/95 tall:via-night-deep/75 tall:via-60% absolute inset-x-0 top-0 h-36 bg-linear-to-b to-transparent"
      />
      <div
        aria-hidden="true"
        className="from-night/95 via-night/65 tall:hidden absolute inset-0 bg-linear-to-r via-40% to-transparent to-70%"
      />
      <div
        aria-hidden="true"
        className="from-night tall:h-[52%] tall:via-night/80 absolute inset-x-0 bottom-0 h-44 bg-linear-to-t to-transparent"
      />

      <Fireflies />

      <div className="px-safe-lg tall:justify-between tall:pb-10 relative mx-auto flex w-full max-w-6xl flex-col justify-center gap-6 pt-[calc(var(--header-h)+1.5rem)] pb-20">
        <div className="max-w-xl">
          <Logo
            name="wordmark"
            sizes="(max-width: 30rem) 76vw, 22rem"
            className="tall:w-[min(22rem,58vw)] h-auto w-[min(22rem,76vw)] drop-shadow-[0_4px_24px_rgb(26_18_45/0.6)]"
          />
          <h1 className="mt-6 text-4xl leading-[1.08] [text-shadow:0_2px_20px_rgb(26_18_45/0.75)] sm:text-5xl lg:text-6xl">
            {STUDIO.tagline}
          </h1>
        </div>
        <div className="max-w-xl">
          <p className="text-parchment/90 text-lg [text-shadow:0_1px_12px_rgb(26_18_45/0.8)]">
            {STUDIO.intro}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button to="/games" size="lg">
              See our games
              <ArrowRightIcon />
            </Button>
            <Button
              href={`mailto:${STUDIO.email}`}
              variant="outline"
              size="lg"
              className="bg-night/40 backdrop-blur-sm"
            >
              Say hello
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
