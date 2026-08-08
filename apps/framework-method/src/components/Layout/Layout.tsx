import { useState } from "react";
import { Outlet } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import BottomNav from "./BottomNav";
import SideNav from "./SideNav";
import { useI18n } from "../../hooks/useI18n";

const Layout = () => {
  const { t } = useI18n();
  const [sideOpen, setSideOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F7FB] dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4">
        <button
          onClick={() => setSideOpen(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={t("nav.menu")}
        >
          <FiMenu className="w-5 h-5" />
        </button>
        <span className="font-bold text-lg">{t("app.name")}</span>
        <div className="w-10" />
      </header>

      <SideNav open={sideOpen} onClose={() => setSideOpen(false)} />

      <main className="min-h-screen md:pl-64 pt-14 md:pt-0 pb-20 md:pb-0">
        <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Layout;
