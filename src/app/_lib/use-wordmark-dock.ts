import { useEffect, useState } from "react";

/**
 * Where the home page's wordmark is.
 *
 *   rest    in the hero, at its full size; the header shows no wordmark
 *   moving  on its way from the hero into the header, following the scroll
 *   docked  in the header, at the size it has on every other page
 */
export type DockPhase = "rest" | "moving" | "docked";

/** Marks the hero's wordmark, and hides it while the header's copy stands in. */
const HERO = "[data-hero-wordmark]";
const AWAY = "data-wordmark-away";
/** In the header: the wordmark's place, and the element in it that moves. */
const SLOT = "[data-wordmark-slot]";
const MARK = "[data-wordmark-mark]";
/** On the header: how far the move has come, from 0 to 1, for its bar. */
const PROGRESS = "--dock";

/**
 * Carries the home hero's wordmark into the header as the page scrolls.
 *
 * Nothing changes until the header's lower edge meets the hero's wordmark.
 * From there the header's own wordmark takes over: it starts exactly over the
 * hero's, which is hidden at that moment, and shrinks into its place in the
 * header over the next stretch of scrolling (the wordmark's own height, so it
 * is docked by the time the hero's would have slid out of sight). The header
 * fades its bar in over the same stretch, from the `--dock` property this
 * sets on it. Scrolling back reverses it all.
 *
 * The position, `--dock` and whether the header's wordmark shows are written
 * straight to the elements' styles on each frame; React only hears about a
 * change of phase, for what can wait a frame. Under reduced motion
 * nothing travels or fades: the hero's wordmark scrolls away, and the bar and
 * the header's wordmark appear together once it has gone.
 *
 * The header marks the wordmark's place with `data-wordmark-slot` and, inside
 * it, the element to move with `data-wordmark-mark`, which must have its
 * transform origin at the top left.
 *
 * @param active  Only the home page has a hero wordmark to dock.
 */
export function useWordmarkDock(active: boolean): DockPhase {
  const [phase, setPhase] = useState<DockPhase>("rest");

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(HERO);
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    const slotEl = header?.querySelector<HTMLElement>(SLOT);
    const markEl = header?.querySelector<HTMLElement>(MARK);
    if (!active || !hero || !header || !slotEl || !markEl) return;

    const root = document.documentElement;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Scroll positions where the move starts and how far it runs, and the
    // wordmark's box at each end, in viewport pixels.
    let start = 0;
    let span = 1;
    let from = { left: 0, top: 0, width: 1 };
    let to = { left: 0, top: 0, width: 1 };
    let frame = 0;

    // Runs on every frame that is drawn, not once: the hero's content is
    // centered in its section, so its wordmark shifts when a font arrives or
    // the copy rewraps, and neither of those resizes anything observable.
    const measure = () => {
      // Neither the hero's wordmark nor the slot is ever transformed, so
      // their boxes are their resting places.
      const h = hero.getBoundingClientRect();
      const s = slotEl.getBoundingClientRect();
      const barBottom = header.getBoundingClientRect().bottom;
      start = Math.max(0, h.top + window.scrollY - barBottom);
      span = Math.max(h.height, 64);
      from = {
        left: h.left,
        top: h.top + window.scrollY - start,
        width: h.width,
      };
      to = { left: s.left, top: s.top, width: markEl.offsetWidth || 1 };
    };

    const apply = () => {
      frame = 0;
      measure();
      let p = Math.min(1, Math.max(0, (window.scrollY - start) / span));
      if (still.matches) p = p < 1 ? 0 : 1;
      const now: DockPhase = p >= 1 ? "docked" : p > 0 ? "moving" : "rest";

      header.style.setProperty(PROGRESS, String(p));
      if (now === "moving") {
        // It shrinks a little ahead of its climb, so on a phone it is already
        // narrow when it comes level with the links beside it.
        const size = 1 - (1 - p) ** 2.5;
        const scale =
          from.width / to.width + (1 - from.width / to.width) * size;
        const dx = (from.left - to.left) * (1 - p);
        const dy = (from.top - to.top) * (1 - p);
        markEl.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
      } else {
        markEl.style.transform = "";
      }
      // The hero's wordmark steps aside for as long as the header's stands in
      // for it. The header's is shown and hidden here, in the same frame:
      // React draws a change of phase a frame late, and for that frame both
      // wordmarks would show, or neither.
      root.toggleAttribute(AWAY, now !== "rest");
      slotEl.style.visibility = now === "rest" ? "hidden" : "visible";
      setPhase(now);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", apply);
    still.addEventListener("change", apply);
    // A page restored part-way down should settle without waiting for a
    // scroll: redraw when the wordmark's image or the fonts arrive.
    const sized = new ResizeObserver(apply);
    sized.observe(hero);
    let live = true;
    void document.fonts.ready.then(() => {
      if (live) apply();
    });

    return () => {
      live = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", apply);
      still.removeEventListener("change", apply);
      sized.disconnect();
      markEl.style.transform = "";
      slotEl.style.visibility = "";
      header.style.removeProperty(PROGRESS);
      root.removeAttribute(AWAY);
      setPhase("rest");
    };
  }, [active]);

  return active ? phase : "rest";
}
