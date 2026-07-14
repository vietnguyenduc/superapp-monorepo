import React, { useState, useRef, useEffect } from "react";
import { useAuthContext } from "../contexts/AuthProvider";
import { useCompany } from "../contexts/CompanyContext";

interface CompanyBadgeProps {
  /**
   * Optional custom label for the "all companies" mode (admin_master only).
   * Defaults to "All Companies (Consolidated)".
   */
  allCompaniesLabel?: string;
}

/**
 * A compact company context indicator for use in any app's navigation bar.
 *
 * - **admin_master**: Shows current company name + dropdown to switch.
 * - **Other roles**: Shows their assigned company (auto-selected from user profile,
 *   non-interactive).
 * - **No user / loading**: Returns null (graceful degradation).
 */
const CompanyBadge: React.FC<CompanyBadgeProps> = ({
  allCompaniesLabel = "All Companies (Consolidated)",
}) => {
  const { user } = useAuthContext();
  const {
    companies,
    selectedCompany,
    setSelectedCompany,
    loading,
  } = useCompany();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-select the user's assigned company for non-admin_master roles
  useEffect(() => {
    if (!user || !companies.length) return;
    if (user.role === "admin_master") {
      // admin_master: respect existing selection from localStorage (already handled by CompanyProvider)
      // If nothing selected yet, default to first company
      if (!selectedCompany && companies.length > 0) {
        setSelectedCompany(companies[0]);
      }
      return;
    }
    // Non-admin: auto-select their assigned company
    if (user.company_id) {
      const assigned = companies.find((c) => c.id === user.company_id);
      if (assigned && assigned.id !== selectedCompany?.id) {
        setSelectedCompany(assigned);
      }
    }
  }, [user, companies, selectedCompany, setSelectedCompany]);

  // Don't render while loading or without context
  if (loading || !user || !companies.length) {
    return null;
  }

  const displayName = selectedCompany?.name || "—";
  const isAdminMaster = user.role === "admin_master";
  const canSwitch = isAdminMaster && companies.length > 1;

  // Non-admin: just render a static badge
  if (!isAdminMaster) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
        <svg
          className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[120px]">
          {displayName}
        </span>
      </div>
    );
  }

  // Admin: interactive dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-sm"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <span className="text-xs font-semibold truncate max-w-[120px]">
          {displayName}
        </span>
        {canSwitch && (
          <svg
            className={`w-3 h-3 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && canSwitch && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-[300] max-h-72 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
            Switch Company
          </div>
          {companies.map((company) => {
            const isSelected = selectedCompany?.id === company.id;
            return (
              <button
                key={company.id}
                onClick={() => {
                  setSelectedCompany(company);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 ${
                  isSelected ? "bg-indigo-50 dark:bg-indigo-900/30" : ""
                }`}
              >
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {company.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {company.name}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {company.code}
                  </div>
                </div>
                {isSelected && (
                  <svg
                    className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompanyBadge;
