import type { HTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";

interface CommonProps {
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}

type CardAsDiv = CommonProps &
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
    to?: undefined;
  };

type CardAsLink = CommonProps &
  Omit<LinkProps, "to" | "className" | "children"> & {
    to: LinkProps["to"];
  };

export type CardProps = CardAsDiv | CardAsLink;

const BASE =
  "relative block overflow-hidden rounded-2xl p-6 ring-1 bg-night-raised ring-night-line";
const INTERACTIVE = "group transition hover:-translate-y-0.5 hover:shadow-lg";

export function Card(props: CardProps) {
  const { interactive = false, children, className, ...rest } = props;
  const merged = [BASE, interactive && INTERACTIVE, className]
    .filter(Boolean)
    .join(" ");

  if ("to" in rest && rest.to !== undefined) {
    const { to, ...linkRest } = rest as Omit<
      LinkProps,
      "className" | "children"
    >;
    return (
      <Link to={to} viewTransition {...linkRest} className={merged}>
        {children}
      </Link>
    );
  }
  return (
    <div {...(rest as HTMLAttributes<HTMLDivElement>)} className={merged}>
      {children}
    </div>
  );
}
