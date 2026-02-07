import React, { useState, useEffect } from "react";
import { ErrorFallback } from "../../components/UI/FallbackUI";
import ToggleSwitch from "../../components/UI/ToggleSwitch";
import Button from "../../components/UI/Button";
import PageHeader from "../../components/UI/PageHeader";
import { databaseService } from "../../services/database";

interface Tab {
  id: string;
  name: string;
  icon: string;
}

interface TransactionType {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  accountName: string;
  balance: number;
  isActive: boolean;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

interface CustomerField {
  id: string;
  name: string;
  type: string;
  isRequired: boolean;
  isActive: boolean;
}

const colorOptions = [
  { value: "blue", class: "bg-blue-100 text-blue-800" },
  { value: "green", class: "bg-green-100 text-green-800" },
  { value: "yellow", class: "bg-yellow-100 text-yellow-800" },
  { value: "red", class: "bg-red-100 text-red-800" },
  { value: "purple", class: "bg-purple-100 text-purple-800" },
];

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [activeTab, setActiveTab] = useState("appearance");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([
    { id: "1", name: "Thanh toán", color: "green", isActive: true },
    { id: "2", name: "Cho nợ", color: "red", isActive: true },
    { id: "3", name: "Điều chỉnh", color: "yellow", isActive: true },
    { id: "4", name: "Hoàn tiền", color: "blue", isActive: true },
  ]);
  const [customerFields, setCustomerFields] = useState<CustomerField[]>([
    { id: "1", name: "Họ và tên", type: "text", isRequired: true, isActive: true },
    { id: "2", name: "Email", type: "email", isRequired: false, isActive: true },
    { id: "3", name: "Số điện thoại", type: "tel", isRequired: true, isActive: true },
    { id: "4", name: "Địa chỉ", type: "text", isRequired: false, isActive: true },
  ]);

  // Apply dark mode to document
  useEffect(() => {
    console.log('Dark mode changed to:', darkMode);
    console.log('Current document classes:', document.documentElement.className);
    if (darkMode) {
      document.documentElement.classList.add('dark');
      console.log('Added dark class to document');
      // Force a re-render to ensure styles are applied
      document.body.style.backgroundColor = '#111827';
      document.body.style.color = '#f3f4f6';
    } else {
      document.documentElement.classList.remove('dark');
      console.log('Removed dark class from document');
      // Force a re-render to ensure styles are applied
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#213547';
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    console.log('Saved dark mode to localStorage:', darkMode);
  }, [darkMode]);

  // Load data from database service
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load bank accounts
        const bankAccountsResponse = await databaseService.bankAccounts.getBankAccounts();
        if (bankAccountsResponse.error) {
          throw new Error(bankAccountsResponse.error);
        }

        const formattedBankAccounts = bankAccountsResponse.data?.map((account: any) => ({
          id: account.id,
          bankName: account.bank_name,
          accountNumber: account.account_number,
          accountType: getAccountType(account.account_name),
          accountName: account.account_name,
          balance: account.balance,
          isActive: account.is_active,
        })) || [];

        setBankAccounts(formattedBankAccounts);

        // Load branches
        const branchesResponse = await databaseService.branches.getBranches();
        if (branchesResponse.error) {
          throw new Error(branchesResponse.error);
        }

        const formattedBranches = branchesResponse.data?.map((branch: any) => ({
          id: branch.id,
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          isActive: branch.is_active,
        })) || [];

        setBranches(formattedBranches);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper function to get account type from account name
  const getAccountType = (accountName: string): string => {
    if (accountName.toLowerCase().includes("checking")) return "Checking";
    if (accountName.toLowerCase().includes("savings")) return "Savings";
    if (accountName.toLowerCase().includes("business")) return "Business";
    if (accountName.toLowerCase().includes("credit")) return "Credit";
    return "Other";
  };

  // Helper function to get color class for transaction type
  const getColorClass = (color: string) => {
    const colorOption = colorOptions.find((opt) => opt.value === color);
    return colorOption?.class || "bg-gray-100 text-gray-800";
  };

  const handleToggleActive = (type: string, id: string) => {
    switch (type) {
      case "transaction-type":
        setTransactionTypes((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item
          )
        );
        break;
      case "bank-account":
        setBankAccounts((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item
          )
        );
        break;
      case "branch":
        setBranches((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item
          )
        );
        break;
      case "customer-field":
        setCustomerFields((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item
          )
        );
        break;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorFallback
            title="Lỗi cấu hình"
            message={error}
            retry={() => setError(null)}
          />
        </div>
      </div>
    );
  }

  const tabs: Tab[] = [
    { id: "appearance", name: "Giao diện", icon: "🎨" },
    { id: "transaction-types", name: "Loại giao dịch", icon: "💳" },
    { id: "bank-accounts", name: "Tài khoản ngân hàng", icon: "🏦" },
    { id: "branches", name: "Văn phòng", icon: "🏢" },
    { id: "customer-fields", name: "Trường khách hàng", icon: "�" },
    { id: "data", name: "Dữ liệu", icon: "💾" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Cài đặt hệ thống"
          subtitle="Quản lý cấu hình cơ bản cho hệ thống quản lý công nợ"
        />

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-600 mb-6 sm:mb-8 overflow-x-auto">
          <nav className="flex space-x-1 sm:space-x-8 min-w-max px-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <span className="mr-1 sm:mr-2">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {/* Appearance Settings */}
          {activeTab === "appearance" && (
            <div className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Giao diện
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Tùy chỉnh giao diện ứng dụng theo sở thích của bạn
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Dark Mode Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-gray-600 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20.354 15.354A9 9 0 018.182 0l-5.646 5.646a9 9 0 01-12.728 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10h1"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Chế độ tối
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Chuyển đổi giữa giao diện sáng và tối
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={darkMode}
                    onChange={(checked) => {
                      console.log('Toggle switch changed to:', checked);
                      setDarkMode(checked);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Transaction Types */}
          {activeTab === "transaction-types" && (
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Loại giao dịch
                </h2>
                <Button variant="primary" size="sm" className="w-full sm:w-auto">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Thêm loại mới
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {transactionTypes.map((type) => (
                  <div
                    key={type.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getColorClass(type.color)}`}>
                        {type.name}
                      </span>
                      <ToggleSwitch
                        checked={type.isActive}
                        onChange={() => handleToggleActive("transaction-type", type.id)}
                        size="sm"
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {type.isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bank Accounts */}
          {activeTab === "bank-accounts" && (
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Tài khoản ngân hàng
                </h2>
                <Button variant="primary" size="sm" className="w-full sm:w-auto">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Thêm tài khoản
                </Button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {bankAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-blue-600 dark:text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {account.accountName}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {account.bankName} • {account.accountNumber}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {account.accountType}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(account.balance)}
                        </div>
                        <ToggleSwitch
                          checked={account.isActive}
                          onChange={() => handleToggleActive("bank-account", account.id)}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Branches */}
          {activeTab === "branches" && (
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Văn phòng
                </h2>
                <Button variant="primary" size="sm" className="w-full sm:w-auto">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Thêm văn phòng
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {branch.name}
                      </h3>
                      <ToggleSwitch
                        checked={branch.isActive}
                        onChange={() => handleToggleActive("branch", branch.id)}
                        size="sm"
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <p>{branch.address}</p>
                      <p>{branch.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer Fields */}
          {activeTab === "customer-fields" && (
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Trường khách hàng
                </h2>
                <Button variant="primary" size="sm" className="w-full sm:w-auto">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Thêm trường
                </Button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {customerFields.map((field) => (
                  <div
                    key={field.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-purple-600 dark:text-purple-400"
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
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {field.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {field.type}
                            </span>
                            {field.isRequired && (
                              <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                                Bắt buộc
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <ToggleSwitch
                          checked={field.isActive}
                          onChange={() => handleToggleActive("customer-field", field.id)}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Settings */}
          {activeTab === "data" && (
            <div className="p-4 sm:p-6">
              <div className="mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Dữ liệu
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Quản lý dữ liệu và sao lưu
                </p>
              </div>

              <div className="space-y-6">
                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Sao lưu dữ liệu
                  </h3>
                  <div className="space-y-3">
                    <Button variant="primary" className="w-full sm:w-auto">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Sao lưu ngay
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Sao lưu cuối cùng: Chưa có
                    </p>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Xuất dữ liệu
                  </h3>
                  <div className="space-y-3">
                    <Button variant="secondary" className="w-full sm:w-auto">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Xuất CSV
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function for formatting currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default Settings;
