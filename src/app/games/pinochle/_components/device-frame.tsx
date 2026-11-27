import { Enlarge, LargeImage } from "../../../_components/enlarge";
import { asset } from "../_lib/asset";
import type { Shot } from "../_lib/content";

/** How many pixels the screenshots' longest side is. */
const SHOT_SIZE = 1200;

interface DeviceFrameProps {
  shot: Shot;
  /** Show the small device/label chip above the frame. */
  showLabel?: boolean;
  className?: string;
  /** Loading hint for the underlying <img>. Defaults to "lazy". */
  loading?: "lazy" | "eager";
}

/**
 * A device-agnostic screen frame: the screenshot sits inside a rounded, ringed,
 * shadowed surface sized to the shot's own aspect ratio. Works for the app's
 * landscape shots across iPhone / iPad / Mac / Apple TV without per-device bezel
 * art. Clicked, it opens the screenshot large.
 */
export function DeviceFrame({
  shot,
  showLabel = true,
  className,
  loading = "lazy",
}: DeviceFrameProps) {
  const src = asset(`img/shots/${shot.file}.webp`);
  return (
    <figure
      className={["flex flex-col gap-3", className].filter(Boolean).join(" ")}
    >
      {showLabel && (
        <figcaption className="flex items-center gap-2 text-xs font-medium text-parchment-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-ember" />
          {shot.device} · {shot.label}
        </figcaption>
      )}
      <div className="bg-night-deep ring-night-line overflow-hidden rounded-2xl p-1.5 shadow-lg ring-1">
        <Enlarge
          label={`${shot.device} · ${shot.label}`}
          // As round as the screenshot, so the focus ring follows it within
          // the frame.
          shape="rounded-xl"
          view={
            // The one file there is, its longest side SHOT_SIZE pixels.
            <LargeImage
              full={src}
              preview={src}
              width={Math.round(
                shot.ratio >= 1 ? SHOT_SIZE : SHOT_SIZE * shot.ratio,
              )}
              height={Math.round(
                shot.ratio >= 1 ? SHOT_SIZE / shot.ratio : SHOT_SIZE,
              )}
              alt={shot.alt}
            />
          }
        >
          <img
            src={src}
            alt={shot.alt}
            loading={loading}
            decoding="async"
            style={{ aspectRatio: shot.ratio }}
            className="w-full rounded-xl object-cover"
          />
        </Enlarge>
      </div>
    </figure>
  );
}
