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
}

const DashboardIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
  </svg>
);

const ProductIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V7a2 2 0 00-2-2h-3V3H9v2H6a2 2 0 00-2 2v6m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
  </svg>
);

const InventoryIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);


const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const userRole = user?.role || UserRole.STAFF;

  const allNavigation: MenuItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <DashboardIcon />,
    },
    {
      name: "Quản lý Danh mục",
      href: "/product-management",
      icon: <ProductIcon />,
      hasAddButton: true,
      addAction: () => {
        navigate("/product-catalog-import?tab=single");
        onClose?.();
      },
    },
    {
      name: "Nhà cung cấp",
      href: "/supplier-management",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      hasAddButton: true,
      addAction: () => {
        navigate("/supplier-import?tab=single");
        onClose?.();
      },
    },
    {
      name: "Nhập hàng",
      href: "/goods-receipts",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
      hasAddButton: true,
      addAction: () => {
        navigate("/goods-receipts?subTab=gr&tab=single");
        onClose?.();
      },
    },
    {
      name: "Xuất hàng",
      href: "/goods-issues",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>,
      hasAddButton: true,
      addAction: () => {
        navigate("/goods-issues?mode=manual&tab=single");
        onClose?.();
      },
    },
    {
      name: "Quản lý Xuất Nhập Tồn",
      href: "/inventory-records",
      icon: <InventoryIcon />,
      hasAddButton: true,
      addAction: () => {
        navigate("/inventory-transaction-import?tab=single");
        onClose?.();
      },
    },
    {
      name: "Tồn kho & MRP (DOH)",
      href: "/inventory-mrp",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    },
    {
      name: "Cài đặt",
      href: "/settings",
      icon: <SettingsIcon />,
    },
    {
      name: "Hướng dẫn sử dụng",
      href: "/help",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
  ];

  // Filter navigation based on role
  const filteredNavigation = allNavigation.filter((item: MenuItem) => {
    if (userRole === UserRole.WAREHOUSE_KEEPER) {
      // Thủ kho: No settings access
      return item.name !== "Cài đặt";
    }
    if (userRole === UserRole.WAREHOUSE_ACCOUNTANT) {
      // Kế toán kho: All access except maybe some settings
      return true;
    }
    // Admin roles: Full access
    return true;
  });

  return (
    <div className="w-80 bg-white dark:bg-gray-900 shadow-sm border-r border-gray-200 dark:border-gray-800 min-h-screen flex flex-col transition-colors duration-300">
      {/* Mobile close button */}
      {onClose && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Menu</h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <span className="sr-only">Close menu</span>
            <svg
              className="block h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      <div className="p-5 flex-1">
        <nav className="space-y-2">
          {filteredNavigation.map((item) => (
            <div
              key={item.href}
              className="flex items-center justify-between gap-3 group"
            >
              <button
                type="button"
                onClick={() => {
                  navigate(item.href);
                  onClose?.();
                }}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-base font-semibold transition-colors flex-1 text-left ${
                  location.pathname === item.href
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
              {item.hasAddButton && (
                <div className="ml-2 flex-shrink-0">
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
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          <p>Inventory Operation v1.0</p>
          <p className="mt-1">© 2024 F&B Management</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
