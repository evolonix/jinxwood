import { useId } from "react";

interface PeekingEyesProps {
  className?: string;
}

// The wordmark's colors: the letters' cream, the outline round each eye, the
// plum of the socket and lid, the iris from its shadowed top to its bright
// bottom, and the pupil.
const CREAM = "#FCE5C8";
const OUTLINE = "#14040E";
const PLUM_DARK = "#2C0319";
const PLUM = "#4A0832";
const PLUM_LIGHT = "#6E1450";
const IRIS_TOP = "#CF6D03";
const IRIS_MIDDLE = "#FDAD04";
const IRIS_BOTTOM = "#FCD005";
const PUPIL = "#25010F";

// Each eye in its own units: the "o" is an oval 100 wide and 120 tall, and the
// eye inside it a circle centered on it.
const RING = { rx: 50, ry: 60 };
const SOCKET = 40;
const IRIS = 35.5;

/** A four-pointed star, for the glint. */
const star = (x: number, y: number, r: number) => {
  const s = r * 0.18;
  return `M${x} ${y - r}Q${x + s} ${y - s} ${x + r} ${y}Q${x + s} ${y + s} ${x} ${y + r}Q${x - s} ${y + s} ${x - r} ${y}Q${x - s} ${y - s} ${x} ${y - r}Z`;
};

/**
 * The two "o"s of the wordmark, with Jinx's eyes in them, on their own.
 * Decorative: the upper lids close and open twice when they appear and then
 * hold still, and never move under reduced motion. Only the lids move, so the
 * rings keep their shape.
 */
export function PeekingEyes({ className = "h-16 w-auto" }: PeekingEyesProps) {
  const id = useId();
  const iris = `${id}-iris`;
  const lid = `${id}-lid`;
  return (
    <svg
      viewBox="0 0 202 122"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={iris} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.15" stopColor={IRIS_TOP} />
          <stop offset="0.5" stopColor={IRIS_MIDDLE} />
          <stop offset="0.85" stopColor={IRIS_BOTTOM} />
        </linearGradient>
        <linearGradient id={lid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PLUM_DARK} />
          <stop offset="0.75" stopColor={PLUM} />
          <stop offset="1" stopColor={PLUM_LIGHT} />
        </linearGradient>
      </defs>
      {[-1, 1].map((side) => {
        // Left eye at 50.5, right at 151.5; `inward` points toward the other.
        const cx = side < 0 ? 50.5 : 151.5;
        const cy = 61;
        const inward = -side;
        const socket = `${id}-socket${side}`;
        // The lid's edge runs from high at the outer side to low at the inner
        // one, bowed a little, as in the wordmark.
        const outer = { x: cx - inward * 38, y: cy - 21 };
        const inner = { x: cx + inward * 38, y: cy + 2 };
        const edge = `M${outer.x} ${outer.y}Q${cx} ${cy - 6} ${inner.x} ${inner.y}`;
        const lidShape = `${edge}L${inner.x} ${cy - 130}L${outer.x} ${cy - 130}Z`;
        // The pupil: a curved slit, wide where the lid meets it and coming to
        // a point near the bottom of the iris. Both sit a touch left of
        // center, as in the wordmark.
        const px = cx - 2;
        const pupil = `M${px - 10} ${cy - 24}Q${px - 8} ${cy + 8} ${px + 1} ${cy + 28}Q${px + 7} ${cy + 6} ${px + 9} ${cy - 24}Z`;
        // The glint, at the pupil's upper right, just under the lid, which
        // there is lower in the left eye than in the right.
        const glint = { x: cx + 8, y: side < 0 ? cy + 3 : cy - 3 };
        return (
          <g key={side}>
            <ellipse cx={cx} cy={cy} rx={RING.rx} ry={RING.ry} fill={CREAM} />
            <clipPath id={socket}>
              <circle cx={cx} cy={cy} r={SOCKET} />
            </clipPath>
            <circle cx={cx} cy={cy} r={SOCKET} fill={PLUM_DARK} />
            <g clipPath={`url(#${socket})`}>
              <circle cx={cx} cy={cy} r={IRIS} fill={`url(#${iris})`} />
              <path d={pupil} fill={PUPIL} />
              <path d={star(glint.x, glint.y, 7)} fill="#FFFFFF" />
              {/* The lid closes by sliding down over the iris. */}
              <g className="animate-blink">
                <path d={lidShape} fill={`url(#${lid})`} />
                <path
                  d={edge}
                  fill="none"
                  stroke={OUTLINE}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            </g>
            <circle
              cx={cx}
              cy={cy}
              r={SOCKET}
              fill="none"
              stroke={OUTLINE}
              strokeWidth="2"
            />
          </g>
        );
      })}
    </svg>
  );
}
