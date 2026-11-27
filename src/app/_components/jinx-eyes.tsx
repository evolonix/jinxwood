import { useId } from "react";
import { IMAGE_SIZES } from "../_lib/brand.gen";

/** The widths the eyes are generated at. Keep in step with build-brand. */
const WIDTHS = [320, 640, 960];

/**
 * The lids that blink over the eyes, in the eyes image's own pixels, traced
 * from the image: `edge` is where each drawn lid meets the dark band along
 * its edge, and `band` is that band. A blinking lid is the drawn lid itself,
 * cut from the image along `edge`, with the band below it and plum above it
 * reaching up far enough to keep the eye covered once it has slid down, so a
 * blink starts exactly as the eye is drawn. `left` and `right` are how far
 * each lid reaches. The loading screen in index.html draws the same lids.
 */
const LIDS = [
  {
    edge: "M-20 172L52 172L76 176L100 180L124 185L148 189L172 193L196 197L220 201L244 206L268 210L292 215L316 220L340 225L364 231L388 237L412 244L436 251L460 258L484 266L508 275L532 284L556 294L580 305L604 317L628 329L652 342L676 356L700 371L724 387L748 404L750 406L762 406",
    band: "M-20 172L52 172L76 176L100 180L124 185L148 189L172 193L196 197L220 201L244 206L268 210L292 215L316 220L340 225L364 231L388 237L412 244L436 251L460 258L484 266L508 275L532 284L556 294L580 305L604 317L628 329L652 342L676 356L700 371L724 387L748 404L750 406L762 406L762 438L750 438L748 437L724 420L700 405L676 390L652 377L628 364L604 352L580 341L556 330L532 321L508 312L484 303L460 296L436 288L412 282L388 275L364 269L340 264L316 259L292 254L268 249L244 244L220 240L196 236L172 231L148 227L124 223L100 218L76 214L52 209L-20 209Z",
    left: -20,
    right: 762,
  },
  {
    edge: "M795 404L807 404L831 389L855 374L879 360L903 346L927 333L951 321L975 309L999 298L1023 288L1047 278L1071 269L1095 261L1119 253L1143 245L1167 238L1191 231L1215 225L1239 219L1263 214L1287 209L1311 204L1335 200L1359 195L1383 191L1407 187L1431 184L1455 180L1479 176L1503 172L1511 171L1582 171",
    band: "M795 404L807 404L831 389L855 374L879 360L903 346L927 333L951 321L975 309L999 298L1023 288L1047 278L1071 269L1095 261L1119 253L1143 245L1167 238L1191 231L1215 225L1239 219L1263 214L1287 209L1311 204L1335 200L1359 195L1383 191L1407 187L1431 184L1455 180L1479 176L1503 172L1511 171L1582 171L1582 207L1511 207L1503 208L1479 212L1455 216L1431 220L1407 224L1383 228L1359 232L1335 236L1311 240L1287 245L1263 250L1239 255L1215 261L1191 267L1167 273L1143 280L1119 287L1095 295L1071 303L1047 312L1023 321L999 331L975 342L951 353L927 365L903 377L879 390L855 404L831 418L807 433L795 433Z",
    left: 795,
    right: 1582,
  },
];

interface JinxEyesProps {
  /** The width the eyes are shown at, as an <img sizes> value. */
  sizes: string;
  className?: string;
}

/**
 * Jinx's eyes on their own, from brand/masters/eyes.png, with a lid over each
 * that can blink: it slides down over the iris and back, inside the eye's
 * outline. The lids stay hidden until an ancestor sets them going (see
 * .blink-lids in index.css). Always decoration: whatever the eyes mean is
 * said in words beside them.
 */
export function JinxEyes({ sizes, className }: JinxEyesProps) {
  const id = useId();
  const { width, height } = IMAGE_SIZES.eyes;
  return (
    <div className={`relative ${className ?? ""}`}>
      <img
        src={`/img/eyes/eyes-${WIDTHS[0]}.webp`}
        srcSet={WIDTHS.map((w) => `/img/eyes/eyes-${w}.webp ${w}w`).join(", ")}
        sizes={sizes}
        width={width}
        height={height}
        alt=""
        decoding="async"
        className="block h-auto w-full"
      />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* Only the inside of each eye, within its dark outline. */}
          <mask
            id={`${id}-inside`}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={width}
            height={height}
          >
            <image
              href="/img/eyes/eyes-inside.png"
              width={width}
              height={height}
              preserveAspectRatio="none"
            />
          </mask>
          {/* The margin outside the inside, which darkens while the eyes
              are closed. */}
          <mask
            id={`${id}-rim`}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={width}
            height={height}
          >
            <image
              href="/img/eyes/eyes-rim.png"
              width={width}
              height={height}
              preserveAspectRatio="none"
            />
          </mask>
          {LIDS.map(({ edge, left, right }, i) => (
            <clipPath key={edge} id={`${id}-lid${i}`}>
              <path d={`${edge}L${right} -10L${left} -10Z`} />
            </clipPath>
          ))}
        </defs>
        <g mask={`url(#${id}-inside)`}>
          <g className="eye-lids">
            {LIDS.map(({ edge, band, left, right }, i) => (
              <g key={edge}>
                <path
                  d={`${edge}L${right} -560L${left} -560Z`}
                  fill="#32011F"
                />
                {/* The drawn lid, inside the eye only, so the outline along
                    the eye's top stays put when the lid slides down. It
                    fades into the plain plum as it closes, so a closed eye
                    is an even plum, and back as it opens. */}
                <g className="eye-lid-art" mask={`url(#${id}-inside)`}>
                  <image
                    href="/img/eyes/eyes-960.webp"
                    width={width}
                    height={height}
                    clipPath={`url(#${id}-lid${i})`}
                  />
                </g>
                <path d={band} fill="#170008" />
              </g>
            ))}
          </g>
        </g>
        {/* While the eyes are closed, the margin darkens to the outline's
            color, so the outline runs evenly all the way round. */}
        <rect
          className="eye-rim"
          width={width}
          height={height}
          fill="#180009"
          mask={`url(#${id}-rim)`}
        />
      </svg>
    </div>
  );
}
