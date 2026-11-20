import { useState } from "react";
import { IMAGE_SIZES } from "../_lib/brand.gen";
import { STUDIO } from "../_lib/content";
import { ArrowRightIcon, PauseIcon, PlayIcon } from "./icons";
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

/** Where the visitor's choice to stop the fireflies is remembered. */
const MOTION_KEY = "jinxwood:hero-motion";

// Storage can be unavailable (private windows, blocked site data); the choice
// then simply lasts for this visit.
function readPaused(): boolean {
  try {
    return localStorage.getItem(MOTION_KEY) === "paused";
  } catch {
    return false;
  }
}

function writePaused(paused: boolean) {
  try {
    if (paused) localStorage.setItem(MOTION_KEY, "paused");
    else localStorage.removeItem(MOTION_KEY);
  } catch {
    // Nothing to do: the state still holds for this visit.
  }
}

/**
 * The home page's opening: the forest illustration edge to edge, sliding up
 * under the transparent header.
 *
 * The middle of the art (the sunset behind the castle) is its brightest part,
 * where parchment text falls to about 2:1, so nothing is centered on it. On wide
 * screens the words sit in a column at the left over a night scrim; on an
 * upright phone they split, the name and headline over the dark canopy at the
 * top and the buttons over a fade at the bottom, leaving the castle clear. The
 * image box is also taller than the section there, which slides the castle
 * down out from under the headline.
 *
 * Every scrim that sits behind words is tied to where the words are, not to a
 * share of the screen, so the text keeps its contrast (4.5:1, or 3:1 for the
 * headline) on a short phone, a square window or a zoomed page, where a
 * percentage would leave it over the sunset.
 *
 * The fireflies drift for as long as the page is open, so there is a button to
 * stop them. It is not shown under reduced motion, where they never start.
 */
export function Hero() {
  const [paused, setPaused] = useState(readPaused);
  const toggleMotion = () => {
    writePaused(!paused);
    setPaused(!paused);
  };
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

      {/* Scrims. Top: keeps the header legible. Side: puts the words on night
          on everything but an upright phone, which gets one scrim behind each
          block of words instead (below). Bottom: fades the art into the page
          so the image has no hard edge. */}
      <div
        aria-hidden="true"
        className="from-night-deep/80 absolute inset-x-0 top-0 h-36 bg-linear-to-b to-transparent"
      />
      <div
        aria-hidden="true"
        className="hero-scrim-side tall:hidden absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="from-night absolute inset-x-0 bottom-0 h-44 bg-linear-to-t to-transparent"
      />

      {!paused && <Fireflies />}

      <button
        type="button"
        onClick={toggleMotion}
        aria-label={paused ? "Play animation" : "Pause animation"}
        className="border-parchment/45 bg-night/60 text-parchment hover:border-parchment hover:bg-night/85 absolute top-[calc(var(--header-h)+0.5rem)] right-[max(1.5rem,env(safe-area-inset-right))] z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-colors motion-reduce:hidden"
      >
        {paused ? <PlayIcon /> : <PauseIcon />}
      </button>

      <div className="px-safe-lg tall:justify-between tall:pb-10 relative mx-auto flex w-full max-w-6xl flex-col justify-center gap-6 pt-[calc(var(--header-h)+1.5rem)] pb-20">
        <div className="relative max-w-xl">
          {/* Upright phone: night from the top of the screen to just under
              the headline, then a fade. Wider than the screen on purpose; the
              section clips it. */}
          <div
            aria-hidden="true"
            className="from-night-deep/95 via-night-deep/80 tall:block absolute -inset-x-[100vw] -top-[100vh] -bottom-20 hidden bg-linear-to-b via-[calc(100%-5rem)] to-transparent"
          />
          <Logo
            name="wordmark"
            sizes="(max-width: 30rem) 76vw, 22rem"
            className="tall:w-[min(22rem,58vw)] relative h-auto w-[min(22rem,76vw)] drop-shadow-[0_4px_24px_rgb(26_18_45/0.6)]"
          />
          <h1 className="relative mt-6 text-4xl leading-[1.08] [text-shadow:0_2px_20px_rgb(26_18_45/0.75)] sm:text-5xl lg:text-6xl">
            {STUDIO.tagline}
          </h1>
        </div>
        <div className="relative max-w-xl">
          {/* Upright phone: the same from the bottom of the screen up to just
              over the introduction. */}
          <div
            aria-hidden="true"
            className="from-night via-night/85 tall:block absolute -inset-x-[100vw] -top-20 -bottom-[100vh] hidden bg-linear-to-t via-[calc(100%-5rem)] to-transparent"
          />
          <p className="text-parchment relative text-lg [text-shadow:0_1px_12px_rgb(26_18_45/0.8)]">
            {STUDIO.intro}
          </p>
          <div className="relative mt-6 flex flex-wrap gap-3">
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
