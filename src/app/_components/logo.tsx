import { IMAGE_SIZES, TRADEMARK } from "../_lib/brand.gen";

/**
 * The logo cut-outs made by scripts/build-brand.mjs:
 *
 *   wordmark      "Jinxwood" lettering with the eye "oo" and the branch
 *   emblem        the cat in the tree hollow
 *   lockup        emblem and wordmark together
 *   lockup-light  the lockup drawn for light backgrounds (press kit only)
 *   wordmark-light  the lettering from that lockup, by itself (press kit only)
 *
 * The emblem has no lettering, so it is the same on any background.
 */
export type LogoName = keyof typeof WIDTHS;

/** The widths each cut-out is generated at. Keep in step with build-brand. */
const WIDTHS = {
  wordmark: [320, 640, 1280],
  lockup: [640, 1280],
  emblem: [240, 480, 640],
  "lockup-light": [640, 1280],
  "wordmark-light": [640, 1280],
} as const;

interface LogoProps {
  name: LogoName;
  /** The width the logo is shown at, as an <img sizes> value, e.g. "120px". */
  sizes: string;
  /** Defaults to the studio name. Pass "" where the logo is decoration. */
  alt?: string;
  className?: string;
}

/** Where the symbol sits, for the logos that have lettering to carry it. */
const TRADEMARK_AT: Partial<
  Record<LogoName, { x: number; y: number; height: number; color: string }>
> = TRADEMARK.at;

/**
 * The trademark symbol, drawn over a logo just past the end of its lettering.
 * The images themselves stay unmarked, so the symbol can change without
 * redrawing them: build-brand decides which symbol it is and where it sits.
 *
 * Put it straight after the <Logo>, inside a positioned box that is exactly
 * as wide as the image. It is drawn in the image's own coordinates, so it
 * grows and shrinks with the logo, and it hangs past the box's right edge. It
 * stays hidden until that image has loaded (see index.css). An emblem has no
 * lettering and gets nothing.
 */
export function TrademarkSymbol({ name }: { name: LogoName }) {
  const { width, height } = IMAGE_SIZES[name];
  const at = TRADEMARK_AT[name];
  if (!at) return null;
  return (
    <svg
      data-trademark
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      className="pointer-events-none absolute top-0 left-0 w-full overflow-visible"
    >
      <path
        d={TRADEMARK.path}
        fill={at.color}
        fillRule="evenodd"
        transform={`translate(${at.x} ${at.y}) scale(${at.height / 100})`}
      />
    </svg>
  );
}

export function Logo({ name, sizes, alt = "Jinxwood", className }: LogoProps) {
  const { width, height } = IMAGE_SIZES[name];
  const widths = WIDTHS[name];
  return (
    <img
      // The trademark symbol waits for this mark. The ref covers an image
      // that had already loaded by the time it was put on the page.
      ref={(img) => {
        if (img?.complete && img.naturalWidth > 0) img.dataset.loaded = "";
      }}
      onLoad={(event) => {
        event.currentTarget.dataset.loaded = "";
      }}
      src={`/img/logo/${name}-${widths[0]}.webp`}
      srcSet={widths.map((w) => `/img/logo/${name}-${w}.webp ${w}w`).join(", ")}
      sizes={sizes}
      width={width}
      height={height}
      alt={alt}
      // Decoded in step with the page, not after it. A browser may otherwise
      // draw a frame or two without the image while it decodes on the side,
      // and the trademark symbol would be showing next to nothing.
      decoding="sync"
      className={className}
    />
  );
}
