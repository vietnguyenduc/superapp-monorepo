import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { ErrorFallback, LoadingFallback } from "../../components/UI/FallbackUI";
import ToggleSwitch from "../../components/UI/ToggleSwitch";
import Button from "../../components/UI/Button";
import PageHeader from "../../components/UI/PageHeader";
import { formatNumber } from "../../utils/formatting";
import { databaseService } from "../../services/database";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useCompanyId } from "../../hooks/useCompanyId";
import { useNavigate } from "react-router-dom";
import CreateUserModal from "../../components/UserManagement/CreateUserModal";
import { backupService, recoveryUtils } from "../../utils/backupRecovery";
import { canRestoreFullBackup, canRevertTable, isAdmin } from "../../utils/permissions";

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
  math_factor?: number;
  impact_type?: string;
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
  branch_id?: string;
  company_id?: string;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  company_id?: string;
  code?: string;
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

interface CustomerBalanceRow {
  id: string;
  customer_code: string;
  full_name: string;
  opening_balance: number;
  current_balance: number;
  total_balance: number;
  new_opening_balance: number;
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

const Settings: React.FC = () => {
  const { user } = useAuth();
  const companyId = useCompanyId();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("interface");
  const [activeOpeningSubTab, setActiveOpeningSubTab] = useState<"list" | "file">("list");
  const [error, setError] = useState<string | null>(null);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
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
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
  const [isTransactionTypeModalOpen, setIsTransactionTypeModalOpen] = useState(false);
  const [editingTransactionType, setEditingTransactionType] = useState<TransactionType | null>(null);
  const [transactionTypeForm, setTransactionTypeForm] = useState({
    name: "",
    color: "blue",
    math_factor: 1,
    impact_type: "increase",
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
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedPermissions, setExpandedPermissions] = useState<Record<string, boolean>>({
    customers: false,
    transactions: false,
    settings: false,
    reports: false,
  });

  // Opening balance import state
  const [openingFile, setOpeningFile] = useState<File | null>(null);
  const [openingRows, setOpeningRows] = useState<OpeningBalanceRow[]>([]);
  const [openingErrors, setOpeningErrors] = useState<string[]>([]);
  const [openingSuccess, setOpeningSuccess] = useState<string | null>(null);
  const [isOpeningProcessing, setIsOpeningProcessing] = useState(false);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({});

  // Opening balance inline-editing list state
  const [customerBalances, setCustomerBalances] = useState<CustomerBalanceRow[]>([]);
  const [customerBalanceSearch, setCustomerBalanceSearch] = useState("");
  const [isLoadingCustomerBalances, setIsLoadingCustomerBalances] = useState(false);
  const [customerBalanceErrors, setCustomerBalanceErrors] = useState<string[]>([]);
  const [customerBalanceSuccess, setCustomerBalanceSuccess] = useState<string | null>(null);
  const [isSavingCustomerBalances, setIsSavingCustomerBalances] = useState(false);

  // Users management state
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userEditForm, setUserEditForm] = useState({
    full_name: "",
    position: "",
    company_name: "",
  });

  // Backup/Restore state
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupHistory, setBackupHistory] = useState<any[]>([]);
  const [loadingBackupHistory, setLoadingBackupHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load backup history
  useEffect(() => {
    const loadBackupHistory = async () => {
      if (!companyId) return;
      
      setLoadingBackupHistory(true);
      try {
        const result = await databaseService.backupHistory.getBackupHistory(companyId);
        if (result.data) {
          setBackupHistory(result.data);
        }
      } catch (err) {
        console.error('Failed to load backup history:', err);
      } finally {
        setLoadingBackupHistory(false);
      }
    };

    loadBackupHistory();
  }, [companyId]);

  // Handle backup creation
  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      // Create backup data
      const backupData = await backupService.createBackup(
        {
          includeCustomers: true,
          includeTransactions: true,
          includeBankAccounts: true,
          includeBranches: true,
          company_id: companyId,
          format: 'json',
        },
        user?.id
      );

      // Save to database
      if (!user?.id) {
        throw new Error('User ID is required for backup');
      }
      await databaseService.backupHistory.saveBackupToDatabase(
        backupData,
        companyId || '',
        user.id
      );

      // Reload backup history
      const historyResult = await databaseService.backupHistory.getBackupHistory(companyId);
      if (historyResult.data) {
        setBackupHistory(historyResult.data);
      }

      setSuccessMessage('Sao lưu thành công!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Backup failed:', err);
      alert('Sao lưu thất bại: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setBackupLoading(false);
    }
  };

  // Handle download backup as file
  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      // Create backup data
      const backupData = await backupService.createBackup(
        {
          includeCustomers: true,
          includeTransactions: true,
          includeBankAccounts: true,
          includeBranches: true,
          company_id: companyId,
          format: 'xlsx',
        },
        user?.id
      );

      // Export to Excel
      const blob = await backupService.exportBackup(backupData, 'xlsx');
      const filename = backupService.generateBackupFilename(undefined, 'xlsx');
      backupService.downloadBackup(blob, filename);

      setSuccessMessage('Tải file thành công!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Download backup failed:', err);
      alert('Tải file thất bại: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setBackupLoading(false);
    }
  };

  // Handle restore from file
  const handleRestore = async () => {
    if (!restoreFile) {
      alert('Vui lòng chọn file để khôi phục');
      return;
    }

    setRestoreLoading(true);
    try {
      // Import backup data
      const backupData = await backupService.importBackup(restoreFile);

      // Validate backup
      const validation = recoveryUtils.validateBackupForRestoration(
        backupData,
        companyId
      );

      if (!validation.isValid) {
        alert('Validation failed: ' + validation.errors.join(', '));
        return;
      }

      // Restore with conflict detection
      const result = await backupService.restoreBackup(backupData, {
        restoreCustomers: true,
        restoreTransactions: true,
        restoreBankAccounts: true,
        restoreBranches: true,
        overwriteExisting: false,
        company_id: companyId,
        onConflict: async (conflicts) => {
          const message = `Phát hiện ${conflicts.totalConflicts} xung đột. Bạn có muốn tiếp tục?`;
          return window.confirm(message);
        },
      });

      if (result.errors.length > 0) {
        alert('Khôi phục hoàn tất với lỗi: ' + result.errors.map(e => e.message).join(', '));
      } else {
        setSuccessMessage('Khôi phục thành công!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Restore failed:', err);
      alert('Khôi phục thất bại: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setRestoreLoading(false);
    }
  };

  // Handle restore from database
  const handleRestoreFromDatabase = async (backupId: string) => {
    if (!window.confirm('Bạn có chắc muốn khôi phục toàn bộ dữ liệu từ bản sao lưu này?')) {
      return;
    }

    setRestoreLoading(true);
    try {
      // Load backup data from database
      const { data: backupData, error: loadError } = await databaseService.backupHistory.loadBackupData(backupId, companyId);
      
      if (loadError || !backupData) {
        alert('Không thể tải dữ liệu sao lưu: ' + loadError);
        return;
      }

      // Restore with conflict detection
      const result = await backupService.restoreBackup(backupData, {
        restoreCustomers: true,
        restoreTransactions: true,
        restoreBankAccounts: true,
        restoreBranches: true,
        overwriteExisting: false,
        company_id: companyId,
        onConflict: async (conflicts) => {
          const message = `Phát hiện ${conflicts.totalConflicts} xung đột. Bạn có muốn tiếp tục?`;
          return window.confirm(message);
        },
      });

      if (result.errors.length > 0) {
        alert('Khôi phục hoàn tất với lỗi: ' + result.errors.map(e => e.message).join(', '));
      } else {
        setSuccessMessage('Khôi phục thành công!');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Reload backup history to update restore count
        const historyResult = await databaseService.backupHistory.getBackupHistory(companyId);
        if (historyResult.data) {
          setBackupHistory(historyResult.data);
        }
      }
    } catch (err) {
      console.error('Restore from database failed:', err);
      alert('Khôi phục thất bại: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setRestoreLoading(false);
    }
  };

  // Handle selective restore (choose tables)
  const handleSelectiveRestore = async (backupId: string) => {
    const tables = ['customers', 'transactions', 'bank_accounts', 'branches'];
    const selectedTables = tables.filter(table => 
      window.confirm(`Bạn có muốn khôi phục bảng ${table}?`)
    );

    if (selectedTables.length === 0) {
      alert('Không có bảng nào được chọn');
      return;
    }

    setRestoreLoading(true);
    try {
      // Load backup data from database
      const { data: backupData, error: loadError } = await databaseService.backupHistory.loadBackupData(backupId, companyId);
      
      if (loadError || !backupData) {
        alert('Không thể tải dữ liệu sao lưu: ' + loadError);
        return;
      }

      // Restore selected tables
      const result = await backupService.restoreBackup(backupData, {
        restoreCustomers: selectedTables.includes('customers'),
        restoreTransactions: selectedTables.includes('transactions'),
        restoreBankAccounts: selectedTables.includes('bank_accounts'),
        restoreBranches: selectedTables.includes('branches'),
        overwriteExisting: false,
        company_id: companyId,
        onConflict: async (conflicts) => {
          const message = `Phát hiện ${conflicts.totalConflicts} xung đột. Bạn có muốn tiếp tục?`;
          return window.confirm(message);
        },
      });

      if (result.errors.length > 0) {
        alert('Khôi phục hoàn tất với lỗi: ' + result.errors.map(e => e.message).join(', '));
      } else {
        setSuccessMessage('Khôi phục thành công!');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Reload backup history to update restore count
        const historyResult = await databaseService.backupHistory.getBackupHistory(companyId);
        if (historyResult.data) {
          setBackupHistory(historyResult.data);
        }
      }
    } catch (err) {
      console.error('Selective restore failed:', err);
      alert('Khôi phục thất bại: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setRestoreLoading(false);
    }
  };

  // Handle revert specific table
  const handleRevertTable = async (backupId: string, tableName: string) => {
    if (!window.confirm(`Bạn có chắc muốn revert bảng ${tableName}? Chỉ các thay đổi của bạn sẽ được revert.`)) {
      return;
    }

    setRestoreLoading(true);
    try {
      // Revert table from backup
      const { error } = await databaseService.backupHistory.revertTableFromBackup(
        backupId,
        tableName,
        companyId || '',
        user?.id || ''
      );

      if (error) {
        alert('Revert thất bại: ' + error);
      } else {
        setSuccessMessage(`Revert ${tableName} thành công!`);
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Reload backup history to update restore count
        const historyResult = await databaseService.backupHistory.getBackupHistory(companyId);
        if (historyResult.data) {
          setBackupHistory(historyResult.data);
        }
      }
    } catch (err) {
      console.error('Revert table failed:', err);
      alert('Revert thất bại: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setRestoreLoading(false);
    }
  };

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
    console.log('Dark mode changed:', darkMode);
  }, [darkMode]);

  const loadCustomerBalances = useCallback(async () => {
    setIsLoadingCustomerBalances(true);
    setCustomerBalanceErrors([]);
    try {
      const result = await databaseService.customers.getCustomers({ limit: 1000, company_id: companyId });
      if (result?.data) {
        const rows: CustomerBalanceRow[] = result.data.map((c: any) => ({
          id: c.id,
          customer_code: c.customer_code || "",
          full_name: c.full_name || c.customer_name || c.name || "",
          opening_balance: Number(c.opening_balance || 0),
          current_balance: Number(c.current_balance || 0),
          total_balance: Number(c.current_balance || 0) + Number(c.opening_balance || 0),
          new_opening_balance: Number(c.opening_balance || 0),
        }));
        setCustomerBalances(rows);
      }
    } catch (err: any) {
      setCustomerBalanceErrors([err?.message || "Failed to load customers"]);
    } finally {
      setIsLoadingCustomerBalances(false);
    }
  }, [companyId]);

  // Load data from Supabase-backed services
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load transaction types
        const txTypeRes = await databaseService.transactionTypes.getTransactionTypes(companyId);
        if (txTypeRes.error) throw new Error(txTypeRes.error);
        const formattedTypes = (txTypeRes.data || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          color: t.color || "blue",
          isActive: t.is_active !== false,
          math_factor: t.math_factor,
          impact_type: t.impact_type,
        }));
        setTransactionTypes(formattedTypes);

        // Load bank accounts
        const bankAccountsResponse = await databaseService.bankAccounts.getBankAccounts(companyId);
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
          branch_id: account.branch_id,
          company_id: account.company_id,
        })) || [];

        setBankAccounts(formattedBankAccounts);

        // Load branches
        const branchesResponse = await databaseService.branches.getBranches(companyId);
        if (branchesResponse.error) {
          throw new Error(branchesResponse.error);
        }

        const formattedBranches = branchesResponse.data?.map((branch: any) => ({
          id: branch.id,
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          isActive: branch.is_active,
          company_id: branch.company_id,
          code: branch.code,
        })) || [];

        setBranches(formattedBranches);

        // Load customers for opening balance preview
        const customersResponse = await databaseService.customers.getCustomers({ limit: 1000, company_id: companyId });
        if (customersResponse?.data) {
          const map: Record<string, string> = {};
          customersResponse.data.forEach((c: any) => {
            if (c?.customer_code) map[String(c.customer_code)] = c.full_name || c.customer_name || c.name || "";
          });
          setCustomerMap(map);
        }

        // Load customers with balances for inline editing
        await loadCustomerBalances();
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [companyId, loadCustomerBalances]);

  // Load staff users for permissions management
  const loadStaffUsers = async () => {
    const userRole = user?.role;
    if (userRole !== "admin" && userRole !== "admin_master" && userRole !== "admin_company") return;

    setLoadingStaff(true);
    try {
      let query = supabase
        .from("users")
        .select(`
          id, 
          email, 
          full_name, 
          role, 
          staff_permissions, 
          can_delete, 
          created_at, 
          updated_at,
          company_id,
          companies!inner (
            id,
            name,
            code
          )
        `);

      // Filter by company
      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query
        .in("role", ["staff", "admin_company"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStaffUsers(data || []);
    } catch (err) {
      console.error("Failed to load staff users:", err);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    loadStaffUsers();
  }, [companyId]);

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

  const handleResetData = async () => {
    const confirmation = window.prompt(
      "Nhập CONFIRM để xóa toàn bộ dữ liệu và đặt lại hệ thống",
      "",
    );
    if (confirmation !== "CONFIRM") {
      return;
    }

    try {
      // Delete from Supabase database
      
      // Delete transactions first (due to foreign key constraints)
      const txResult = await supabase
        .from("transactions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      // Delete customers
      const custResult = await supabase
        .from("customers")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      // Delete bank accounts
      const bankResult = await supabase
        .from("bank_accounts")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (txResult.error || custResult.error || bankResult.error) {
        console.error("Database deletion errors:", { 
          txError: txResult.error, 
          custError: custResult.error, 
          bankError: bankResult.error 
        });
        alert(`Có lỗi khi xóa dữ liệu từ database:\n${txResult.error?.message || custResult.error?.message || bankResult.error?.message}`);
        return;
      }

      console.log("✅ Database deletion successful");

      alert("Đã xóa toàn bộ dữ liệu thành công!");
      
      // Navigate to dashboard instead of reload to preserve session
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error("Reset data failed:", error);
      alert(`Có lỗi khi reset dữ liệu: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleBankAccountFormChange = (
    field: "bankName" | "accountNumber" | "accountName" | "accountType" | "openingBalance",
    value: string,
  ) => {
    setBankAccountForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveBankAccount = async () => {
    const openingBalanceValue = (bankAccountForm.openingBalance || "").trim();
    const parsedOpeningBalance = openingBalanceValue ? Number(openingBalanceValue) : undefined;

    const previousOpening = Number(editingBankAccount?.openingBalance ?? 0);
    const nextOpening = Number.isFinite(parsedOpeningBalance)
      ? Number(parsedOpeningBalance)
      : previousOpening;
    const nextBalance = editingBankAccount
      ? Math.max(0, editingBankAccount.balance + (nextOpening - previousOpening))
      : nextOpening || 0;

    // Tìm branch_id và company_id từ các nguồn có sẵn: tài khoản cũ, profile user, hoặc danh sách chi nhánh
    const fallbackBranchId = branches.length > 0 ? branches[0].id : undefined;
    const fallbackCompanyId = branches.length > 0 ? branches[0].company_id : (bankAccounts.length > 0 ? bankAccounts[0].company_id : undefined);

    const finalBranchId = editingBankAccount?.branch_id || user?.branch_id || fallbackBranchId;
    const finalCompanyId = editingBankAccount?.company_id || user?.branch?.company_id || fallbackCompanyId;

    try {
      const payload: any = {
        id: editingBankAccount?.id,
        bank_name: (bankAccountForm.bankName || "").trim(),
        account_number: (bankAccountForm.accountNumber || "").trim(),
        account_name: (bankAccountForm.accountName || "").trim(),
        balance: nextBalance,
        is_active: editingBankAccount?.isActive ?? true,
        branch_id: finalBranchId,
        company_id: finalCompanyId,
      };
      const res = await databaseService.bankAccounts.upsertBankAccount(payload);
      if (res.error) throw new Error(res.error);
      const saved = res.data || {
        id: editingBankAccount?.id || `bank-${Date.now()}`,
        bank_name: (bankAccountForm.bankName || "").trim() || "Ngan hang moi",
        account_number: (bankAccountForm.accountNumber || "").trim(),
        account_name: (bankAccountForm.accountName || "").trim() || "Tai khoan moi",
        balance: nextBalance,
        is_active: true,
      };

      setBankAccounts((prev) => {
        const exists = prev.some((b) => b.id === saved.id);
        const balanceValue = Number.isFinite(Number((saved as any).balance)) ? Number((saved as any).balance) : 0;
        const openingValue = Number.isFinite(Number((saved as any).opening_balance))
          ? Number((saved as any).opening_balance)
          : nextOpening;
        const next = exists
          ? prev.map((b) =>
              b.id === saved.id
                ? {
                    id: saved.id,
                    bankName: (saved as any).bank_name,
                    accountNumber: (saved as any).account_number,
                    accountName: (saved as any).account_name,
                    accountType: getAccountType((saved as any).account_name),
                    balance: balanceValue,
                    openingBalance: openingValue,
                    isActive: (saved as any).is_active !== false,
                  }
                : b,
            )
          : [
              {
                id: saved.id,
                bankName: (saved as any).bank_name,
                accountNumber: (saved as any).account_number,
                accountName: (saved as any).account_name,
                accountType: getAccountType((saved as any).account_name),
                balance: balanceValue,
                openingBalance: openingValue,
                isActive: (saved as any).is_active !== false,
              },
              ...prev,
            ];
        return next;
      });

      setIsBankAccountModalOpen(false);
      setEditingBankAccount(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được tài khoản ngân hàng");
    }
  };

  const handleAddTransactionType = () => {
    setEditingTransactionType(null);
    setTransactionTypeForm({ name: "", color: "blue", math_factor: 1, impact_type: "increase" });
    setIsTransactionTypeModalOpen(true);
  };

  const handleEditTransactionType = (type: TransactionType) => {
    setEditingTransactionType(type);
    setTransactionTypeForm({ 
      name: type.name, 
      color: type.color,
      math_factor: type.math_factor ?? 1,
      impact_type: type.impact_type ?? "increase"
    });
    setIsTransactionTypeModalOpen(true);
  };

  const handleSaveTransactionType = async () => {
    const name = (transactionTypeForm.name || "").trim();
    if (!name) return;

    try {
      const res = await databaseService.transactionTypes.upsertTransactionType({
        id: editingTransactionType?.id,
        name,
        color: transactionTypeForm.color,
        math_factor: transactionTypeForm.math_factor,
        impact_type: transactionTypeForm.impact_type,
        is_active: editingTransactionType?.isActive ?? true,
        company_id: companyId,
      });
      if (res.error) throw new Error(res.error);
      const saved = res.data || { 
        id: editingTransactionType?.id || `type-${Date.now()}`, 
        name, 
        color: transactionTypeForm.color, 
        math_factor: transactionTypeForm.math_factor ?? undefined,
        impact_type: transactionTypeForm.impact_type ?? undefined,
        is_active: true 
      };
      setTransactionTypes((prev) => {
        const exists = prev.some((t) => t.id === saved.id);
        const next = exists
          ? prev.map((t) => (t.id === saved.id ? { 
              id: saved.id, 
              name: saved.name, 
              color: saved.color || "blue", 
              isActive: saved.is_active !== false,
              math_factor: saved.math_factor,
              impact_type: saved.impact_type
            } : t))
          : [{ 
              id: saved.id, 
              name: saved.name, 
              color: saved.color || "blue", 
              isActive: saved.is_active !== false,
              math_factor: saved.math_factor,
              impact_type: saved.impact_type
            }, ...prev];
        return next;
      });
      setIsTransactionTypeModalOpen(false);
      setEditingTransactionType(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được loại giao dịch");
    }
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
    const name = (customerFieldForm.name || "").trim();
    const type = (customerFieldForm.type || "").trim() || "text";

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
    const safeName = (accountName || "").toLowerCase();
    if (safeName.includes("checking")) return "Checking";
    if (safeName.includes("savings")) return "Savings";
    if (safeName.includes("business")) return "Business";
    if (safeName.includes("credit")) return "Credit";
    return "Other";
  };

  // Helper function to get color class for transaction type
  const getColorClass = (color: string) => {
    const colorOption = colorOptions.find((opt) => opt.value === color);
    return colorOption?.class || "bg-gray-100 text-gray-800";
  };

  const handleToggleActive = async (type: string, id: string) => {
    switch (type) {
      case "transaction-type":
        setTransactionTypes((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item,
          ),
        );
        try {
          const target = transactionTypes.find((t) => t.id === id);
          const next = target ? !target.isActive : true;
          await databaseService.transactionTypes.toggleTransactionType(id, next);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Không cập nhật được trạng thái loại giao dịch");
        }
        break;
      case "bank-account":
        setBankAccounts((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item,
          ),
        );
        try {
          const target = bankAccounts.find((b) => b.id === id);
          const next = target ? !target.isActive : true;
          await databaseService.bankAccounts.upsertBankAccount({ ...target, is_active: next });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Không cập nhật được tài khoản ngân hàng");
        }
        break;
      case "branch":
        setBranches((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item,
          ),
        );
        try {
          const target = branches.find((b) => b.id === id);
          const next = target ? !target.isActive : true;
          await databaseService.branches.upsertBranch({ ...(target as any), is_active: next } as any);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Không cập nhật được văn phòng");
        }
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

  const handleDeleteBranch = async (branchId: string) => {
    try {
      const res = await databaseService.branches.deleteBranch(branchId, companyId);
      if (res.error) throw new Error(res.error);
      setBranches((prev) => prev.filter((branch) => branch.id !== branchId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được văn phòng");
    }
  };

  const handleBranchFormChange = (
    field: "name" | "address" | "phone",
    value: string,
  ) => {
    setBranchForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveBranch = async () => {
    try {
      const fallbackCompanyId = branches.length > 0 ? branches[0].company_id : (bankAccounts.length > 0 ? bankAccounts[0].company_id : undefined);
      const finalCompanyId = editingBranch?.company_id || user?.branch?.company_id || fallbackCompanyId;

      const payload: any = {
        id: editingBranch?.id,
        name: (branchForm.name || "").trim(),
        address: (branchForm.address || "").trim(),
        phone: (branchForm.phone || "").trim(),
        company_id: finalCompanyId,
        code: editingBranch?.code || `BR-${Date.now()}`,
      };
      const res = await databaseService.branches.upsertBranch(payload);
      if (res.error) throw new Error(res.error);
      const saved = res.data || { id: editingBranch?.id || `branch-${Date.now()}`, name: (branchForm.name || "").trim(), address: (branchForm.address || "").trim(), phone: (branchForm.phone || "").trim(), is_active: true };
      setBranches((prev) => {
        const exists = prev.some((b) => b.id === saved.id);
        const next = exists
          ? prev.map((b) => (b.id === saved.id ? { id: saved.id, name: saved.name, address: saved.address || "", phone: saved.phone || "", isActive: saved.is_active !== false } : b))
          : [{ id: saved.id, name: saved.name, address: saved.address || "", phone: saved.phone || "", isActive: saved.is_active !== false }, ...prev];
        return next;
      });
      setIsBranchModalOpen(false);
      setEditingBranch(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được văn phòng");
    }
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
    if (!isAdmin(user)) {
      alert("Bạn không có quyền thực hiện thao tác này.");
      return;
    }
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

  // Handle opening edit user modal
  const handleOpenEditUser = (staff: any) => {
    setEditingUser(staff);
    setUserEditForm({
      full_name: staff.full_name || "",
      position: staff.position || "",
      company_name: staff.companies?.name || "",
    });
    setIsEditUserModalOpen(true);
  };

  // Handle saving user details
  const handleSaveUserDetails = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: userEditForm.full_name,
          position: userEditForm.position,
        })
        .eq("id", editingUser.id);

      if (error) throw error;

      // Update local state
      setStaffUsers(prev => prev.map(staff =>
        staff.id === editingUser.id
          ? { ...staff, full_name: userEditForm.full_name, position: userEditForm.position }
          : staff
      ));

      setSuccessMessage("Đã cập nhật thông tin người dùng thành công");
      setTimeout(() => setSuccessMessage(null), 3000);
      setIsEditUserModalOpen(false);
      setEditingUser(null);
      setUserEditForm({ full_name: "", position: "", company_name: "" });
    } catch (err) {
      console.error("Error updating user details:", err);
      setError("Không thể cập nhật thông tin người dùng");
    }
  };

  // Handle staff permission updates with new granular structure
  const handleUpdateStaffPermission = async (staffId: string, permissionPath: string, value: boolean) => {
    try {
      // Handle can_delete separately since it's a direct column
      if (permissionPath === "can_delete") {
        const { error } = await supabase
          .from("users")
          .update({ can_delete: value })
          .eq("id", staffId);

        if (error) throw error;

        // Update local state
        setStaffUsers(prev => prev.map(staff => 
          staff.id === staffId 
            ? { ...staff, can_delete: value }
            : staff
        ));
      } else {
        // Handle staff_permissions JSON with new granular structure
        const { data: currentStaff } = await supabase
          .from("users")
          .select("staff_permissions")
          .eq("id", staffId)
          .single();

        const currentPermissions = (currentStaff?.staff_permissions as any) || {};
        
        // Parse permission path (e.g., "customers.import_own" or "settings.branches")
        const pathParts = permissionPath.split('.');
        const updatedPermissions = { ...currentPermissions };
        
        // Navigate through the nested structure
        let current = updatedPermissions;
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
        
        // Set the final value
        current[pathParts[pathParts.length - 1]] = value;

        const { error } = await supabase
          .from("users")
          .update({ staff_permissions: updatedPermissions })
          .eq("id", staffId);

        if (error) throw error;

        // Update local state
        setStaffUsers(prev => prev.map(staff => 
          staff.id === staffId 
            ? { ...staff, staff_permissions: updatedPermissions }
            : staff
        ));
      }
      
      // Show success feedback
      setSuccessMessage("Đã cập nhật quyền truy cập thành công");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update staff permission:", err);
      setError("Không cập nhật được quyền truy cập");
    }
  };

  // User management functions
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await databaseService.users.getUsers();
      if (error) throw new Error(String(error));
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await databaseService.users.updateUser(userId, { role: newRole as any });
      if (error) throw new Error(String(error));
      // Refresh users list
      await loadUsers();
    } catch (err) {
      console.error('Failed to update user role:', err);
      alert('Failed to update user role');
    }
  };

  const handlePromoteToAdminMaster = async (userId: string, userEmail: string) => {
    if (!confirm(`Bạn có chắc chắn muốn promote ${userEmail} lên làm Admin Master?\n\nNgười dùng này sẽ có quyền truy cập toàn bộ hệ thống và có thể chuyển đổi giữa các công ty.`)) {
      return;
    }

    try {
      // First update role to admin_master
      const { error } = await databaseService.users.updateUser(userId, { role: 'admin_master' });
      if (error) throw new Error(String(error));
      
      // Then set company_id to null using direct Supabase call
      const { error: updateError } = await supabase
        .from('users')
        .update({ company_id: null })
        .eq('id', userId);
      
      if (updateError) throw new Error(String(updateError));
      
      setSuccessMessage(`Đã promote ${userEmail} lên làm Admin Master thành công`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh users list
      await loadUsers();
    } catch (err) {
      console.error('Failed to promote user to admin_master:', err);
      setError('Không thể promote user lên Admin Master');
    }
  };

  // Load users when component mounts
  useEffect(() => {
    if (activeTab === "users") {
      loadUsers();
    }
  }, [activeTab]);


  const tabs: Tab[] = useMemo(
    () => [
      { id: "appearance", name: "Giao diện", icon: "🎨" },
      { id: "opening-balance", name: "Số dư đầu kỳ", icon: "📥" },
      { id: "backup", name: "Sao lưu", icon: "💿" },
      { id: "bank-accounts", name: "Tài khoản ngân hàng", icon: "🏦" },
      { id: "branches", name: "Văn phòng", icon: "🏢" },
      { id: "customer-fields", name: "Trường khách hàng", icon: "🧾" },
      { id: "transaction-types", name: "Loại giao dịch", icon: "💳" },
      { id: "users", name: "Tài khoản & phân quyền", icon: "👥" },
    ].filter(tab => {
      // Show users/permissions and opening-balance tabs for admin, admin_master, and admin_company
      if ((tab.id === "users" || tab.id === "opening-balance") && !isAdmin(user)) return false;
      return true;
    }),
    [user?.role],
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

        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Cập nhật số dư đầu kỳ cho từng khách hàng hoặc import hàng loạt từ file.</p>
                </div>
              </div>

              {/* Sub-tab switcher */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeOpeningSubTab === "list"
                      ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                  onClick={() => setActiveOpeningSubTab("list")}
                >
                  Nhập nhanh (danh sách)
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeOpeningSubTab === "file"
                      ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                  onClick={() => setActiveOpeningSubTab("file")}
                >
                  Nhập từ file Excel/CSV
                </button>
              </div>

              {/* --- List view (nhập nhanh) --- */}
              {activeOpeningSubTab === "list" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <input
                      type="text"
                      placeholder="Tìm theo mã hoặc tên khách hàng..."
                      value={customerBalanceSearch}
                      onChange={(e) => setCustomerBalanceSearch(e.target.value)}
                      className="w-full sm:w-72 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                    />
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => loadCustomerBalances()}>
                        Tải lại danh sách
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isSavingCustomerBalances || customerBalances.filter(c => c.new_opening_balance !== c.opening_balance).length === 0}
                        onClick={async () => {
                          if (!isAdmin(user)) {
                            alert("Bạn không có quyền thực hiện thao tác này.");
                            return;
                          }
                          const modified = customerBalances.filter(c => c.new_opening_balance !== c.opening_balance);
                          if (modified.length === 0) return;
                          setIsSavingCustomerBalances(true);
                          setCustomerBalanceErrors([]);
                          setCustomerBalanceSuccess(null);
                          try {
                            for (const row of modified) {
                              const res = await databaseService.customers.updateCustomerOpeningBalance(row.id, Number(row.new_opening_balance), companyId);
                              if (res.error) {
                                setCustomerBalanceErrors(prev => [...prev, `${row.customer_code}: ${res.error}`]);
                              }
                            }
                            setCustomerBalanceSuccess(`Đã cập nhật ${modified.length} khách hàng.`);
                            await loadCustomerBalances();
                            setTimeout(() => setCustomerBalanceSuccess(null), 4000);
                          } catch (err: any) {
                            setCustomerBalanceErrors([err?.message || "Lỗi khi lưu"]);
                          } finally {
                            setIsSavingCustomerBalances(false);
                          }
                        }}
                      >
                        {isSavingCustomerBalances ? "Đang lưu..." : `Lưu thay đổi (${customerBalances.filter(c => c.new_opening_balance !== c.opening_balance).length})`}
                      </Button>
                    </div>
                  </div>

                  {customerBalanceErrors.length > 0 && (
                    <div className="border border-red-200 bg-red-50 text-red-700 rounded p-3 text-sm">
                      <p className="font-semibold mb-1">Lỗi</p>
                      <ul className="list-disc list-inside space-y-1">
                        {customerBalanceErrors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {customerBalanceSuccess && (
                    <p className="text-sm text-green-600">{customerBalanceSuccess}</p>
                  )}

                  {isLoadingCustomerBalances ? (
                    <p className="text-sm text-gray-500">Đang tải danh sách...</p>
                  ) : (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="max-h-96 overflow-y-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-800 text-left text-gray-700 dark:text-gray-200 sticky top-0 z-10">
                            <tr>
                              <th className="px-3 py-2">Mã KH</th>
                              <th className="px-3 py-2">Tên khách hàng</th>
                              <th className="px-3 py-2 text-right">Số dư đầu kỳ hiện tại</th>
                              <th className="px-3 py-2 text-right">Số dư hiện tại</th>
                              <th className="px-3 py-2 text-right">Số dư đầu kỳ mới</th>
                              <th className="px-3 py-2 text-right">Số dư mới sau cập nhật</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {customerBalances
                              .filter(c => {
                                const s = customerBalanceSearch.toLowerCase();
                                return !s || c.customer_code.toLowerCase().includes(s) || c.full_name.toLowerCase().includes(s);
                              })
                              .map((row) => {
                                const isModified = row.new_opening_balance !== row.opening_balance;
                                const newTotal = row.new_opening_balance + (row.current_balance - row.opening_balance);
                                return (
                                  <tr key={row.id} className={isModified ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}>
                                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100 whitespace-nowrap">{row.customer_code}</td>
                                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{row.full_name}</td>
                                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100 text-right">{formatNumber(row.opening_balance)}</td>
                                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100 text-right">{formatNumber(row.current_balance)}</td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="number"
                                        className="w-32 text-right rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-2 py-1"
                                        value={row.new_opening_balance}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0;
                                          setCustomerBalances(prev => prev.map(c => c.id === row.id ? { ...c, new_opening_balance: val } : c));
                                        }}
                                      />
                                    </td>
                                    <td className={`px-3 py-2 text-right font-medium ${isModified ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-gray-100"}`}>
                                      {formatNumber(newTotal)}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- File import view --- */}
              {activeOpeningSubTab === "file" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tải file mẫu, điền Mã khách hàng (customer_code) và Số dư đầu kỳ (opening_balance), sau đó import.</p>
                    <Button variant="primary" size="sm" onClick={handleDownloadOpeningTemplate}>Tải file mẫu</Button>
                  </div>

                  <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">Chọn file Excel/CSV (cột: customer_code – Mã khách hàng, opening_balance – Số dư đầu kỳ)</p>
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
                              <th className="px-3 py-2">Mã khách hàng</th>
                              <th className="px-3 py-2">Số dư đầu kỳ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {openingRows.slice(0, 50).map((row, idx) => (
                              <tr key={`${row.customer_code}-${idx}`}>
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{customerMap[row.customer_code] || ""}</td>
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{row.customer_code}</td>
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{formatNumber(row.opening_balance)}</td>
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
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ảnh hưởng dư nợ (Logic)
                    </label>
                    <select
                      value={`${transactionTypeForm.math_factor}:${transactionTypeForm.impact_type}`}
                      onChange={(e) => {
                        const [factor, type] = e.target.value.split(":");
                        setTransactionTypeForm((prev) => ({ 
                          ...prev, 
                          math_factor: Number(factor),
                          impact_type: type
                        }));
                      }}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2"
                    >
                      <option value="1:increase">Tăng dư nợ (+)</option>
                      <option value="-1:decrease">Giảm dư nợ (-)</option>
                      <option value="0:neutral">Không ảnh hưởng (0)</option>
                    </select>
                    <p className="mt-1 text-[10px] text-gray-500 italic">
                      Dư nợ = Đầu kỳ + (Số tiền * Logic)
                    </p>
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
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getColorClass(type.color)}`}>
                          {type.name}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                          ({type.math_factor === 1 ? "+" : type.math_factor === -1 ? "-" : "0"})
                        </span>
                      </div>
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
                    <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400">
                      <span>{type.isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}</span>
                      <span className="italic">
                        {type.math_factor === 1 ? "Tăng dư nợ" : type.math_factor === -1 ? "Giảm dư nợ" : "Không ảnh hưởng"}
                      </span>
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
                      Tên văn phòng
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
                      Địa chỉ
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
                      Số điện thoại
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
                    Hủy
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveBranch}>
                    Lưu
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

          {/* Users & Permissions - admin, admin_master, and admin_company can access */}
          {activeTab === "users" && (user?.role === "admin" || user?.role === "admin_master" || user?.role === "admin_company") && (
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    Tài khoản & phân quyền
                  </h2>
                  {user?.role === 'admin_company' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      👁️ Chế độ xem - Bạn không thể chỉnh sửa thông tin
                    </p>
                  )}
                </div>
                {(user?.role === "admin" || user?.role === "admin_master") && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIsCreateUserModalOpen(true);
                    }}
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
                    Tạo tài khoản mới
                  </Button>
                )}
              </div>

              {loadingStaff ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Đang tải...</p>
                </div>
              ) : staffUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Không có nhân viên nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {staffUsers.map((staff) => (
                    <div key={staff.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          {/* User info header */}
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {staff.full_name || staff.email}
                                  </h3>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {staff.email}
                                  </p>
                                </div>
                                {user?.role === 'admin_master' && (
                                  <button
                                    onClick={() => handleOpenEditUser(staff)}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium"
                                    title="Chỉnh sửa thông tin"
                                  >
                                    ✏️ Sửa
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* User details */}
                          <div className="grid grid-cols-2 gap-2 text-xs ml-13">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500 dark:text-gray-400">Vai trò:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {staff.role === 'staff' ? 'Nhân viên' : staff.role === 'admin_company' ? 'Quản trị công ty' : staff.role}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500 dark:text-gray-400">Công ty:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {staff.companies?.name || '-'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500 dark:text-gray-400">Tạo lúc:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {staff.created_at ? new Date(staff.created_at).toLocaleDateString('vi-VN') + ' ' + new Date(staff.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500 dark:text-gray-400">Cập nhật:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {staff.updated_at ? new Date(staff.updated_at).toLocaleDateString('vi-VN') + ' ' + new Date(staff.updated_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            Quyền hạn:
                          </div>
                          
                          {/* Customers Section */}
                          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                            <button
                              onClick={() => setExpandedPermissions(prev => ({ ...prev, customers: !prev.customers }))}
                              className="flex items-center justify-between w-full text-left"
                            >
                              <span className="text-sm font-medium text-gray-900 dark:text-white">👥 Khách hàng</span>
                              <svg className={`w-4 h-4 text-gray-500 transition-transform ${expandedPermissions.customers ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {expandedPermissions.customers && (
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-gray-700 dark:text-gray-300">
                                    Nhập khách hàng (chỉ sửa của mình)
                                  </label>
                                  <ToggleSwitch
                                    checked={Boolean(staff.staff_permissions?.customers?.import_own)}
                                    onChange={(checked) => handleUpdateStaffPermission(staff.id, "customers.import_own", checked)}
                                    size="sm"
                                    disabled={user?.role === 'admin_company'}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-gray-700 dark:text-gray-300">
                                    Quản lý khách hàng (sửa/xóa tất cả)
                                  </label>
                                  <ToggleSwitch
                                    checked={Boolean(staff.staff_permissions?.customers?.manage_all)}
                                    onChange={(checked) => handleUpdateStaffPermission(staff.id, "customers.manage_all", checked)}
                                    size="sm"
                                    disabled={user?.role === 'admin_company'}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Transactions Section */}
                          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                            <button
                              onClick={() => setExpandedPermissions(prev => ({ ...prev, transactions: !prev.transactions }))}
                              className="flex items-center justify-between w-full text-left"
                            >
                              <span className="text-sm font-medium text-gray-900 dark:text-white">💰 Giao dịch</span>
                              <svg className={`w-4 h-4 text-gray-500 transition-transform ${expandedPermissions.transactions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {expandedPermissions.transactions && (
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-gray-700 dark:text-gray-300">
                                    Nhập giao dịch (chỉ sửa của mình)
                                  </label>
                                  <ToggleSwitch
                                    checked={Boolean(staff.staff_permissions?.transactions?.import_own)}
                                    onChange={(checked) => handleUpdateStaffPermission(staff.id, "transactions.import_own", checked)}
                                    size="sm"
                                    disabled={user?.role === 'admin_company'}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-gray-700 dark:text-gray-300">
                                    Quản lý giao dịch (sửa/xóa tất cả)
                                  </label>
                                  <ToggleSwitch
                                    checked={Boolean(staff.staff_permissions?.transactions?.manage_all)}
                                    onChange={(checked) => handleUpdateStaffPermission(staff.id, "transactions.manage_all", checked)}
                                    size="sm"
                                    disabled={user?.role === 'admin_company'}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Settings Section */}
                          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                            <button
                              onClick={() => setExpandedPermissions(prev => ({ ...prev, settings: !prev.settings }))}
                              className="flex items-center justify-between w-full text-left"
                            >
                              <span className="text-sm font-medium text-gray-900 dark:text-white">⚙️ Cài đặt</span>
                              <svg className={`w-4 h-4 text-gray-500 transition-transform ${expandedPermissions.settings ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {expandedPermissions.settings && (
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-gray-700 dark:text-gray-300">
                                    Chỉnh sửa cài đặt chung
                                  </label>
                                  <ToggleSwitch
                                    checked={Boolean(staff.staff_permissions?.settings?.edit_general)}
                                    onChange={(checked) => handleUpdateStaffPermission(staff.id, "settings.edit_general", checked)}
                                    size="sm"
                                    disabled={user?.role === 'admin_company'}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-gray-700 dark:text-gray-300">
                                    Văn phòng
                                  </label>
                                  <ToggleSwitch
                                    checked={Boolean(staff.staff_permissions?.settings?.branches)}
                                    onChange={(checked) => handleUpdateStaffPermission(staff.id, "settings.branches", checked)}
                                    size="sm"
                                    disabled={user?.role === 'admin_company'}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-gray-700 dark:text-gray-300">
                                    Tài khoản ngân hàng
                                  </label>
                                  <ToggleSwitch
                                    checked={Boolean(staff.staff_permissions?.settings?.bank_accounts)}
                                    onChange={(checked) => handleUpdateStaffPermission(staff.id, "settings.bank_accounts", checked)}
                                    size="sm"
                                    disabled={user?.role === 'admin_company'}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-gray-700 dark:text-gray-300">
                                    Loại giao dịch
                                  </label>
                                  <ToggleSwitch
                                    checked={Boolean(staff.staff_permissions?.settings?.transaction_types)}
                                    onChange={(checked) => handleUpdateStaffPermission(staff.id, "settings.transaction_types", checked)}
                                    size="sm"
                                    disabled={user?.role === 'admin_company'}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-gray-700 dark:text-gray-300">
                                    Trường khách hàng
                                  </label>
                                  <ToggleSwitch
                                    checked={Boolean(staff.staff_permissions?.settings?.customer_fields)}
                                    onChange={(checked) => handleUpdateStaffPermission(staff.id, "settings.customer_fields", checked)}
                                    size="sm"
                                    disabled={user?.role === 'admin_company'}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-gray-700 dark:text-gray-300">
                                    Màu sắc
                                  </label>
                                  <ToggleSwitch
                                    checked={Boolean(staff.staff_permissions?.settings?.color_settings)}
                                    onChange={(checked) => handleUpdateStaffPermission(staff.id, "settings.color_settings", checked)}
                                    size="sm"
                                    disabled={user?.role === 'admin_company'}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-gray-700 dark:text-gray-300">
                                    Báo cáo
                                  </label>
                                  <ToggleSwitch
                                    checked={Boolean(staff.staff_permissions?.settings?.reports)}
                                    onChange={(checked) => handleUpdateStaffPermission(staff.id, "settings.reports", checked)}
                                    size="sm"
                                    disabled={user?.role === 'admin_company'}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Reports Section */}
                          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                            <button
                              onClick={() => setExpandedPermissions(prev => ({ ...prev, reports: !prev.reports }))}
                              className="flex items-center justify-between w-full text-left"
                            >
                              <span className="text-sm font-medium text-gray-900 dark:text-white">📊 Báo cáo</span>
                              <svg className={`w-4 h-4 text-gray-500 transition-transform ${expandedPermissions.reports ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {expandedPermissions.reports && (
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-gray-700 dark:text-gray-300">
                                    Xem báo cáo
                                  </label>
                                  <ToggleSwitch
                                    checked={Boolean(staff.staff_permissions?.reports?.view)}
                                    onChange={(checked) => handleUpdateStaffPermission(staff.id, "reports.view", checked)}
                                    size="sm"
                                    disabled={user?.role === 'admin_company'}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Delete permission (separate) */}
                          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-600 pt-3">
                            <label className="text-xs text-gray-700 dark:text-gray-300">
                              Xóa dữ liệu
                            </label>
                            <ToggleSwitch
                              checked={Boolean(staff.can_delete)}
                              onChange={(checked) => handleUpdateStaffPermission(staff.id, "can_delete", checked)}
                              size="sm"
                              disabled={user?.role === 'admin_company'}
                            />
                          </div>
                          
                          {user?.role === 'admin_master' && staff.role !== 'admin_master' && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                onClick={() => handlePromoteToAdminMaster(staff.id, staff.email || staff.full_name || '')}
                              >
                                👑 Promote lên Admin Master
                              </Button>
                            </div>
                          )}
                          
                          {staff.role === 'admin_master' && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                👑 Admin Master - Có quyền truy cập toàn bộ hệ thống
                              </div>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                            * Mật khẩu được quản lý bởi Supabase Auth và không thể hiển thị. Để đặt lại mật khẩu, hãy sử dụng chức năng quên mật khẩu.
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "users" && user?.role !== "admin" && user?.role !== "admin_master" && (
            <div className="p-4 sm:p-6">
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Chỉ admin mới có thể quản lý quyền nhân viên
                </p>
              </div>
            </div>
          )}

          {/* CreateUserModal */}
          {isCreateUserModalOpen && (
            <CreateUserModal
              isOpen={isCreateUserModalOpen}
              onClose={() => setIsCreateUserModalOpen(false)}
              onSuccess={() => {
                setIsCreateUserModalOpen(false);
                loadStaffUsers();
              }}
            />
          )}

          {/* Edit User Modal */}
          {isEditUserModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Chỉnh sửa thông tin người dùng
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Họ tên
                    </label>
                    <input
                      type="text"
                      value={userEditForm.full_name}
                      onChange={(e) => setUserEditForm({ ...userEditForm, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Công ty
                    </label>
                    <input
                      type="text"
                      value={userEditForm.company_name}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      title="Tên công ty được gán từ hệ thống"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Chức vụ
                    </label>
                    <input
                      type="text"
                      value={userEditForm.position}
                      onChange={(e) => setUserEditForm({ ...userEditForm, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setIsEditUserModalOpen(false);
                      setEditingUser(null);
                      setUserEditForm({ full_name: "", position: "", company_name: "" });
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveUserDetails}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Backup Settings */}
          {activeTab === "backup" && (
            <div className="p-4 sm:p-6">
              <div className="mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Sao lưu & Khôi phục
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Quản lý sao lưu và khôi phục dữ liệu theo công ty
                </p>
              </div>

              <div className="space-y-6">
                {/* Create Backup Section */}
                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Tạo sao lưu mới
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Sao lưu dữ liệu hiện tại: khách hàng, giao dịch, tài khoản ngân hàng, văn phòng
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="primary" 
                      className="w-full sm:w-auto"
                      onClick={handleCreateBackup}
                      disabled={backupLoading}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {backupLoading ? 'Đang sao lưu...' : 'Lưu vào Database'}
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full sm:w-auto"
                      onClick={handleDownloadBackup}
                      disabled={backupLoading}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {backupLoading ? 'Đang tải...' : 'Tải file XLSX'}
                    </Button>
                  </div>
                </div>

                {/* Restore from Backup Section - Admin Only */}
                {(user?.role === 'admin_master' || user?.role === 'admin_company') && (
                  <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Khôi phục từ file sao lưu
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Chọn file Excel (.xlsx) hoặc JSON để khôi phục dữ liệu
                    </p>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.json"
                      onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300 mb-3"
                    />
                    <Button 
                      variant="secondary" 
                      className="w-full sm:w-auto"
                      onClick={handleRestore}
                      disabled={restoreLoading || !restoreFile}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {restoreLoading ? 'Đang khôi phục...' : 'Khôi phục'}
                    </Button>
                  </div>
                )}

                {/* Reset Data Section */}
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

                {/* Backup History Section */}
                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Lịch sử sao lưu (Database)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Xem và khôi phục từ các bản sao lưu đã lưu trong database
                  </p>
                  {loadingBackupHistory ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p className="text-sm">Đang tải...</p>
                    </div>
                  ) : backupHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm">Chưa có lịch sử sao lưu</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {backupHistory.map((backup) => (
                        <div key={backup.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {backup.backup_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(backup.backup_timestamp).toLocaleString('vi-VN')}
                              </p>
                              {backup.included_tables && backup.included_tables.length > 0 && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  Bảng: {backup.included_tables.join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {backup.total_customers} khách
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {backup.total_transactions} giao dịch
                              </p>
                              {backup.restore_count !== undefined && backup.restore_count > 0 && (
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                  Đã khôi phục {backup.restore_count} lần
                                </p>
                              )}
                            </div>
                          </div>
                          {/* Restore options for admins */}
                          {canRestoreFullBackup(user!) && (
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleRestoreFromDatabase(backup.id)}
                              >
                                Khôi phục toàn bộ
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleSelectiveRestore(backup.id)}
                              >
                                Chọn bảng
                              </Button>
                            </div>
                          )}
                          {/* Revert own changes for all users */}
                          {backup.included_tables && backup.included_tables.some((table: string) => canRevertTable(user!, table)) && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {backup.included_tables.map((table: string) => (
                                canRevertTable(user!, table) && (
                                  <Button
                                    key={table}
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleRevertTable(backup.id, table)}
                                  >
                                    Revert {table}
                                  </Button>
                                )
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
