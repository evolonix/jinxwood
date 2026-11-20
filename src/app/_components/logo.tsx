import { IMAGE_SIZES } from "../_lib/brand.gen";

/**
 * The logo cut-outs made by scripts/build-brand.mjs:
 *
 *   wordmark      "Jinxwood" lettering with the eye "oo" and the branch
 *   emblem        the cat in the tree hollow
 *   lockup        emblem and wordmark together
 *   lockup-light  the lockup drawn for light backgrounds (press kit only)
 *   wordmark-light  the lettering from that lockup, by itself (press kit only)
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

export function Logo({ name, sizes, alt = "Jinxwood", className }: LogoProps) {
  const { width, height } = IMAGE_SIZES[name];
  const widths = WIDTHS[name];
  return (
    <img
      src={`/img/logo/${name}-${widths[0]}.webp`}
      srcSet={widths.map((w) => `/img/logo/${name}-${w}.webp ${w}w`).join(", ")}
      sizes={sizes}
      width={width}
      height={height}
      alt={alt}
      decoding="async"
      className={className}
    />
  );
}
