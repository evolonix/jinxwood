import {
  createElement,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";

interface EyebrowProps extends HTMLAttributes<HTMLElement> {
  /** Underlying element. Default "p". */
  as?: ElementType;
  children: ReactNode;
}

/** The small capitalised label that sits above a heading. */
export function Eyebrow({
  as = "p",
  children,
  className,
  ...rest
}: EyebrowProps) {
  const merged = [
    "text-moss-light text-xs font-semibold tracking-[0.18em] uppercase",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return createElement(as, { className: merged, ...rest }, children);
}
