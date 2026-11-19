import reactRouterNext from "@evolonix/react-router-next/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
// No `base`: the site is served from the root of its own domain
// (https://jinxwood.com), not from a project-page subdirectory.
export default defineConfig({
  plugins: [reactRouterNext(), react(), tailwindcss()],
});
