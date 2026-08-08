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
    <div className="min-h-screen bg-[var(--fm-bg)] dark:bg-[var(--fm-bg-dark)] text-gray-900 dark:text-gray-50">
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between px-4">
        <button
          onClick={() => setSideOpen(true)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition-all"
          aria-label={t("nav.menu")}
        >
          <FiMenu className="w-5 h-5" />
        </button>
        <span className="font-semibold text-lg tracking-tight">{t("app.name")}</span>
        <div className="w-10" />
      </header>

      <SideNav open={sideOpen} onClose={() => setSideOpen(false)} />

      <main className="min-h-screen md:pl-64 pt-14 md:pt-0 pb-20 md:pb-0">
        <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Layout;
