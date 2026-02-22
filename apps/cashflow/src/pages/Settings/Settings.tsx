import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { ErrorFallback, LoadingFallback } from "../../components/UI/FallbackUI";
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
  openingBalance?: number;
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
  isDefault?: boolean;
}

interface OpeningBalanceRow {
  customer_code: string;
  opening_balance: number;
}

const colorOptions = [
  {
    value: "blue",
    class: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  },
  {
    value: "green",
    class: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  },
  {
    value: "yellow",
    class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
  },
  {
    value: "red",
    class: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  },
  {
    value: "purple",
    class: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
  },
];

const TRANSACTION_TYPES_KEY = "cashflow_transaction_types";

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [activeTab, setActiveTab] = useState("appearance");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isBankAccountModalOpen, setIsBankAccountModalOpen] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
  const [bankAccountForm, setBankAccountForm] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    accountType: "",
    openingBalance: "",
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([
    { id: "1", name: "Thanh toán", color: "green", isActive: true },
    { id: "2", name: "Cho nợ", color: "red", isActive: true },
    { id: "3", name: "Điều chỉnh", color: "yellow", isActive: true },
    { id: "4", name: "Hoàn tiền", color: "blue", isActive: true },
  ]);
  const [isTransactionTypeModalOpen, setIsTransactionTypeModalOpen] = useState(false);
  const [editingTransactionType, setEditingTransactionType] = useState<TransactionType | null>(null);
  const [transactionTypeForm, setTransactionTypeForm] = useState({
    name: "",
    color: "blue",
  });
  const [customerFields, setCustomerFields] = useState<CustomerField[]>([
    { id: "1", name: "Họ và tên", type: "text", isRequired: true, isActive: true, isDefault: true },
    { id: "2", name: "Email", type: "email", isRequired: false, isActive: true, isDefault: true },
    { id: "3", name: "Số điện thoại", type: "tel", isRequired: true, isActive: true, isDefault: true },
    { id: "4", name: "Địa chỉ", type: "text", isRequired: false, isActive: true, isDefault: true },
  ]);
  const [isCustomerFieldModalOpen, setIsCustomerFieldModalOpen] = useState(false);
  const [editingCustomerField, setEditingCustomerField] = useState<CustomerField | null>(null);
  const [customerFieldForm, setCustomerFieldForm] = useState({
    name: "",
    type: "text",
    isRequired: false,
  });
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState({
    name: "",
    address: "",
    phone: "",
  });

  // Opening balance import state
  const [openingFile, setOpeningFile] = useState<File | null>(null);
  const [openingRows, setOpeningRows] = useState<OpeningBalanceRow[]>([]);
  const [openingErrors, setOpeningErrors] = useState<string[]>([]);
  const [openingSuccess, setOpeningSuccess] = useState<string | null>(null);
  const [isOpeningProcessing, setIsOpeningProcessing] = useState(false);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({});

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
    const storedTypes = localStorage.getItem(TRANSACTION_TYPES_KEY);
    if (storedTypes) {
      try {
        const parsed = JSON.parse(storedTypes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTransactionTypes(parsed);
        }
      } catch (err) {
        console.error("Failed to parse stored transaction types", err);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(TRANSACTION_TYPES_KEY, JSON.stringify(transactionTypes));
  }, [transactionTypes]);

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
          openingBalance: account.opening_balance ?? 0,
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

        // Load customers for opening balance preview
        const customersResponse = await databaseService.customers.getCustomers({ limit: 1000 });
        if (customersResponse?.data) {
          const map: Record<string, string> = {};
          customersResponse.data.forEach((c: any) => {
            if (c?.customer_code) map[String(c.customer_code)] = c.full_name || c.customer_name || c.name || "";
          });
          setCustomerMap(map);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleEditBankAccount = (account: BankAccount) => {
    setEditingBankAccount(account);
    setBankAccountForm({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      accountType: account.accountType,
      openingBalance: String(account.openingBalance ?? 0),
    });
    setIsBankAccountModalOpen(true);
  };

  const handleResetData = () => {
    const confirmation = window.prompt(
      "Nhập CONFIRM để xóa toàn bộ dữ liệu và đặt lại hệ thống",
      "",
    );
    if (confirmation !== "CONFIRM") {
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.removeItem("cashflow_customers");
      window.localStorage.removeItem("cashflow_transactions");
      window.localStorage.removeItem("cashflow_bank_accounts");
    }
    window.location.reload();
  };

  const handleBankAccountFormChange = (
    field: "bankName" | "accountNumber" | "accountName" | "accountType" | "openingBalance",
    value: string,
  ) => {
    setBankAccountForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveBankAccount = () => {
    const openingBalanceValue = bankAccountForm.openingBalance.trim();
    const parsedOpeningBalance = openingBalanceValue ? Number(openingBalanceValue) : undefined;

    if (editingBankAccount) {
      const previousOpening = Number(editingBankAccount.openingBalance ?? 0);
      const nextOpening = Number.isFinite(parsedOpeningBalance)
        ? Number(parsedOpeningBalance)
        : previousOpening;
      const nextBalance = Math.max(0, editingBankAccount.balance + (nextOpening - previousOpening));
      setBankAccounts((prev) => {
        const next = prev.map((account) =>
          account.id === editingBankAccount.id
            ? {
                ...account,
                bankName: bankAccountForm.bankName.trim(),
                accountNumber: bankAccountForm.accountNumber.trim(),
                accountName: bankAccountForm.accountName.trim(),
                accountType: bankAccountForm.accountType.trim(),
                openingBalance: nextOpening,
                balance: nextBalance,
              }
            : account,
        );
        if (typeof window !== "undefined") {
          window.localStorage.setItem("cashflow_bank_accounts", JSON.stringify(next));
        }
        return next;
      });
    } else {
      const openingBalance = Number.isFinite(parsedOpeningBalance)
        ? Number(parsedOpeningBalance)
        : 0;
      const nextAccount: BankAccount = {
        id: `bank-${Date.now()}`,
        bankName: bankAccountForm.bankName.trim() || "Ngan hang moi",
        accountNumber: bankAccountForm.accountNumber.trim(),
        accountName: bankAccountForm.accountName.trim() || "Tai khoan moi",
        accountType: bankAccountForm.accountType.trim() || "Other",
        balance: openingBalance,
        openingBalance,
        isActive: true,
      };
      setBankAccounts((prev) => {
        const next = [nextAccount, ...prev];
        if (typeof window !== "undefined") {
          window.localStorage.setItem("cashflow_bank_accounts", JSON.stringify(next));
        }
        return next;
      });
    }
    setIsBankAccountModalOpen(false);
    setEditingBankAccount(null);
  };

  const handleAddTransactionType = () => {
    setEditingTransactionType(null);
    setTransactionTypeForm({ name: "", color: "blue" });
    setIsTransactionTypeModalOpen(true);
  };

  const handleEditTransactionType = (type: TransactionType) => {
    setEditingTransactionType(type);
    setTransactionTypeForm({ name: type.name, color: type.color });
    setIsTransactionTypeModalOpen(true);
  };

  const handleSaveTransactionType = () => {
    const name = transactionTypeForm.name.trim();
    if (!name) return;

    if (editingTransactionType) {
      setTransactionTypes((prev) =>
        prev.map((item) =>
          item.id === editingTransactionType.id
            ? { ...item, name, color: transactionTypeForm.color }
            : item,
        ),
      );
    } else {
      setTransactionTypes((prev) => [
        {
          id: `type-${Date.now()}`,
          name,
          color: transactionTypeForm.color,
          isActive: true,
        },
        ...prev,
      ]);
    }
    setIsTransactionTypeModalOpen(false);
    setEditingTransactionType(null);
  };

  const handleEditCustomerField = (field: CustomerField) => {
    setEditingCustomerField(field);
    setCustomerFieldForm({
      name: field.name,
      type: field.type,
      isRequired: field.isRequired,
    });
    setIsCustomerFieldModalOpen(true);
  };

  const handleDeleteCustomerField = (field: CustomerField) => {
    if (field.isDefault) {
      window.alert("Trường mặc định không thể xóa.");
      return;
    }
    const confirmation = window.confirm(
      `Xóa trường "${field.name}"? Thao tác này không thể hoàn tác.`,
    );
    if (!confirmation) return;
    setCustomerFields((prev) => prev.filter((item) => item.id !== field.id));
  };

  const handleAddCustomerField = () => {
    setEditingCustomerField(null);
    setCustomerFieldForm({ name: "", type: "text", isRequired: false });
    setIsCustomerFieldModalOpen(true);
  };

  const handleSaveCustomerField = () => {
    const name = customerFieldForm.name.trim();
    if (!name) return;
    const type = customerFieldForm.type.trim() || "text";

    if (editingCustomerField) {
      setCustomerFields((prev) =>
        prev.map((item) =>
          item.id === editingCustomerField.id
            ? {
                ...item,
                name,
                type,
                isRequired: customerFieldForm.isRequired,
              }
            : item,
        ),
      );
    } else {
      setCustomerFields((prev) => [
        {
          id: `field-${Date.now()}`,
          name,
          type,
          isRequired: customerFieldForm.isRequired,
          isActive: true,
          isDefault: false,
        },
        ...prev,
      ]);
    }

    setIsCustomerFieldModalOpen(false);
    setEditingCustomerField(null);
  };

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
            item.id === id ? { ...item, isActive: !item.isActive } : item,
          ),
        );
        break;
      case "bank-account":
        setBankAccounts((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item,
          ),
        );
        break;
      case "branch":
        setBranches((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item,
          ),
        );
        break;
      case "customer-field":
        setCustomerFields((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item,
          ),
        );
        break;
    }
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchForm({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
    });
    setIsBranchModalOpen(true);
  };

  const handleAddBranch = () => {
    setEditingBranch(null);
    setBranchForm({ name: "", address: "", phone: "" });
    setIsBranchModalOpen(true);
  };

  const handleDeleteBranch = (branchId: string) => {
    setBranches((prev) => prev.filter((branch) => branch.id !== branchId));
  };

  const handleBranchFormChange = (
    field: "name" | "address" | "phone",
    value: string,
  ) => {
    setBranchForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveBranch = () => {
    if (editingBranch) {
      setBranches((prev) =>
        prev.map((branch) =>
          branch.id === editingBranch.id
            ? { ...branch, ...branchForm }
            : branch,
        ),
      );
    } else {
      const nextBranch: Branch = {
        id: `branch-${Date.now()}`,
        name: branchForm.name.trim() || "Van phong moi",
        address: branchForm.address.trim(),
        phone: branchForm.phone.trim(),
        isActive: true,
      };
      setBranches((prev) => [nextBranch, ...prev]);
    }
    setIsBranchModalOpen(false);
    setEditingBranch(null);
  };

  // Opening balance helpers
  const handleDownloadOpeningTemplate = () => {
    const rows = [
      { customer_code: "CUST0001", opening_balance: 1000000 },
      { customer_code: "CUST0002", opening_balance: 2500000 },
      { customer_code: "CUST0003", opening_balance: 500000 },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "OpeningBalances");
    XLSX.writeFile(wb, "opening_balance_template.xlsx");
  };

  const handleOpeningFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setOpeningSuccess(null);
    if (!file) return;
    setOpeningFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) return;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];
        const errors: string[] = [];
        const parsed: OpeningBalanceRow[] = [];
        json.forEach((row, idx) => {
          const code = String(row.customer_code || row.code || "").trim();
          const opening = Number(row.opening_balance ?? row.balance ?? "");
          if (!code) {
            errors.push(`Dòng ${idx + 2}: Thiếu customer_code`);
            return;
          }
          if (!Number.isFinite(opening)) {
            errors.push(`Dòng ${idx + 2}: opening_balance không hợp lệ`);
            return;
          }
          parsed.push({ customer_code: code, opening_balance: opening });
        });
        setOpeningErrors(errors);
        setOpeningRows(parsed);
      } catch (err) {
        console.error("Failed to parse opening balance file", err);
        setOpeningErrors(["Không đọc được file. Vui lòng kiểm tra định dạng."]);
        setOpeningRows([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportOpeningBalance = async () => {
    if (openingRows.length === 0) return;
    setIsOpeningProcessing(true);
    setOpeningSuccess(null);
    try {
      const res = await databaseService.customers.bulkUpdateOpeningBalances(openingRows);
      if (res.errors && res.errors.length > 0) {
        const errs = res.errors.map((e: any) => {
          const msg = e.message === "Customer not found" ? "Không tìm thấy khách hàng" : e.message;
          return `Dòng ${e.row + 2}: ${msg}${e.value ? ` (${e.value})` : ""}`;
        });
        setOpeningErrors(errs);
      } else {
        setOpeningErrors([]);
      }
      setOpeningSuccess(`Đã cập nhật ${res.data?.updated || 0} khách hàng.`);
    } catch (err) {
      console.error("Import opening balance failed", err);
      setOpeningErrors(["Có lỗi khi nhập số dư. Vui lòng thử lại."]);
    } finally {
      setIsOpeningProcessing(false);
    }
  };

  const handleAddBankAccount = () => {
    setEditingBankAccount(null);
    setBankAccountForm({
      bankName: "",
      accountNumber: "",
      accountName: "",
      accountType: "",
      openingBalance: "",
    });
    setIsBankAccountModalOpen(true);
  };

  const tabs: Tab[] = useMemo(
    () => [
      { id: "appearance", name: "Giao diện", icon: "🎨" },
      { id: "transaction-types", name: "Loại giao dịch", icon: "💳" },
      { id: "bank-accounts", name: "Tài khoản ngân hàng", icon: "🏦" },
      { id: "branches", name: "Văn phòng", icon: "🏢" },
      { id: "customer-fields", name: "Trường khách hàng", icon: "🧾" },
      { id: "data", name: "Dữ liệu", icon: "💾" },
      { id: "opening-balance", name: "Số dư đầu kỳ", icon: "📥" },
    ],
    [],
  );

  if (loading) {
    return (
      <LoadingFallback
        title="Đang tải cài đặt"
        message="Vui lòng chờ trong giây lát"
      />
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <PageHeader
          title="Cài đặt hệ thống"
          subtitle="Quản lý cấu hình cơ bản cho hệ thống quản lý công nợ"
        />

        <div className="border-b border-gray-200 dark:border-gray-600 mb-2 sm:mb-4 overflow-x-auto">
          <nav className="flex space-x-1 sm:space-x-8 min-w-max px-1">
            {tabs.map((tab: Tab) => (
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
                <span className="text-[11px] sm:text-sm leading-tight">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {/* Appearance Settings */}
          {activeTab === "appearance" && (
            <div className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Giao diện</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Tùy chỉnh giao diện ứng dụng theo sở thích của bạn</p>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.182 0l-5.646 5.646a9 9 0 01-12.728 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10h1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Chế độ tối</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Chuyển đổi giữa giao diện sáng và tối</p>
                    </div>
                  </div>
                  <ToggleSwitch checked={darkMode} onChange={setDarkMode} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "opening-balance" && (
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Nhập số dư đầu kỳ</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Tải file mẫu, điền customer_code và opening_balance, sau đó import.</p>
                </div>
                <Button variant="primary" size="sm" onClick={handleDownloadOpeningTemplate}>Tải file mẫu</Button>
              </div>

              <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">Chọn file Excel/CSV (cột: customer_code, opening_balance)</p>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleOpeningFile} className="text-sm" />
                {openingFile && <p className="text-xs text-gray-500 mt-1">Đã chọn: {openingFile.name}</p>}
              </div>

              {openingErrors.length > 0 && (
                <div className="border border-red-200 bg-red-50 text-red-700 rounded p-3 text-sm">
                  <p className="font-semibold mb-1">Lỗi</p>
                  <ul className="list-disc list-inside space-y-1">
                    {openingErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {openingRows.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-100">Xem trước ({openingRows.length} dòng)</div>
                  <div className="max-h-64 overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-left text-gray-700 dark:text-gray-200">
                        <tr>
                          <th className="px-3 py-2">Tên khách hàng</th>
                          <th className="px-3 py-2">customer_code</th>
                          <th className="px-3 py-2">opening_balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {openingRows.slice(0, 50).map((row, idx) => (
                          <tr key={`${row.customer_code}-${idx}`}>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{customerMap[row.customer_code] || ""}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{row.customer_code}</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{row.opening_balance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {openingRows.length > 50 && <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">Hiển thị 50 dòng đầu</div>}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <Button variant="primary" size="sm" disabled={openingRows.length === 0 || isOpeningProcessing} onClick={handleImportOpeningBalance}>
                  {isOpeningProcessing ? "Đang nhập..." : "Nhập số dư"}
                </Button>
                {openingSuccess && <p className="text-sm text-green-600">{openingSuccess}</p>}
              </div>
            </div>
          )}

          {isTransactionTypeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
              <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingTransactionType ? "Chỉnh sửa loại giao dịch" : "Thêm loại giao dịch"}
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tên loại
                    </label>
                    <input
                      type="text"
                      value={transactionTypeForm.name}
                      onChange={(e) =>
                        setTransactionTypeForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                      placeholder="Ví dụ: Thanh toán"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Màu nhãn
                    </label>
                    <select
                      value={transactionTypeForm.color}
                      onChange={(e) =>
                        setTransactionTypeForm((prev) => ({ ...prev, color: e.target.value }))
                      }
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                    >
                      {colorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsTransactionTypeModalOpen(false);
                      setEditingTransactionType(null);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveTransactionType}>
                    Lưu
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isCustomerFieldModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
              <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingCustomerField ? "Chỉnh sửa trường khách hàng" : "Thêm trường khách hàng"}
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tên trường
                    </label>
                    <input
                      type="text"
                      value={customerFieldForm.name}
                      onChange={(e) =>
                        setCustomerFieldForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                      placeholder="Ví dụ: Mã số thuế"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Loại dữ liệu
                    </label>
                    <select
                      value={customerFieldForm.type}
                      onChange={(e) =>
                        setCustomerFieldForm((prev) => ({ ...prev, type: e.target.value }))
                      }
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="tel">Số điện thoại</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={customerFieldForm.isRequired}
                      onChange={(e) =>
                        setCustomerFieldForm((prev) => ({ ...prev, isRequired: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                    />
                    Bắt buộc nhập
                  </label>
                </div>
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsCustomerFieldModalOpen(false);
                      setEditingCustomerField(null);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveCustomerField}>
                    Lưu
                  </Button>
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
                <Button variant="primary" size="sm" className="w-full sm:w-auto" onClick={handleAddTransactionType}>
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
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditTransactionType(type)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          Sửa
                        </button>
                        <ToggleSwitch
                          checked={type.isActive}
                          onChange={() => handleToggleActive("transaction-type", type.id)}
                          size="sm"
                        />
                      </div>
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
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={handleAddBankAccount}
                >
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
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleEditBankAccount(account)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            Sửa
                          </button>
                          <ToggleSwitch
                            checked={account.isActive}
                            onChange={() => handleToggleActive("bank-account", account.id)}
                            size="sm"
                          />
                        </div>
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
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={handleAddBranch}
                >
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
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditBranch(branch)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBranch(branch.id)}
                          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          Xoa
                        </button>
                        <ToggleSwitch
                          checked={branch.isActive}
                          onChange={() => handleToggleActive("branch", branch.id)}
                          size="sm"
                        />
                      </div>
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

          {isBankAccountModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
              <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingBankAccount ? "Chỉnh sửa tài khoản" : "Thêm tài khoản"}
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tên ngân hàng
                    </label>
                    <input
                      type="text"
                      value={bankAccountForm.bankName}
                      onChange={(e) => handleBankAccountFormChange("bankName", e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Số tài khoản
                    </label>
                    <input
                      type="text"
                      value={bankAccountForm.accountNumber}
                      onChange={(e) => handleBankAccountFormChange("accountNumber", e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tên tài khoản
                    </label>
                    <input
                      type="text"
                      value={bankAccountForm.accountName}
                      onChange={(e) => handleBankAccountFormChange("accountName", e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Loại tài khoản
                    </label>
                    <input
                      type="text"
                      value={bankAccountForm.accountType}
                      onChange={(e) => handleBankAccountFormChange("accountType", e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Số dư hiện tại (chỉ đọc)
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(editingBankAccount?.balance || 0)}
                      disabled
                      className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700/60 text-sm text-gray-700 dark:text-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Số dư đầu kỳ
                    </label>
                    <input
                      type="number"
                      value={bankAccountForm.openingBalance}
                      onChange={(e) => handleBankAccountFormChange("openingBalance", e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                    />
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsBankAccountModalOpen(false);
                      setEditingBankAccount(null);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveBankAccount}>
                    Lưu
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isBranchModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
              <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingBranch ? "Chỉnh sửa văn phòng" : "Thêm văn phòng"}
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ten van phong
                    </label>
                    <input
                      type="text"
                      value={branchForm.name}
                      onChange={(e) => handleBranchFormChange("name", e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dia chi
                    </label>
                    <input
                      type="text"
                      value={branchForm.address}
                      onChange={(e) => handleBranchFormChange("address", e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      So dien thoai
                    </label>
                    <input
                      type="text"
                      value={branchForm.phone}
                      onChange={(e) => handleBranchFormChange("phone", e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                    />
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsBranchModalOpen(false);
                      setEditingBranch(null);
                    }}
                  >
                    Huy
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveBranch}>
                    Luu
                  </Button>
                </div>
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
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={handleAddCustomerField}
                >
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
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditCustomerField(field)}
                          >
                            Sửa
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className={`border-red-200 text-red-600 hover:text-red-700 hover:border-red-300 ${
                              field.isDefault ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            onClick={() => handleDeleteCustomerField(field)}
                            disabled={field.isDefault}
                          >
                            Xóa
                          </Button>
                        </div>
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

                <div className="p-4 border border-red-200 dark:border-red-700/60 rounded-lg bg-red-50/40 dark:bg-red-900/10">
                  <h3 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                    Reset dữ liệu
                  </h3>
                  <p className="text-xs text-red-600 dark:text-red-300 mb-3">
                    Xóa toàn bộ dữ liệu khách hàng, giao dịch và tài khoản ngân hàng. Không thể hoàn tác.
                  </p>
                  <Button
                    variant="secondary"
                    className="w-full sm:w-auto border-red-300 text-red-700 hover:text-red-800 hover:border-red-400"
                    onClick={handleResetData}
                  >
                    Reset toàn bộ dữ liệu
                  </Button>
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
