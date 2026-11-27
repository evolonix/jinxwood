interface IconProps {
  className?: string;
}

export function AppleIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.05 12.54c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.75 2.28-1.6 2.78-.41 6.89 1.15 9.14.76 1.1 1.67 2.34 2.86 2.29 1.15-.05 1.58-.74 2.97-.74 1.39 0 1.78.74 3 .72 1.24-.02 2.02-1.12 2.78-2.23.88-1.28 1.24-2.52 1.26-2.58-.03-.01-2.42-.93-2.44-3.68ZM14.77 5.8c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.68 1.37-.59.68-1.11 1.77-.97 2.81 1.02.08 2.07-.52 2.71-1.28Z" />
    </svg>
  );
}

function Line({
  className = "h-4 w-4",
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Line>
  );
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Line>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
    </Line>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M9 5v14M15 5v14" />
    </Line>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M8 5.5v13l10-6.5z" />
    </Line>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Line>
  );
}

export function EnlargeIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
    </Line>
  );
}

export function ExternalIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M14 5h5v5M19 5l-8 8M11 7H6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-5" />
    </Line>
  );
}
