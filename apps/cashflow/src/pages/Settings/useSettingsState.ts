import { useState, useEffect, useMemo, useCallback } from "react";
import type { ChangeEvent } from "react";
import { logger } from "../../utils/logger";
import { toast } from "../../utils/toast";
import * as XLSX from "xlsx";
import { databaseService } from "../../services/database";
import { supabase } from "../../services/supabase";
import { useAuthContext as useAuth, useCompany } from "@superapp/iam";
import { useCompanyId } from "../../hooks/useCompanyId";
import { useNavigate } from "react-router-dom";
import { backupService, recoveryUtils, type BackupData } from "../../utils/backupRecovery";
import { isAdmin, getInitialEntityStatus, canEditBankAccountSettings, canEditBranchSettings, canManageAllCustomers } from "../../utils/permissions";
import { parseAmountOrNull, parseDate } from "../../services/businessLogic";



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
  status?: string;
  branch_id?: string;
  company_id?: string;
}



interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  status?: string;
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

export function useSettingsState() {

  const { user } = useAuth();
  const { selectedCompany, refetchCompanies } = useCompany();

  const companyId = useCompanyId();

  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const [activeTab, setActiveTab] = useState("appearance");

  const [activeOpeningSubTab, setActiveOpeningSubTab] = useState<"list" | "file">("list");

  const [autoApproveExternal, setAutoApproveExternal] = useState(() => {
    return localStorage.getItem("cashflow_auto_approve_external") === "true";
  });

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

  const [resetTargets, setResetTargets] = useState({
    transactions: true,
    bankAccounts: true,
    branches: true,
  });

  const [resetTransactionDate, setResetTransactionDate] = useState("");
  const [resetDateMode, setResetDateMode] = useState<"all" | "before" | "after" | "on">("all");

  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [expandedPermissions, setExpandedPermissions] = useState<Record<string, boolean>>({
    customers: false,
    transactions: false,
    settings: false,
    reports: false,
  });

  const defaultApprovalSettings = {
    transactions: true,
    customers: true,
    bank_accounts: true,
    branches: true,
    auto_customer_code: true,
    customer_code_prefix: "KH",
    customer_code_digits: 4,
    customer_code_fill_gaps: false,
  };

  const [approvalSettings, setApprovalSettings] = useState<{
    transactions: boolean;
    customers: boolean;
    bank_accounts: boolean;
    branches: boolean;
    auto_customer_code: boolean;
    customer_code_prefix: string;
    customer_code_digits: number;
    customer_code_fill_gaps: boolean;
  }>(defaultApprovalSettings);

  const [isSavingApprovalSettings, setIsSavingApprovalSettings] = useState(false);

  useEffect(() => {
    const settings = selectedCompany?.approval_settings ?? user?.company?.approval_settings;
    if (settings) {
      setApprovalSettings((prev) => ({
        transactions: settings.transactions ?? prev.transactions,
        customers: settings.customers ?? prev.customers,
        bank_accounts: settings.bank_accounts ?? prev.bank_accounts,
        branches: settings.branches ?? prev.branches,
        auto_customer_code: settings.auto_customer_code ?? prev.auto_customer_code,
        customer_code_prefix: settings.customer_code_prefix ?? prev.customer_code_prefix,
        customer_code_digits: settings.customer_code_digits ?? prev.customer_code_digits,
        customer_code_fill_gaps: settings.customer_code_fill_gaps ?? prev.customer_code_fill_gaps,
      }));
    }
  }, [selectedCompany?.approval_settings, user?.company?.approval_settings]);

  const handleApprovalSettingChange = useCallback((key: string, value: boolean) => {
    setApprovalSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCustomerCodePrefixChange = useCallback((value: string) => {
    const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    setApprovalSettings((prev) => ({ ...prev, customer_code_prefix: sanitized }));
  }, []);

  const handleCustomerCodeDigitsChange = useCallback((value: number) => {
    const digits = Math.min(Math.max(Number.isFinite(value) ? value : 4, 1), 12);
    setApprovalSettings((prev) => ({ ...prev, customer_code_digits: digits }));
  }, []);

  const handleCustomerCodeFillGapsChange = useCallback((value: boolean) => {
    setApprovalSettings((prev) => ({ ...prev, customer_code_fill_gaps: value }));
  }, []);

  const saveApprovalSettings = useCallback(async () => {
    if (!companyId) {
      setError("Không xác định được công ty");
      return;
    }
    setIsSavingApprovalSettings(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { data, error: saveError } = await supabase
        .from("companies")
        .update({ approval_settings: approvalSettings })
        .eq("id", companyId)
        .select()
        .single();
      if (saveError) throw saveError;
      if (!data) throw new Error("Không có quyền cập nhật hoặc công ty không tồn tại");
      setSuccessMessage("Đã lưu cấu hình duyệt");
      setTimeout(() => setSuccessMessage(null), 3000);
      await refetchCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được cấu hình duyệt");
    } finally {
      setIsSavingApprovalSettings(false);
    }
  }, [companyId, approvalSettings, refetchCompanies]);


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


  const getErrorMessage = (err: unknown): string => {
    if (typeof err === "string") return err;
    const msg = err && typeof (err as { message?: unknown }).message === "string" ? (err as { message: string }).message : undefined;
    return msg || "Lỗi không xác định";
  };


  // Load backup history
  useEffect(() => {
    const loadBackupHistory = async () => {
      if (!companyId) return;
      
      setLoadingBackupHistory(true);
      try {
        const result = await databaseService.backupHistory.getBackupHistory(companyId);
        if (result.data) {
          setBackupHistory(result.data as any[]);
        }
      } catch (err) {
        logger.error('Failed to load backup history:', err);
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
        setBackupHistory(historyResult.data as any[]);
      }

      setSuccessMessage('Sao lưu thành công!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      logger.error('Backup failed:', err);
      toast.error('Sao lưu thất bại: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
      logger.error('Download backup failed:', err);
      toast.error('Tải file thất bại: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setBackupLoading(false);
    }
  };


  // Handle restore from file
  const handleRestore = async () => {
    if (!restoreFile) {
      toast.warning('Vui lòng chọn file để khôi phục');
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
        toast.error('Validation failed: ' + validation.errors.join(', '));
        return;
      }

      // Restore with conflict detection
      const result = await backupService.restoreBackup(backupData as BackupData, {
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
        toast.error('Khôi phục hoàn tất với lỗi: ' + result.errors.map(e => e.message).join(', '));
      } else {
        setSuccessMessage('Khôi phục thành công!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      logger.error('Restore failed:', err);
      toast.error('Khôi phục thất bại: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
        toast.error('Không thể tải dữ liệu sao lưu: ' + loadError);
        return;
      }

      // Restore with conflict detection
      const result = await backupService.restoreBackup(backupData as BackupData, {
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
        toast.error('Khôi phục hoàn tất với lỗi: ' + result.errors.map(e => e.message).join(', '));
      } else {
        setSuccessMessage('Khôi phục thành công!');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Reload backup history to update restore count
        const historyResult = await databaseService.backupHistory.getBackupHistory(companyId);
        if (historyResult.data) {
          setBackupHistory(historyResult.data as any[]);
        }
      }
    } catch (err) {
      logger.error('Restore from database failed:', err);
      toast.error('Khôi phục thất bại: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
      toast.warning('Không có bảng nào được chọn');
      return;
    }

    setRestoreLoading(true);
    try {
      // Load backup data from database
      const { data: backupData, error: loadError } = await databaseService.backupHistory.loadBackupData(backupId, companyId);
      
      if (loadError || !backupData) {
        toast.error('Không thể tải dữ liệu sao lưu: ' + loadError);
        return;
      }

      // Restore selected tables
      const result = await backupService.restoreBackup(backupData as BackupData, {
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
        toast.error('Khôi phục hoàn tất với lỗi: ' + result.errors.map(e => e.message).join(', '));
      } else {
        setSuccessMessage('Khôi phục thành công!');
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Reload backup history to update restore count
        const historyResult = await databaseService.backupHistory.getBackupHistory(companyId);
        if (historyResult.data) {
          setBackupHistory(historyResult.data as any[]);
        }
      }
    } catch (err) {
      logger.error('Selective restore failed:', err);
      toast.error('Khôi phục thất bại: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
        toast.error('Revert thất bại: ' + error);
      } else {
        setSuccessMessage(`Revert ${tableName} thành công!`);
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Reload backup history to update restore count
        const historyResult = await databaseService.backupHistory.getBackupHistory(companyId);
        if (historyResult.data) {
          setBackupHistory(historyResult.data as any[]);
        }
      }
    } catch (err) {
      logger.error('Revert table failed:', err);
      toast.error('Revert thất bại: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setRestoreLoading(false);
    }
  };


  // Apply dark mode to document and persist to localStorage
  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#111827';
      document.body.style.color = '#f3f4f6';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#213547';
    }
  }, [darkMode]);


  const loadCustomerBalances = useCallback(async () => {
    setIsLoadingCustomerBalances(true);
    setCustomerBalanceErrors([]);
    try {
      const result = await databaseService.customers.getCustomers({ limit: 1000, company_id: companyId });
      if (result?.data) {
        const rows: CustomerBalanceRow[] = (result.data as any[]).map((c: any) => ({
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
        const formattedTypes = ((txTypeRes.data as any[] | null) || []).map((t: any) => ({
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

        const formattedBankAccounts = (bankAccountsResponse.data as any[] | null)?.map((account: any) => ({
          id: account.id,
          bankName: account.bank_name,
          accountNumber: account.account_number,
          accountType: getAccountType(account.account_name),
          accountName: account.account_name,
          balance: account.balance,
          openingBalance: account.opening_balance ?? 0,
          isActive: account.is_active,
          status: account.status,
          branch_id: account.branch_id,
          company_id: account.company_id,
        })) || [];

        setBankAccounts(formattedBankAccounts);

        // Load branches
        const branchesResponse = await databaseService.branches.getBranches(companyId);
        if (branchesResponse.error) {
          throw new Error(branchesResponse.error);
        }

        const formattedBranches = (branchesResponse.data as any[] | null)?.map((branch: any) => ({
          id: branch.id,
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          isActive: branch.is_active,
          status: branch.status,
          company_id: branch.company_id,
          code: branch.code,
        })) || [];

        setBranches(formattedBranches);

        // Load customers for opening balance preview
        const customersResponse = await databaseService.customers.getCustomers({ limit: 1000, company_id: companyId });
        if (customersResponse?.data) {
          const map: Record<string, string> = {};
          (customersResponse.data as any[]).forEach((c: any) => {
            if (c?.customer_code) map[String(c.customer_code)] = c.full_name || c.customer_name || c.name || "";
          });
          setCustomerMap(map);
        }

        // Load customers with balances for inline editing
        await loadCustomerBalances();
      } catch (err) {
        logger.error('Failed to load data:', err);
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
      logger.error("Failed to load staff users:", err);
    } finally {
      setLoadingStaff(false);
    }
  };


  useEffect(() => {
    loadStaffUsers();
  }, [companyId]);


  const handleEditBankAccount = (account: BankAccount) => {
    setError(null);
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


  const handleResetData = async (scope: "selected" | "all" = "all") => {
    const dateFilter =
      resetTransactionDate && resetDateMode !== "all"
        ? `${resetDateMode === "before" ? "đến hết ngày" : resetDateMode === "after" ? "từ" : "đúng"} ${resetTransactionDate}`
        : "";
    const actionLabel =
      scope === "all"
        ? `xóa toàn bộ dữ liệu${dateFilter ? ` ${dateFilter}` : ""}`
        : `xóa dữ liệu đã chọn${dateFilter ? ` ${dateFilter}` : ""}`;
    const confirmation = window.prompt(
      `Nhập CONFIRM để ${actionLabel} và đặt lại hệ thống`,
      "",
    );
    if (confirmation !== "CONFIRM") {
      return;
    }

    if (!companyId) {
      toast.warning("Không xác định được công ty. Vui lòng chọn công ty trước khi reset dữ liệu.");
      return;
    }

    const targets = scope === "all" ? { transactions: true, bankAccounts: true, branches: true } : resetTargets;
    const anySelected = Object.values(targets).some(Boolean);
    if (!anySelected) {
      toast.warning("Vui lòng chọn ít nhất một loại dữ liệu để reset.");
      return;
    }

    const parseBounds = (raw: string): { start: string; end: string } | null => {
      const d = parseDate(raw);
      if (!d) return null;
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      return { start: start.toISOString(), end: end.toISOString() };
    };

    if (resetDateMode !== "all" && targets.transactions && !resetTransactionDate) {
      toast.warning("Vui lòng nhập ngày để lọc giao dịch trước khi reset.");
      return;
    }

    if (resetDateMode !== "all" && resetTransactionDate && !parseBounds(resetTransactionDate)) {
      toast.warning("Ngày reset không đúng định dạng DD/MM/YYYY.");
      return;
    }

    if (scope !== "all" && resetDateMode !== "all" && resetTransactionDate && (targets.bankAccounts || targets.branches)) {
      toast.warning("Khi lọc giao dịch theo ngày, chỉ được chọn Giao dịch. Vui lòng bỏ chọn Tài khoản ngân hàng và Chi nhánh.");
      return;
    }

    try {
      // If branches are being reset, clear branch_id references first so the
      // delete does not violate FK constraints. This affects transactions,
      // bank_accounts and customers in the active tenant.
      if (targets.branches) {
        const { error: txBranchError } = await supabase
          .from("transactions")
          .update({ branch_id: null })
          .eq("company_id", companyId)
          .not("branch_id", "is", null);

        const { error: bankBranchError } = await supabase
          .from("bank_accounts")
          .update({ branch_id: null })
          .eq("company_id", companyId)
          .not("branch_id", "is", null);

        const { error: custBranchError } = await supabase
          .from("customers")
          .update({ branch_id: null })
          .eq("company_id", companyId)
          .not("branch_id", "is", null);

        const { error: userBranchError } = await supabase
          .from("users")
          .update({ branch_id: null })
          .eq("company_id", companyId)
          .not("branch_id", "is", null);

        if (txBranchError || bankBranchError || custBranchError || userBranchError) {
          logger.error("Branch reference clear errors:", {
            txBranchError,
            bankBranchError,
            custBranchError,
            userBranchError,
          });
          toast.error("Có lỗi khi xóa liên kết chi nhánh trước khi reset.");
          return;
        }
      }

      // Delete transactions first (references customers and bank_accounts)
      let txQuery = supabase.from("transactions").delete().eq("company_id", companyId);
      if (scope !== "all" && targets.transactions && resetDateMode !== "all" && resetTransactionDate) {
        const bounds = parseBounds(resetTransactionDate);
        if (bounds) {
          if (resetDateMode === "before") {
            txQuery = txQuery.lt("transaction_date", bounds.end);
          } else if (resetDateMode === "after") {
            txQuery = txQuery.gte("transaction_date", bounds.start);
          } else if (resetDateMode === "on") {
            txQuery = txQuery.gte("transaction_date", bounds.start).lt("transaction_date", bounds.end);
          }
        }
      }
      const txResult = targets.transactions ? await txQuery : { error: null };

      // Delete bank accounts
      const bankResult = targets.bankAccounts
        ? await supabase.from("bank_accounts").delete().eq("company_id", companyId)
        : { error: null };

      // Delete branches last (after references cleared)
      const branchResult = targets.branches
        ? await supabase.from("branches").delete().eq("company_id", companyId)
        : { error: null };

      if (txResult.error || bankResult.error || branchResult.error) {
        logger.error("Database deletion errors:", {
          txError: txResult.error,
          bankError: bankResult.error,
          branchError: branchResult.error,
        });
        toast.error(`Có lỗi khi xóa dữ liệu từ database:\n${txResult.error?.message || bankResult.error?.message || branchResult.error?.message}`);
        return;
      }

      logger.log("✅ Database reset successful", { scope, targets, resetDateMode, resetTransactionDate });

      const dateLabel =
        resetDateMode !== "all" && resetTransactionDate
          ? ` (${resetDateMode === "before" ? "đến" : resetDateMode === "after" ? "từ" : "đúng"} ${resetTransactionDate})`
          : "";
      toast.success(
        scope === "all" ? `Đã xóa toàn bộ dữ liệu thành công${dateLabel}!` : `Đã xóa dữ liệu đã chọn thành công${dateLabel}!`,
      );

      // Navigate to dashboard instead of reload to preserve session
      navigate('/dashboard', { replace: true });
    } catch (error) {
      logger.error("Reset data failed:", error);
      toast.error(`Có lỗi khi reset dữ liệu: ${error instanceof Error ? error.message : "Unknown error"}`);
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
    const fallbackCompanyId = branches.length > 0
      ? branches[0].company_id
      : (bankAccounts.length > 0 ? bankAccounts[0].company_id : undefined);

    const finalBranchId = editingBankAccount?.branch_id || user?.branch_id || fallbackBranchId;
    const finalCompanyId = editingBankAccount?.company_id || companyId || user?.company_id || user?.branch?.company_id || fallbackCompanyId;

    if (!finalCompanyId) {
      setError("Không xác định được công ty. Vui lòng chọn công ty hoặc liên hệ admin.");
      return;
    }

    try {
      const status = editingBankAccount
        ? (editingBankAccount.status || "active")
        : getInitialEntityStatus(
            user,
            "bank_accounts",
            user?.company?.approval_settings,
            false,
            canEditBankAccountSettings(user),
          );
      const payload: any = {
        id: editingBankAccount?.id,
        bank_name: (bankAccountForm.bankName || "").trim(),
        account_number: (bankAccountForm.accountNumber || "").trim(),
        account_name: (bankAccountForm.accountName || "").trim(),
        balance: nextBalance,
        is_active: editingBankAccount?.isActive ?? true,
        status,
        branch_id: finalBranchId,
        company_id: finalCompanyId,
      };
      const res = await databaseService.bankAccounts.upsertBankAccount(payload);
      if (res.error) throw new Error(getErrorMessage(res.error));
      const saved = (res.data as any) || {
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
        const status = (saved as any).status || (editingBankAccount ? editingBankAccount.status : "active");
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
                    status,
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
                status,
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
    setError(null);
    setEditingTransactionType(null);
    setTransactionTypeForm({ name: "", color: "blue", math_factor: 1, impact_type: "increase" });
    setIsTransactionTypeModalOpen(true);
  };


  const handleEditTransactionType = (type: TransactionType) => {
    setError(null);
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
      if (res.error) throw new Error(getErrorMessage(res.error));
      const saved = (res.data as any) || { 
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
    setError(null);
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
      toast.error("Trường mặc định không thể xóa.");
      return;
    }
    const confirmation = window.confirm(
      `Xóa trường "${field.name}"? Thao tác này không thể hoàn tác.`,
    );
    if (!confirmation) return;
    setCustomerFields((prev) => prev.filter((item) => item.id !== field.id));
  };


  const handleAddCustomerField = () => {
    setError(null);
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
    setError(null);
    setEditingBranch(branch);
    setBranchForm({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
    });
    setIsBranchModalOpen(true);
  };


  const handleAddBranch = () => {
    setError(null);
    setEditingBranch(null);
    setBranchForm({ name: "", address: "", phone: "" });
    setIsBranchModalOpen(true);
  };


  const handleDeleteBranch = async (branchId: string) => {
    try {
      const res = await databaseService.branches.deleteBranch(branchId, companyId);
      if (res.error) throw new Error(getErrorMessage(res.error));
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
      const finalCompanyId = editingBranch?.company_id || companyId || user?.company_id || user?.branch?.company_id || fallbackCompanyId;

      const status = editingBranch
        ? (editingBranch.status || "active")
        : getInitialEntityStatus(
            user,
            "branches",
            user?.company?.approval_settings,
            false,
            canEditBranchSettings(user),
          );
      const payload: any = {
        id: editingBranch?.id,
        name: (branchForm.name || "").trim(),
        address: (branchForm.address || "").trim(),
        phone: (branchForm.phone || "").trim(),
        company_id: finalCompanyId,
        code: editingBranch?.code || `BR-${Date.now()}`,
        is_active: editingBranch?.isActive ?? true,
        status,
      };
      const res = await databaseService.branches.upsertBranch(payload);
      if (res.error) throw new Error(getErrorMessage(res.error));
      const saved = (res.data as any) || {
        id: editingBranch?.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `branch-${Date.now()}`),
        name: (branchForm.name || "").trim(),
        address: (branchForm.address || "").trim(),
        phone: (branchForm.phone || "").trim(),
        is_active: true,
      };
      setBranches((prev) => {
        const exists = prev.some((b) => b.id === saved.id);
        const status = saved.status || (editingBranch ? editingBranch.status : "active");
        const next = exists
          ? prev.map((b) => (b.id === saved.id ? { id: saved.id, name: saved.name, address: saved.address || "", phone: saved.phone || "", isActive: saved.is_active !== false, status } : b))
          : [{ id: saved.id, name: saved.name, address: saved.address || "", phone: saved.phone || "", isActive: saved.is_active !== false, status }, ...prev];
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


  const handleOpeningFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setOpeningSuccess(null);
    if (!file) return;
    setOpeningFile(file);

    const codeHeaders = ["customer_code", "code", "Mã khách hàng", "Mã KH", "Mã"];
    const balanceHeaders = ["opening_balance", "balance", "Số dư đầu kỳ", "Số dư", "Số dư đầu"];
    const getCell = (row: any, headers: string[]) => {
      for (const h of headers) {
        if (row[h] !== undefined && row[h] !== null && row[h] !== "") return row[h];
      }
      return undefined;
    };

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
          const code = String(getCell(row, codeHeaders) ?? "").trim();
          const rawBalance = getCell(row, balanceHeaders);
          const opening = parseAmountOrNull(rawBalance);
          if (!code) {
            errors.push(`Dòng ${idx + 2}: Thiếu mã khách hàng`);
            return;
          }
          if (opening === null) {
            errors.push(`Dòng ${idx + 2}: Số dư đầu kỳ không hợp lệ (${rawBalance ?? ""})`);
            return;
          }
          parsed.push({ customer_code: code, opening_balance: opening });
        });
        setOpeningErrors(errors);
        setOpeningRows(parsed);
      } catch (err) {
        logger.error("Failed to parse opening balance file", err);
        setOpeningErrors(["Không đọc được file. Vui lòng kiểm tra định dạng."]);
        setOpeningRows([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };


  const handleImportOpeningBalance = async () => {
    if (!isAdmin(user) && !canManageAllCustomers(user)) {
      toast.warning("Bạn không có quyền thực hiện thao tác này.");
      return;
    }
    if (openingRows.length === 0) return;
    setIsOpeningProcessing(true);
    setOpeningSuccess(null);
    try {
      const res = await databaseService.customers.bulkUpdateOpeningBalances(openingRows, companyId || undefined);
      const resData = res.data as any;
      if (res.error || (resData?.errors && resData.errors.length > 0)) {
        const errs = (resData?.errors || []).map((e: any) => {
          const msg = e.message === "Customer not found" ? "Không tìm thấy khách hàng" : e.message;
          return `Dòng ${e.row + 2}: ${msg}${e.value ? ` (${e.value})` : ""}`;
        });
        if (res.error) errs.unshift(`Lỗi: ${res.error}`);
        setOpeningErrors(errs);
      } else {
        setOpeningErrors([]);
        await loadCustomerBalances();
        setActiveOpeningSubTab("list");
      }
      setOpeningSuccess(`Đã cập nhật ${resData?.updatedCount || 0} khách hàng.`);
    } catch (err) {
      logger.error("Import opening balance failed", err);
      setOpeningErrors(["Có lỗi khi nhập số dư. Vui lòng thử lại."]);
    } finally {
      setIsOpeningProcessing(false);
    }
  };


  const handleAddBankAccount = () => {
    setError(null);
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
    setError(null);
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
      logger.error("Error updating user details:", err);
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
      logger.error("Failed to update staff permission:", err);
      setError("Không cập nhật được quyền truy cập");
    }
  };


  // User management functions
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await databaseService.users.getUsers();
      if (error) throw new Error(String(error));
      setUsers((data as any[] | null) || []);
    } catch (err) {
      logger.error('Failed to load users:', err);
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
      logger.error('Failed to update user role:', err);
      toast.error('Failed to update user role');
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
      logger.error('Failed to promote user to admin_master:', err);
      setError('Không thể promote user lên Admin Master');
    }
  };


  // Refresh system data when the combined system tab is opened
  useEffect(() => {
    if (activeTab === "system") {
      loadUsers();
      loadStaffUsers();
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
      { id: "transaction-config", name: "Loại giao dịch & Công thức", icon: "💳" },
      { id: "system", name: "Tài khoản & Phân quyền", icon: "👥" },
    ].filter(tab => {
      // System tab (users, approval, integration) is admin-only; opening-balance is also available to staff with customer manage permission
      if (tab.id === "system" && !isAdmin(user)) return false;
      if (tab.id === "opening-balance" && !isAdmin(user) && !canManageAllCustomers(user)) return false;
      return true;
    }),
    [user],
  );

  // Reset to first available tab if the persisted active tab no longer exists (e.g. after a tab merge).
  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs]);

  return {
    user,
    companyId,
    navigate,
    darkMode,
    setDarkMode,
    activeTab,
    setActiveTab,
    activeOpeningSubTab,
    setActiveOpeningSubTab,
    autoApproveExternal,
    setAutoApproveExternal,
    error,
    setError,
    staffUsers,
    setStaffUsers,
    loadingStaff,
    setLoadingStaff,
    bankAccounts,
    setBankAccounts,
    isBankAccountModalOpen,
    setIsBankAccountModalOpen,
    editingBankAccount,
    setEditingBankAccount,
    bankAccountForm,
    setBankAccountForm,
    branches,
    setBranches,
    transactionTypes,
    setTransactionTypes,
    isTransactionTypeModalOpen,
    setIsTransactionTypeModalOpen,
    editingTransactionType,
    setEditingTransactionType,
    transactionTypeForm,
    setTransactionTypeForm,
    customerFields,
    setCustomerFields,
    isCustomerFieldModalOpen,
    setIsCustomerFieldModalOpen,
    editingCustomerField,
    setEditingCustomerField,
    customerFieldForm,
    setCustomerFieldForm,
    isBranchModalOpen,
    setIsBranchModalOpen,
    editingBranch,
    setEditingBranch,
    branchForm,
    setBranchForm,
    isCreateUserModalOpen,
    setIsCreateUserModalOpen,
    successMessage,
    setSuccessMessage,
    expandedPermissions,
    setExpandedPermissions,
    openingFile,
    setOpeningFile,
    openingRows,
    setOpeningRows,
    openingErrors,
    setOpeningErrors,
    openingSuccess,
    setOpeningSuccess,
    isOpeningProcessing,
    setIsOpeningProcessing,
    customerMap,
    setCustomerMap,
    customerBalances,
    setCustomerBalances,
    customerBalanceSearch,
    setCustomerBalanceSearch,
    isLoadingCustomerBalances,
    setIsLoadingCustomerBalances,
    customerBalanceErrors,
    setCustomerBalanceErrors,
    customerBalanceSuccess,
    setCustomerBalanceSuccess,
    isSavingCustomerBalances,
    setIsSavingCustomerBalances,
    users,
    setUsers,
    loadingUsers,
    setLoadingUsers,
    isEditUserModalOpen,
    setIsEditUserModalOpen,
    editingUser,
    setEditingUser,
    userEditForm,
    setUserEditForm,
    backupLoading,
    setBackupLoading,
    restoreFile,
    setRestoreFile,
    restoreLoading,
    setRestoreLoading,
    backupHistory,
    setBackupHistory,
    loadingBackupHistory,
    setLoadingBackupHistory,
    loading,
    setLoading,
    getErrorMessage,
    handleCreateBackup,
    handleDownloadBackup,
    handleRestore,
    handleRestoreFromDatabase,
    handleSelectiveRestore,
    handleRevertTable,
    loadCustomerBalances,
    loadStaffUsers,
    handleEditBankAccount,
    resetTargets,
    setResetTargets,
    resetTransactionDate,
    setResetTransactionDate,
    resetDateMode,
    setResetDateMode,
    handleResetData,
    handleBankAccountFormChange,
    handleSaveBankAccount,
    handleAddTransactionType,
    handleEditTransactionType,
    handleSaveTransactionType,
    handleEditCustomerField,
    handleDeleteCustomerField,
    handleAddCustomerField,
    handleSaveCustomerField,
    getAccountType,
    handleToggleActive,
    handleEditBranch,
    handleAddBranch,
    handleDeleteBranch,
    handleBranchFormChange,
    handleSaveBranch,
    handleDownloadOpeningTemplate,
    handleOpeningFile,
    handleImportOpeningBalance,
    handleAddBankAccount,
    handleOpenEditUser,
    handleSaveUserDetails,
    handleUpdateStaffPermission,
    loadUsers,
    handleUpdateUserRole,
    handlePromoteToAdminMaster,
    approvalSettings,
    setApprovalSettings,
    handleApprovalSettingChange,
    handleCustomerCodePrefixChange,
    handleCustomerCodeDigitsChange,
    handleCustomerCodeFillGapsChange,
    saveApprovalSettings,
    isSavingApprovalSettings,
    tabs
  };
}

export type SettingsContextValue = ReturnType<typeof useSettingsState>;
