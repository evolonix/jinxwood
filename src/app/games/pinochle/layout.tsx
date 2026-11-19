import { Outlet } from "react-router";
import { GameFooter } from "./_components/game-footer";
import { SubNav } from "./_components/sub-nav";

/**
 * Wraps every Pinochle page inside the site's own header and footer: the
 * game's navigation above, its closing band below.
 */
export default function PinochleLayout() {
  return (
    <>
      <SubNav />
      <Outlet />
      <GameFooter />
    </>
  );
}
