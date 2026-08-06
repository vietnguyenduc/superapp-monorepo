import { Outlet, useLocation } from "react-router-dom";
import MobileHeader from "./MobileHeader";
import Navigation from "./Navigation";
import BottomNav from "./BottomNav";

const Layout = () => {
  const location = useLocation();
  const isBuilder = location.pathname.startsWith("/builder");

  return (
    <div className="min-h-screen bg-[#F7F7FB] dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-20 md:pb-0">
      {!isBuilder && (
        <>
          <div className="md:hidden">
            <MobileHeader />
          </div>
          <div className="hidden md:block">
            <Navigation />
          </div>
        </>
      )}
      <main className={`mx-auto px-4 py-4 md:py-8 ${isBuilder ? "max-w-7xl" : "max-w-3xl"}`}>
        <Outlet />
      </main>
      {!isBuilder && <BottomNav />}
    </div>
  );
};

export default Layout;
