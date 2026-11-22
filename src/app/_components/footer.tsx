import { STUDIO } from "../_lib/content";
import { AppLink } from "./app-link";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="border-night-line bg-night-deep border-t">
      <div className="px-safe-lg pb-safe mx-auto flex max-w-6xl flex-col gap-8 pt-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Logo
            name="emblem"
            sizes="4rem"
            alt=""
            className="h-16 w-auto shrink-0"
          />
          <div className="text-parchment-muted text-sm">
            <p>{STUDIO.copyright}</p>
            <p>{STUDIO.legalLine}</p>
            <p>{STUDIO.trademark}</p>
          </div>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm"
        >
          <AppLink to="/games">Games</AppLink>
          <AppLink to="/press">Press</AppLink>
          <AppLink to="/privacy">Privacy</AppLink>
          <AppLink to="/terms">Terms</AppLink>
          <AppLink href={`mailto:${STUDIO.email}`}>{STUDIO.email}</AppLink>
        </nav>
      </div>
    </footer>
  );
}
