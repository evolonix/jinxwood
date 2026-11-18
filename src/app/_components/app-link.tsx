import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";

interface CommonProps {
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

const BASE =
  "text-ember hover:text-ember-bright underline decoration-ember/40 decoration-1 underline-offset-4 transition-colors hover:decoration-ember-bright";

/** An inline text link: a route inside the site (`to`) or any URL (`href`). */
export function AppLink(props: AppLinkProps) {
  const { className, children, ...rest } = props;
  const merged = [BASE, className].filter(Boolean).join(" ");

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
