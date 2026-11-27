import { useId, type ReactNode } from "react";
import { useSeen } from "../_lib/use-seen";
import { JinxEyes } from "./jinx-eyes";

/**
 * Jinx peeking over the top edge of whatever it wraps: the eyes rise from
 * behind the edge when it scrolls into view, blink twice and hold still, and
 * two paws grip the edge on either side. Under reduced motion they are simply
 * there. What it wraps must have an opaque background, which hides the lower
 * part of the eyes, and keeps the space above it for the eyes to show in.
 */
export function PeekingEyes({ children }: { children: ReactNode }) {
  // Wait until the edge is well inside the screen, so the peek is seen.
  const [ref, seen] = useSeen<HTMLDivElement>("0px 0px -20% 0px");

  return (
    <div ref={ref} data-seen={seen ? "" : undefined} className="relative mt-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 w-56 -translate-x-1/2 -translate-y-[78%]"
      >
        <div className="eyes-peek">
          <JinxEyes sizes="14rem" />
        </div>
      </div>
      <div className="relative z-10">{children}</div>
      <Paw className="absolute top-0 left-[calc(50%-9.25rem)] z-20 w-20 -translate-y-[42%]" />
      <Paw className="absolute top-0 right-[calc(50%-9.25rem)] z-20 w-20 -translate-y-[42%] -scale-x-100" />
      <Sparkle className="absolute top-0 left-[calc(50%-10.25rem)] w-4 -translate-y-[420%]" />
      <Sparkle className="absolute top-0 right-[calc(50%-10.75rem)] w-3 -translate-y-[560%]" />
      <Sparkle className="absolute top-0 right-[calc(50%-8.75rem)] w-2.5 -translate-y-[900%]" />
    </div>
  );
}

/** A black paw hanging over an edge, its toes curled over the front. */
function Paw({ className }: { className?: string }) {
  const fur = useId();
  return (
    <svg
      viewBox="0 0 60 44"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={fur} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B2747" />
          <stop offset="0.55" stopColor="#1E1127" />
          <stop offset="1" stopColor="#140A1B" />
        </linearGradient>
      </defs>
      <path
        d="M3 29C3 14 15 4 30 4s27 10 27 25c0 8-6 13-14 13H17C9 42 3 37 3 29Z"
        fill={`url(#${fur})`}
      />
      <path
        d="M22 12c-2.5 8-2.5 17 0 28M38 12c2.5 8 2.5 17 0 28"
        fill="none"
        stroke="#0B0510"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M14 13c3-4 8-6.5 12-7"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.12"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A small four-pointed sparkle in ember. */
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M10 0Q11.2 8.8 20 10Q11.2 11.2 10 20Q8.8 11.2 0 10Q8.8 8.8 10 0Z"
        fill="#F2A93B"
      />
    </svg>
  );
}
