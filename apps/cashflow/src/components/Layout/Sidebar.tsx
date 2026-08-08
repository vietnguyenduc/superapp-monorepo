import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AddButton from "../UI/AddButton";
import Button from "../UI/Button";
import AppSwitcher from "./AppSwitcher";
import { useAuthContext } from "@superapp/iam";
import { CompanyBadge } from "@superapp/iam";
import { supabase } from "../../services/supabase";
import { clearTrialStore } from "../../services/trialMockStore";
import { logger } from "../../utils/logger";
import { canImportCustomers, canImportTransactions } from "../../utils/permissions";

// Preload lazy route chunks on hover so navigation feels instant on click.
// The import() is cached by the bundler — clicking later reuses the same chunk.
const routePrefetch: Record<string, () => Promise<unknown>> = {
  "/dashboard": () => import("../../pages/Dashboard/Dashboard"),
  "/customers": () => import("../../pages/Customers/CustomerList"),
  "/transactions": () => import("../../pages/Transactions/TransactionList"),
  "/settings": () => import("../../pages/Settings/Settings"),
  "/manual": () => import("../../pages/Manual/Manual"),
};

interface MenuItem {
  path: string;
  name: string;
  icon: React.ReactNode;
  hasAddButton?: boolean;
  addAction?: () => void;
}

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user } = useAuthContext();

  const displayName =
    user?.full_name || user?.email || (i18n.language === "vi" ? "Người dùng" : "User");
  const avatarInitial =
    displayName?.trim()?.charAt(0)?.toUpperCase() || "U";

  const handleLanguageChange = () => {
    const next = i18n.language === "en" ? "vi" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("language", next);
  };

  const handleLogout = async () => {
    try {
      clearTrialStore();
      await supabase.auth.signOut();
    } catch (error) {
      logger.error("Error logging out:", error);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const showImportCustomers = user ? canImportCustomers(user) : false;
  const showImportTransactions = user ? canImportTransactions(user) : false;

  const menuItems: MenuItem[] = [
    {
      path: "/dashboard",
      name: t("navigation.dashboard"),
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
          />
        </svg>
      ),
    },
    {
      path: "/customers",
      name: t("navigation.customers"),
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      hasAddButton: showImportCustomers,
      addAction: () => navigate("/import/customers"),
    },
    {
      path: "/transactions",
      name: t("navigation.transactions"),
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      hasAddButton: showImportTransactions,
      addAction: () => navigate("/import/transactions"),
    },
    {
      path: "/settings",
      name: t("navigation.settings"),
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      path: "/manual",
      name: t("navigation.manual", { defaultValue: "Sổ hướng dẫn" }),
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-80 bg-white dark:bg-gray-900 shadow-sm border-r border-gray-200 dark:border-gray-700 min-h-screen no-scrollbar overflow-y-auto">
      {/* Mobile close button */}
      {onClose && (
        <div className="lg:hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
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

          {/* Mobile drawer header: profile, company, app switcher, language, logout */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
                {avatarInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email || ""}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <CompanyBadge />
                <div className="relative">
                  <AppSwitcher />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleLanguageChange}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 text-xs font-semibold border border-gray-300 dark:border-gray-600 shadow-sm transition-colors"
                >
                  {i18n.language === "en" ? "ENG" : "VI"}
                </button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                >
                  {t("common.logout")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-5">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <div
              key={item.path}
              className="flex items-center justify-between gap-3 group"
            >
              <a
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                  if (onClose) onClose();
                }}
                onMouseEnter={() => {
                  // Prefetch the route chunk on hover so click navigation is instant
                  routePrefetch[item.path]?.();
                }}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-base font-semibold transition-colors flex-1 ${
                  location.pathname === item.path
                    ? "bg-blue-50 text-blue-700 dark:bg-gray-700 dark:text-white"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </a>
              {item.hasAddButton && (
                <div className="ml-2 flex-shrink-0 flex">
                  <AddButton
                    onClick={() => {
                      item.addAction?.();
                      if (onClose) onClose();
                    }}
                    title={t("common.add")}
                    showShine={item.path === "/transactions"}
                    variant={item.path === "/customers" ? "plain" : "default"}
                  />
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
