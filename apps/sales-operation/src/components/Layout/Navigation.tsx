import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuthContext } from "@superapp/iam";
import { useCompany } from "../../contexts/CompanyContext";
import AppSwitcher from "./AppSwitcher";

interface NavigationProps {
  onMenuClick: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onMenuClick }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, signOut, isTrial } = useAuthContext();
  const { selectedCompany } = useCompany();
  const navigate = useNavigate();
  const appSwitcherTarget = import.meta.env.VITE_APP_SWITCHER_TARGET;
  const canSwitchCompany = user?.role === "admin_master" || user?.role === "admin";

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const displayName = user?.full_name || user?.email || "Người dùng";
  const avatarInitial = displayName.trim().charAt(0).toUpperCase();

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 transition-colors duration-300">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={onMenuClick}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center ml-4 lg:ml-0">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Sales Operation
                </h1>
              </div>
              <div className="hidden md:block ml-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Quản lý Bán hàng & Công nợ
                </span>
              </div>
            </div>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-4">
            {canSwitchCompany && (
              <button
                onClick={() => navigate("/company-selector")}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-2 text-white shadow-sm transition-all duration-200 hover:from-indigo-600 hover:to-purple-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="hidden sm:inline max-w-[140px] truncate text-sm font-medium">
                  {selectedCompany?.name || "Chọn công ty"}
                </span>
              </button>
            )}
            <AppSwitcher />
            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center space-x-2 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-sm transition-colors"
                >
                  <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">
                      {avatarInitial}
                    </span>
                  </div>
                  <span className="hidden sm:inline text-sm text-gray-800 dark:text-gray-200 font-medium truncate max-w-[140px]">
                    {displayName}
                  </span>
                  <svg
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black/5 py-1 z-50 border border-gray-200 dark:border-gray-700">
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Hồ sơ
                    </Link>
                    <Link
                      to="/help"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Trợ giúp
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
                <div className="hidden lg:block text-right mr-3 absolute -left-44 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate w-40">
                    {displayName}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    {user.role}{isTrial ? " (Trial Mode)" : ""}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
