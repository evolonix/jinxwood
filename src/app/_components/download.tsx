import { DownloadIcon } from "./icons";

/**
 * A download's label and button, as the bottom of a tile. `name` is what a
 * screen reader hears for the button where the label alone would not say
 * which download it is. `wrap` lets the button drop below the label where a
 * narrow tile has no room for both side by side.
 */
export function Download({
  href,
  label,
  name = label,
  note,
  wrap = false,
}: {
  href: string;
  label: string;
  name?: string;
  note: string;
  wrap?: boolean;
}) {
  return (
    <div
      className={`bg-night-raised flex items-center justify-between gap-x-4 gap-y-3 p-4 ${
        wrap ? "flex-1 flex-wrap" : ""
      }`}
    >
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-parchment-muted text-sm">{note}</p>
      </div>
      <a
        href={href}
        download
        aria-label={`Download: ${name}`}
        className="bg-ember text-night hover:bg-ember-bright inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
      >
        <DownloadIcon />
        Download
      </a>
    </div>
  );
}
