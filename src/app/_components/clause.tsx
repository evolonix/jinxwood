import type { ReactNode } from "react";

interface ClauseProps {
  heading: string;
  /** An anchor for links straight to this section. */
  id?: string;
  children: ReactNode;
}

/** One section of a policy page: a heading plus its paragraph(s). */
export function Clause({ heading, id, children }: ClauseProps) {
  return (
    <section id={id} className="mt-10 scroll-mt-24">
      <h2 className="text-xl">{heading}</h2>
      <div className="text-parchment-muted mt-3 space-y-4">{children}</div>
    </section>
  );
}
