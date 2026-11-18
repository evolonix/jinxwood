import type { ReactNode } from "react";
import { Eyebrow } from "./eyebrow";

interface SectionProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  /** "deep" sets the band on the darker night tone to separate it. */
  tone?: "default" | "deep";
  id?: string;
}

/** A page band: eyebrow, heading, optional lead-in, then its content. */
export function Section({
  eyebrow,
  title,
  description,
  children,
  tone = "default",
  id,
}: SectionProps) {
  return (
    <section
      id={id}
      className={
        tone === "deep" ? "border-night-line bg-night-deep border-y" : undefined
      }
    >
      <div className="px-safe-lg mx-auto max-w-6xl py-16 sm:py-20">
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h2 className="text-3xl sm:text-4xl">{title}</h2>
        {description && (
          <p className="text-parchment-muted mt-4 max-w-2xl text-lg">
            {description}
          </p>
        )}
        {children && <div className="mt-10">{children}</div>}
      </div>
    </section>
  );
}
