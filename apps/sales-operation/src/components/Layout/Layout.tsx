import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";
import Sidebar from "./Sidebar";
import QuickAddMenu from "../QuickAddMenu";

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  React.useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navigation onMenuClick={() => setSidebarOpen(true)} />
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600/75 dark:bg-black/75 backdrop-blur-sm" />
        </div>
      )}
      <div className="flex w-full">
        {/* Desktop sidebar - sticky */}
        <div className="hidden lg:block w-80 flex-shrink-0 sticky top-16 h-[calc(100vh-64px)]">
          <Sidebar />
        </div>
        {/* Mobile sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden no-scrollbar overflow-y-auto ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
        {/* Main content - full width, flush left */}
        <main className="flex-1 min-w-0 w-full">
          <div className="p-4 sm:p-5 lg:p-6 w-full">
            <Outlet />
          </div>
        </main>
      </div>
      <QuickAddMenu />
    </div>
  );
};

export default Layout;
