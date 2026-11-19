import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";

interface CommonProps {
  /** A small leading icon. The underline then sits under the label only. */
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

type AppLinkInternal = CommonProps &
  Omit<LinkProps, "to" | "className" | "children"> & {
    to: LinkProps["to"];
    href?: never;
  };

type AppLinkExternal = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    href: string;
    to?: never;
    /** Opens in a new tab. Default true for http(s) links, false otherwise. */
    newTab?: boolean;
  };

export type AppLinkProps = AppLinkInternal | AppLinkExternal;

const COLOR = "text-ember hover:text-ember-bright transition-colors";
const UNDERLINE =
  "underline decoration-ember/40 decoration-1 underline-offset-4 hover:decoration-ember-bright";

/** An inline text link: a route inside the site (`to`) or any URL (`href`). */
export function AppLink(props: AppLinkProps) {
  const { icon, className, children: label, ...rest } = props;
  const merged = (
    icon
      ? [COLOR, "inline-flex items-center gap-1.5", className]
      : [COLOR, UNDERLINE, className]
  )
    .filter(Boolean)
    .join(" ");
  const children = icon ? (
    <>
      <span aria-hidden className="shrink-0">
        {icon}
      </span>
      <span className={UNDERLINE}>{label}</span>
    </>
  ) : (
    label
  );

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
  const { newTab, href, ...anchorRest } = rest as Omit<
    AppLinkExternal,
    "className" | "children"
  >;
  const external = newTab ?? /^https?:/.test(href);
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...anchorRest}
      className={merged}
    >
      {children}
    </a>
  );
}
