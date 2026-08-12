import type { FC } from "react";
import { useSettingsState } from "./useSettingsState";
import { SettingsProvider, useSettingsContext } from "./SettingsContext";
import { ErrorFallback, LoadingFallback } from "../../components/UI/FallbackUI";
import PageHeader from "../../components/UI/PageHeader";
import { AppearanceTab } from "./components/tabs/AppearanceTab";
import { OpeningBalanceTab } from "./components/tabs/OpeningBalanceTab";
import { TransactionConfigTab } from "./components/tabs/TransactionConfigTab";
import { BankAccountsTab } from "./components/tabs/BankAccountsTab";
import { BranchesTab } from "./components/tabs/BranchesTab";
import { CustomerFieldsTab } from "./components/tabs/CustomerFieldsTab";
import { SystemTab } from "./components/tabs/SystemTab";
import { BackupTab } from "./components/tabs/BackupTab";

const TabIcon = ({ id, className = "w-5 h-5" }: { id: string; className?: string }) => {
  const icons: Record<string, JSX.Element> = {
    appearance: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />,
    "opening-balance": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 0V3m0 2H7m0 0V3m0 2h10" />,
    backup: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5l-4-4m0 0l-4 4m4-4v12" />,
    "bank-accounts": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />,
    branches: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
    "customer-fields": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    "transaction-config": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12m0 0h1" />,
    system: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
  };
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      {icons[id] || icons.appearance}
    </svg>
  );
};

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

        <div className="mb-3 sm:mb-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2" role="tablist" aria-label="Cài đặt hệ thống">
            {s.tabs.map((tab) => {
              const active = s.activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => s.setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center gap-1 min-h-[64px] p-2 rounded-lg border text-center transition ${
                    active
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-400 shadow-sm"
                      : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <TabIcon id={tab.id} className={`w-4 h-4 shrink-0 ${active ? "text-blue-600 dark:text-blue-200" : "text-gray-500 dark:text-gray-300"}`} />
                  <span className="text-[10px] sm:text-xs font-medium leading-tight line-clamp-2">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {s.activeTab === "appearance" && <AppearanceTab />}
          {s.activeTab === "opening-balance" && <OpeningBalanceTab />}
          {s.activeTab === "transaction-config" && <TransactionConfigTab />}
          {s.activeTab === "bank-accounts" && <BankAccountsTab />}
          {s.activeTab === "branches" && <BranchesTab />}
          {s.activeTab === "customer-fields" && <CustomerFieldsTab />}
          {s.activeTab === "system" && <SystemTab />}
          {s.activeTab === "backup" && <BackupTab />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
