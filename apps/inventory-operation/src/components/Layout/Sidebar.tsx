import React from "react";
import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  DocumentArrowUpIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CogIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  onClose?: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Nhập Liệu Tồn Kho", href: "/inventory-input", icon: ClipboardDocumentListIcon },
  { name: "Quản Lý Danh Mục", href: "/product-management", icon: DocumentArrowUpIcon },
  { name: "Nhập Liệu Bán Hàng", href: "/sales-input", icon: DocumentTextIcon },
  { name: "Báo Cáo Lệch Kho", href: "/variance-report", icon: ChartBarIcon },
  { name: "Xuất File Kiểm Kho", href: "/export-reports", icon: DocumentTextIcon },
  { name: "Debug & Test", href: "/debug", icon: CogIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Mobile close button */}
      {onClose && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            type="button"
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
            onClick={onClose}
          >
            <item.icon
              className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200`}
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500 text-center">
          <p>Inventory Operation v1.0</p>
          <p className="mt-1">© 2024 F&B Management</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
