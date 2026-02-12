import React from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import UserRoleSwitcher from "../auth/UserRoleSwitcher";

interface NavigationProps {
  onMenuClick: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onMenuClick }) => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={onMenuClick}
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            
            {/* Logo and title */}
            <div className="flex items-center ml-4 lg:ml-0">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  Inventory Operation
                </h1>
              </div>
              <div className="hidden md:block ml-4">
                <span className="text-sm text-gray-500">
                  Quản lý Xuất Nhập Tồn F&B
                </span>
              </div>
            </div>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-4">
            {/* User Role Switcher */}
            <UserRoleSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
