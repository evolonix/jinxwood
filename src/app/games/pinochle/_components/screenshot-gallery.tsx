import { useState } from "react";
import { DEVICES, SHOTS, type Device } from "../_lib/content";
import { DeviceFrame } from "./device-frame";

export function ScreenshotGallery() {
  const [device, setDevice] = useState<Device>("iPhone");
  const shots = SHOTS.filter((s) => s.device === device);

  return (
    <div>
      {/* A row of toggle buttons. They were marked up as tabs, but tabs
          promise a tab panel and arrow-key movement that are not here; a
          pressed button says the same thing and works with Tab and Enter. */}
      <div
        role="group"
        aria-label="Choose a device"
        className="mb-8 flex flex-wrap gap-2"
      >
        {DEVICES.map((d) => {
          const active = d === device;
          return (
            <button
              key={d}
              type="button"
              aria-pressed={active}
              onClick={() => setDevice(d)}
              className={[
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-ember text-night"
                  : "bg-night-raised text-parchment-muted ring-night-line hover:text-parchment ring-1",
              ].join(" ")}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Upright shots (the iPhone tab, 2.0) sit three across — two would make
          each frame a whole screen tall. */}
      <div
        className={
          shots[0] && shots[0].ratio < 1
            ? "grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3"
            : "grid gap-6 sm:grid-cols-2"
        }
      >
        {shots.map((shot) => (
          <DeviceFrame key={shot.file} shot={shot} />
        ))}
      </div>
    </div>
  );
}
