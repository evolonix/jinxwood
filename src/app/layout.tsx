import { RouteTreeDevtools } from "@evolonix/react-router-next-devtools/vite-client";
import { Outlet, ScrollRestoration } from "react-router";
import { Footer } from "./_components/footer";
import { Header } from "./_components/header";

export default function RootLayout() {
  return (
    <>
      <a
        href="#main-content"
        className="focus:bg-ember focus:text-night sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>
      <div className="flex min-h-full flex-col">
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          <Outlet />
        </main>
        <Footer />
      </div>
      <ScrollRestoration />
      {import.meta.env.DEV && <RouteTreeDevtools />}
    </>
  );
}
