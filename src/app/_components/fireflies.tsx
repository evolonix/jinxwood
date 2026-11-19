import type { CSSProperties } from "react";

// Fixed positions rather than random ones, so the server-stamped HTML, the
// first render and every later render all agree. Placed over the darker parts
// of the forest art, where a small amber light reads best.
const FIREFLIES = [
  { left: "8%", top: "62%", size: 5, duration: 9, delay: 0, x: 18, y: -26 },
  {
    left: "17%",
    top: "38%",
    size: 4,
    duration: 11,
    delay: 2.5,
    x: -14,
    y: -18,
  },
  { left: "27%", top: "74%", size: 6, duration: 8, delay: 1.2, x: 22, y: -14 },
  { left: "36%", top: "52%", size: 4, duration: 12, delay: 4, x: -10, y: -30 },
  { left: "47%", top: "83%", size: 5, duration: 10, delay: 0.6, x: 16, y: -20 },
  { left: "58%", top: "66%", size: 4, duration: 9, delay: 3.3, x: -20, y: -12 },
  { left: "68%", top: "78%", size: 6, duration: 11, delay: 1.8, x: 12, y: -28 },
  { left: "79%", top: "58%", size: 4, duration: 8, delay: 5, x: -16, y: -22 },
  { left: "88%", top: "72%", size: 5, duration: 12, delay: 2, x: 10, y: -16 },
  { left: "93%", top: "44%", size: 4, duration: 10, delay: 6, x: -12, y: -24 },
];

/**
 * A few amber lights drifting over the hero. Hidden under reduced motion, and
 * left out altogether while the visitor has the hero's animation paused.
 */
export function Fireflies() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {FIREFLIES.map((f) => (
        <span
          key={`${f.left}-${f.top}`}
          className="animate-firefly bg-ember-bright absolute rounded-full opacity-0 shadow-[0_0_12px_4px_rgb(242_169_59/0.55)]"
          style={
            {
              left: f.left,
              top: f.top,
              width: f.size,
              height: f.size,
              animationDelay: `${f.delay}s`,
              "--firefly-duration": `${f.duration}s`,
              "--firefly-x": `${f.x}px`,
              "--firefly-y": `${f.y}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
