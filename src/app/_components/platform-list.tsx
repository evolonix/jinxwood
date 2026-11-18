import type { Platform } from "../_lib/content";

interface PlatformListProps {
  platforms: readonly Platform[];
  className?: string;
}

/** The devices a game runs on, as a row of small pills. */
export function PlatformList({ platforms, className }: PlatformListProps) {
  return (
    <ul
      aria-label="Available on"
      className={["flex flex-wrap gap-2", className].filter(Boolean).join(" ")}
    >
      {platforms.map((platform) => (
        <li
          key={platform}
          className="border-night-line text-parchment-muted rounded-full border px-3 py-1 text-sm"
        >
          {platform}
        </li>
      ))}
    </ul>
  );
}
