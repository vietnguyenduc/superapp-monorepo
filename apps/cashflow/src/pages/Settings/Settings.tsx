import type { FC } from "react";
import { useSettingsState } from "./useSettingsState";
import { SettingsProvider, useSettingsContext } from "./SettingsContext";
import { ErrorFallback, LoadingFallback } from "../../components/UI/FallbackUI";
import PageHeader from "../../components/UI/PageHeader";
import { AppearanceTab } from "./components/tabs/AppearanceTab";
import { IntegrationTab } from "./components/tabs/IntegrationTab";
import { OpeningBalanceTab } from "./components/tabs/OpeningBalanceTab";
import { TransactionTypesTab } from "./components/tabs/TransactionTypesTab";
import { BalanceFormulaTab } from "./components/tabs/BalanceFormulaTab";
import { BankAccountsTab } from "./components/tabs/BankAccountsTab";
import { BranchesTab } from "./components/tabs/BranchesTab";
import { CustomerFieldsTab } from "./components/tabs/CustomerFieldsTab";
import { UsersTab } from "./components/tabs/UsersTab";
import { BackupTab } from "./components/tabs/BackupTab";

const Settings: FC = () => {
  const settings = useSettingsState();
  return (
    <SettingsProvider value={settings}>
      <SettingsContent />
    </SettingsProvider>
  );
};

const SettingsContent: FC = () => {
  const s = useSettingsContext();

  if (s.loading) {
    return (
      <LoadingFallback
        title="Đang tải cài đặt"
        message="Vui lòng chờ trong giây lát"
      />
    );
  }

  if (s.error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorFallback
            title="Lỗi cấu hình"
            message={s.error}
            retry={() => s.setError(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <PageHeader
          title="Cài đặt hệ thống"
          subtitle="Quản lý cấu hình cơ bản cho hệ thống quản lý công nợ"
        />

        {s.successMessage && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">{s.successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="border-b border-gray-200 dark:border-gray-600 mb-2 sm:mb-4 overflow-x-auto">
          <nav className="flex space-x-1 sm:space-x-8 min-w-max px-1">
            {s.tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => s.setActiveTab(tab.id)}
                className={`py-2 px-3 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  s.activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <span className="mr-1 sm:mr-2">{tab.icon}</span>
                <span className="text-[11px] sm:text-sm leading-tight">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {s.activeTab === "appearance" && <AppearanceTab />}
          {s.activeTab === "integration" && <IntegrationTab />}
          {s.activeTab === "opening-balance" && <OpeningBalanceTab />}
          {s.activeTab === "transaction-types" && <TransactionTypesTab />}
          {s.activeTab === "balance-formula" && <BalanceFormulaTab />}
          {s.activeTab === "bank-accounts" && <BankAccountsTab />}
          {s.activeTab === "branches" && <BranchesTab />}
          {s.activeTab === "customer-fields" && <CustomerFieldsTab />}
          {s.activeTab === "users" && <UsersTab />}
          {s.activeTab === "backup" && <BackupTab />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
