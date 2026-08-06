import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

const Layout = () => {
  return (
    <div className="min-h-screen bg-[#F7F7FB] dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-20 md:pb-0">
      <main className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;
