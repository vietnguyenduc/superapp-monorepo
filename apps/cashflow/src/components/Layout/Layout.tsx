import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navigation from "./Navigation";
import Sidebar from "./Sidebar";

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  // Initialize dark mode on app startup
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      const isDarkMode = JSON.parse(savedDarkMode);
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        // Force body styling for immediate visual feedback
        document.body.style.backgroundColor = '#111827';
        document.body.style.color = '#f3f4f6';
      } else {
        document.documentElement.classList.remove('dark');
        // Force body styling for immediate visual feedback
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#213547';
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation onMenuClick={() => setSidebarOpen(true)} />
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 dark:bg-gray-800 bg-opacity-75" />
        </div>
      )}
      <div className="flex w-full">
        {/* Desktop sidebar - sticky */}
        <div className="hidden lg:block w-80 flex-shrink-0 sticky top-16 h-screen overflow-y-auto no-scrollbar">
          <Sidebar />
        </div>
        {/* Mobile sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden no-scrollbar overflow-y-auto ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
        {/* Main content - full width, flush left */}
        <main className="flex-1 min-w-0 w-full overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-8 w-full">
            <Outlet />
            <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-4 text-center text-xs text-gray-400 dark:text-gray-500">
              Quản lý công nợ - TPL
            </div>
          </div>
        </main>
      </div>
      <button
        type="button"
        onClick={() => {
          setSidebarOpen(false);
          navigate("/import/transactions");
        }}
        className="fixed bottom-6 right-6 z-50 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
        aria-label="Thêm giao dịch mới"
      >
        <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v12m6-6H6" />
        </svg>
      </button>
    </div>
  );
};

export default Layout;
