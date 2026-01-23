import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";
import Sidebar from "./Sidebar";

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation onMenuClick={() => setSidebarOpen(true)} />
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}
      <div className="flex w-full">
        {/* Desktop sidebar - sticky */}
        <div className="hidden lg:block w-64 flex-shrink-0 sticky top-16 h-screen overflow-y-auto no-scrollbar">
          <Sidebar />
        </div>
        {/* Mobile sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden no-scrollbar overflow-y-auto ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
        {/* Main content - full width, flush left */}
        <main className="flex-1 min-w-0 w-full overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-8 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
