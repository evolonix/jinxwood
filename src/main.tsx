import { AppRouter } from "@evolonix/react-router-next/vite-client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Self-hosted variable fonts. Fraunces uses the "full" build because the brand
// sets its SOFT and WONK axes, which the default build leaves out.
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/nunito-sans/wght.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
