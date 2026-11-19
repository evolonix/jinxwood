import type { HTMLAttributes, ReactNode } from "react";

type Intent = "info" | "success" | "warning" | "error";
type Density = "inline" | "section";

interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  intent?: Intent;
  density?: Density;
  title?: ReactNode;
  children: ReactNode;
}

const INTENT: Record<Intent, string> = {
  info: "bg-ember/10 ring-ember/30 text-ember",
  success: "bg-emerald-900/40 ring-emerald-800 text-emerald-100",
  warning: "bg-amber-900/40 ring-amber-800 text-amber-100",
  error: "bg-rose-950/40 ring-rose-800 text-rose-200",
};

const DENSITY: Record<Density, string> = {
  inline: "rounded-lg p-3 text-sm",
  section: "rounded-2xl p-8 text-base",
};

export function Alert({
  intent = "info",
  density = "inline",
  title,
  children,
  className,
  ...rest
}: AlertProps) {
  const merged = [DENSITY[density], "ring-1", INTENT[intent], className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={merged} {...rest}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-1" : undefined}>{children}</div>
    </div>
  );
}
