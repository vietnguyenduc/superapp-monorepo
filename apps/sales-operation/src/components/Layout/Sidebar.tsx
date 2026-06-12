import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthContext as useAuth } from "@superapp/iam";
import AddButton from "../UI/AddButton";
import { UserRole } from "../../types/UserRole";

interface SidebarProps {
  onClose?: () => void;
}

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  hasAddButton?: boolean;
  addAction?: () => void;
  badge?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const userRole = user?.role || UserRole.STAFF;

  const allNavigation: MenuItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      name: "Đơn Hàng",
      href: "/sales-orders",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      hasAddButton: true,
      addAction: () => {
        navigate("/sales-order-create?tab=single");
        onClose?.();
      },
    },
    {
      name: "Khách Hàng",
      href: "/customers",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      hasAddButton: true,
      addAction: () => {
        navigate("/customers?add=true");
        onClose?.();
      },
    },
    {
      name: "Hóa Đơn",
      href: "/invoices",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      hasAddButton: true,
      addAction: () => {
        navigate("/invoices?add=true");
        onClose?.();
      },
    },
    {
      name: "Cài đặt",
      href: "/settings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      name: "Hướng dẫn sử dụng",
      href: "/help",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
  ];

  // Filter navigation based on role
  const filteredNavigation = allNavigation.filter((item: MenuItem) => {
    if (userRole === UserRole.WAREHOUSE_KEEPER) {
      return item.name !== "Cài đặt";
    }
    return true;
  });

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-900 shadow-sm border-r border-gray-200 dark:border-gray-800 min-h-screen flex flex-col transition-colors duration-300">
      {/* Mobile close button */}
      {onClose && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Menu</h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
          >
            <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* App identity header */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/20">
            S
          </div>
          <div>
            <div className="text-sm font-black text-gray-900 dark:text-white">Sales Operation</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Quản lý bán hàng</div>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1">
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-3">Menu chính</div>
        <nav className="space-y-1">
          {filteredNavigation.map((item) => (
            <div
              key={item.href}
              className="flex items-center justify-between gap-2 group"
            >
              <button
                type="button"
                onClick={() => {
                  navigate(item.href);
                  onClose?.();
                }}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 text-left ${
                  isActive(item.href)
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                <span className={isActive(item.href) ? 'text-emerald-600 dark:text-emerald-400' : ''}>{item.icon}</span>
                <span>{item.name}</span>
                {item.badge && (
                  <span className="ml-auto text-[10px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">{item.badge}</span>
                )}
              </button>
              {item.hasAddButton && (
                <div className="ml-1 flex-shrink-0">
                  <AddButton
                    onClick={() => item.addAction?.()}
                    title="Thêm"
                    showShine
                    variant="default"
                  />
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
          <p className="font-bold">Sales Operation v1.0</p>
          <p className="mt-1">© 2024 SuperApp Platform</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
