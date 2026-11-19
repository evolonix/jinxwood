import { useId } from "react";

interface PeekingEyesProps {
  className?: string;
}

/**
 * The pair of glowing eyes from the wordmark's "oo", on their own. Decorative:
 * they blink twice when they appear and then hold still, and never blink under
 * reduced motion.
 */
export function PeekingEyes({ className = "h-16 w-auto" }: PeekingEyesProps) {
  const iris = useId();
  return (
    <svg
      viewBox="0 0 60 30"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={iris} cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#FFD15C" />
          <stop offset="1" stopColor="#F2A93B" />
        </radialGradient>
      </defs>
      {[15, 45].map((cx) => (
        <g
          key={cx}
          className="animate-blink"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          <circle cx={cx} cy="15" r="13.5" fill="#C4925C" />
          <circle cx={cx} cy="15" r="10" fill={`url(#${iris})`} />
          <path
            d={`M${cx} 5.5c3.4 5.6 3.4 13.4 0 19c-3.4-5.6-3.4-13.4 0-19z`}
            fill="#22052E"
          />
        </g>
      ))}
    </svg>
  );
}
