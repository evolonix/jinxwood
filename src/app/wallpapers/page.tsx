import { Download } from "../_components/download";
import { Enlarge, LargeImage } from "../_components/enlarge";
import { Eyebrow } from "../_components/eyebrow";
import { STUDIO, WALLPAPERS } from "../_lib/content";
import { usePageMeta } from "../_lib/use-page-meta";

export default function Wallpapers() {
  usePageMeta("/wallpapers");
  return (
    <div className="px-safe-lg mx-auto max-w-6xl py-12 sm:py-16">
      <Eyebrow className="mb-3">Wallpapers</Eyebrow>
      <h1 className="text-4xl sm:text-5xl">
        A little {STUDIO.name} for your screen
      </h1>
      <p className="text-parchment-muted mt-4 max-w-2xl text-lg">
        {WALLPAPERS.intro}
      </p>

      {WALLPAPERS.sets.map((set) => (
        <section
          key={set.device}
          className="border-night-line mt-14 border-t pt-10"
        >
          <h2 className="text-2xl sm:text-3xl">{set.device}</h2>
          <p className="text-parchment-muted mt-3 max-w-3xl">{set.about}</p>
          {/* Desktop wallpapers are wide, so two fit across; the phone's are
              tall, so four do. */}
          <ul
            className={`mt-8 grid gap-6 ${
              set.preview.width > set.preview.height
                ? "sm:grid-cols-2"
                : "grid-cols-2 lg:grid-cols-4"
            }`}
          >
            {set.files.map((item) => (
              <li
                key={item.file}
                className="ring-night-line bg-night-raised flex flex-col overflow-hidden rounded-2xl ring-1"
              >
                <Enlarge
                  label={item.label}
                  name={`${set.device} wallpaper: ${item.label}`}
                  note={item.note}
                  download={item.file}
                  view={
                    <LargeImage
                      full={item.file}
                      preview={item.preview}
                      width={item.width}
                      height={item.height}
                      alt={`${set.device} wallpaper: ${item.label}`}
                    />
                  }
                >
                  <img
                    src={item.preview}
                    width={set.preview.width}
                    height={set.preview.height}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full"
                  />
                </Enlarge>
                <Download
                  href={item.file}
                  label={item.label}
                  name={`${set.device} wallpaper: ${item.label}`}
                  note={item.note}
                  wrap
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
