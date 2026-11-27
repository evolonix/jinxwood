import { useEffect, useRef, useState, type ReactNode } from "react";
import { Download } from "./download";
import { CloseIcon, EnlargeIcon } from "./icons";

/**
 * A preview that opens large when clicked. `children` is the preview; `view`
 * is what the large view shows, and it is only put on the page while the view
 * is open, so nothing large loads until someone asks for it. Below it go the
 * label and the download, as on the tile.
 *
 * The view is a modal dialog: the page behind it can't be reached while it is
 * open, and Esc, the close button or a click anywhere outside the picture
 * closes it, handing focus back to the preview.
 */
export function Enlarge({
  label,
  name = label,
  note,
  download,
  view,
  children,
}: {
  label: string;
  /** What a screen reader hears, where the label alone would not say which. */
  name?: string;
  note: string;
  download: string;
  view: ReactNode;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View larger: ${name}`}
        className="group relative block w-full cursor-zoom-in rounded-none"
      >
        {children}
        <span
          aria-hidden="true"
          className="bg-night/80 text-parchment absolute top-3 right-3 rounded-full p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <EnlargeIcon />
        </span>
      </button>
      {open && (
        <dialog
          ref={dialog}
          aria-label={label}
          onClose={() => setOpen(false)}
          className="text-parchment backdrop:bg-night-deep/90 m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:backdrop-blur-sm"
        >
          {/* First, so it is what has focus when the view opens. */}
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Close"
            className="bg-night-raised/90 hover:text-ember ring-night-line fixed top-4 right-4 rounded-full p-3 ring-1 transition-colors"
            style={{
              top: "max(1rem, env(safe-area-inset-top))",
              right: "max(1rem, env(safe-area-inset-right))",
            }}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
          {/* The whole screen; a click on it that misses the picture and the
              caption closes the view. */}
          <div
            onClick={(event) => {
              if (event.target === event.currentTarget) dialog.current?.close();
            }}
            className="px-safe-lg flex h-full flex-col items-center justify-center gap-4 pt-16 pb-6"
          >
            {view}
            <div className="ring-night-line w-full max-w-xl overflow-hidden rounded-2xl ring-1">
              <Download href={download} label={label} name={name} note={note} />
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}

/** How much of the screen's height the large view leaves for the picture. */
const ROOM = "100dvh - 11rem";

/**
 * A picture for the large view, as large as the screen allows and no larger
 * than the file. It shows `preview`, which the page has already loaded, at
 * once, and swaps in `full` when that has arrived.
 */
export function LargeImage({
  full,
  preview,
  width,
  height,
  alt,
}: {
  full: string;
  preview: string;
  /** The full file's size, which also gives the shape. */
  width: number;
  height: number;
  alt: string;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const image = new Image();
    image.onload = () => setLoaded(true);
    image.src = full;
    return () => {
      image.onload = null;
    };
  }, [full]);

  return (
    <LargeBox width={width} height={height} className="relative">
      <img
        src={loaded ? full : preview}
        alt={alt}
        width={width}
        height={height}
        className="block h-auto w-full rounded-xl"
      />
      {!loaded && (
        <p className="bg-night/80 text-parchment-muted absolute right-3 bottom-3 rounded-full px-3 py-1 text-sm">
          Loading full size…
        </p>
      )}
    </LargeBox>
  );
}

/**
 * A box for the large view, of the shape `width` by `height`: as large as the
 * screen allows, and no wider than `cap`, which is `width` unless given.
 */
export function LargeBox({
  width,
  height,
  cap = width,
  className = "",
  children,
}: {
  width: number;
  height: number;
  cap?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={className}
      style={{
        width: `min(100%, ${cap}px, calc((${ROOM}) * ${width / height}))`,
      }}
    >
      {children}
    </div>
  );
}
