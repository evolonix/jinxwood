import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { Link, type LinkProps } from "react-router";

type Variant = "solid" | "outline";
type Size = "sm" | "md" | "lg";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

/** A route inside the site. */
type ButtonAsLink = CommonProps &
  Omit<LinkProps, "to" | "className" | "children"> & {
    to: LinkProps["to"];
    href?: undefined;
  };

/** Anything else with a URL: another site, a mailto, a file download. */
type ButtonAsAnchor = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    href: string;
    to?: undefined;
  };

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    to?: undefined;
    href?: undefined;
  };

export type ButtonProps = ButtonAsLink | ButtonAsAnchor | ButtonAsButton;

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition duration-200";

const SIZE: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const VARIANT: Record<Variant, string> = {
  // Night text on ember is 7.7:1. Parchment on ember would be 1.7:1.
  solid: "bg-ember text-night hover:bg-ember-bright hover:shadow-glow",
  outline:
    "border-parchment/45 text-parchment hover:border-parchment hover:bg-parchment/10 border",
};

export function Button(props: ButtonProps) {
  const {
    variant = "solid",
    size = "md",
    className,
    children,
    ...rest
  } = props;
  const merged = [BASE, SIZE[size], VARIANT[variant], className]
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
  if ("href" in rest && rest.href !== undefined) {
    return (
      <a
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        className={merged}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      className={merged}
    >
      {children}
    </button>
  );
}
