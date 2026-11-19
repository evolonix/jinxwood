import { APP, storeUrl, type StorePage } from "../_lib/content";
import { AppleIcon } from "./icons";

interface AppStoreBadgeProps {
  className?: string;
  /** A custom product page instead of the main listing. */
  page?: StorePage;
}

/**
 * Apple-style "Download on the App Store" badge linking to the live listing,
 * drawn the same as the badges on the rest of the site.
 * The URL comes from storeUrl() so the app id lives in exactly one place
 * (_lib/content.ts); `page` picks a custom product page.
 */
export function AppStoreBadge({ className, page }: AppStoreBadgeProps) {
  return (
    <a
      href={storeUrl(page)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Download ${APP.name} on the App Store`}
      className={[
        "inline-flex items-center gap-2.5 rounded-xl bg-black px-4 py-2.5 text-white ring-1 ring-white/20 transition-colors hover:bg-zinc-900",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <AppleIcon className="h-7 w-7" />
      <span className="flex flex-col leading-none">
        <span className="text-[0.625rem] font-medium tracking-wide">
          Download on the
        </span>
        <span className="mt-0.5 text-xl font-semibold tracking-tight">
          App Store
        </span>
      </span>
    </a>
  );
}
