import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "../../utils/toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCompanyId } from "../../hooks/useCompanyId";
import { useDebounce } from "../../hooks/useDebounce";
import { databaseService } from "../../services/database";
import type { Transaction, TransactionStatus } from "../../types";
import { useAuthContext as useAuth } from "@superapp/iam";
import { canApproveTransactions } from "../../utils/permissions";
import { formatCurrency, formatDate, fetchColorSettings, getTransactionTypeColor, getTransactionTypeAmountColor } from "../../utils/formatting";
import { getCustomerBalanceDelta, parseAmount, normalizeTransactionType } from "../../services/businessLogic";
import { useTransactionTypes } from "../../contexts/TransactionTypeContext";
import { LoadingFallback } from "../../components/UI/FallbackUI";
import Pagination from "../../components/UI/Pagination";
import PageHeader from "../../components/UI/PageHeader";
import Button from "../../components/UI/Button";
import TransactionEditModal, { type TransactionEditFormValues } from "./components/TransactionEditModal";

interface TransactionListState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  searchTerm: string;
  dateRange: {
    start: string;
    end: string;
  } | null;
  transactionType: string | null;
  branchFilter: string | null;
  bankAccountFilter: string | null;
  userFilter: string | null;
  customerFilter: {
    id: string | null;
    name: string | null;
  } | null;
  statusFilter: "all" | TransactionStatus;
  groupBy: "" | "day" | "week" | "month" | "quarter" | "year" | "branch" | "transaction_type" | "customer";
  groupTransactions: Transaction[];
}

interface GroupSummary {
  label: string;
  count: number;
  increase: number;
  decrease: number;
  deposit: number;
  adjustment: number;
  net: number;
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

const TransactionList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const canApprove = canApproveTransactions(user);
  const {
    getNameById: getTransactionTypeName,
    getMathFactor,
    typesForDropdown,
  } = useTransactionTypes();
  const [searchParams] = useSearchParams();
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [bankAccounts, setBankAccounts] = useState<{ id: string; name: string }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string; email?: string; company_id?: string | null }[]>([]);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [state, setState] = useState<TransactionListState>({
    transactions: [],
    loading: true,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 20,
    searchTerm: "",
    dateRange: null,
    transactionType: null,
    branchFilter: null,
    bankAccountFilter: null,
    userFilter: null,
    customerFilter: null,
    statusFilter: "all",
    groupBy: "",
    groupTransactions: [],
  });

  // Debounce search term so API isn't called on every keystroke (300ms delay)
  const debouncedSearchTerm = useDebounce(state.searchTerm, 300);

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const COLUMN_OPTIONS = [
    { key: "date", label: "Ngày giao dịch", always: true },
    { key: "customer", label: "Khách hàng", always: true },
    { key: "type", label: "Loại giao dịch" },
    { key: "amount", label: "Số tiền" },
    { key: "branch", label: "Văn phòng" },
    { key: "bank", label: "Tài khoản" },
    { key: "creator", label: "Người thực hiện" },
    { key: "code", label: "Mã GD" },
    { key: "status", label: "Trạng thái" },
    { key: "actions", label: "Hành động", always: true },
  ];

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() =>
    COLUMN_OPTIONS.reduce((acc, col) => {
      acc[col.key] = true;
      return acc;
    }, {} as Record<string, boolean>)
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const visibleColumnKeys = useMemo(
    () => COLUMN_OPTIONS.filter((col) => col.always || visibleColumns[col.key]).map((col) => col.key),
    [visibleColumns]
  );

  // Initialize customer filter from URL params
  useEffect(() => {
    const customerId = searchParams.get("customer_id");
    const customerName = searchParams.get("customer_name");
    const branchId = searchParams.get("branch_id");

    if (customerId) {
      setState((prev) => ({
        ...prev,
        customerFilter: {
          id: customerId,
          name: customerName || null,
        },
      }));
    }

    if (branchId) {
      setState((prev) => ({
        ...prev,
        branchFilter: branchId,
      }));
    }
  }, [searchParams]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const filters = {
        search: debouncedSearchTerm || undefined,
        dateRange: state.dateRange || undefined,
        transaction_type: state.transactionType || undefined,
        customer_id: state.customerFilter?.id || undefined,
        branch_id: state.branchFilter || undefined,
        bank_account_id: state.bankAccountFilter || undefined,
        created_by: state.userFilter || undefined,
        status: state.statusFilter === "all" ? undefined : state.statusFilter,
        company_id: companyId,
        page: state.currentPage,
        pageSize: state.pageSize,
      };

      const response = await databaseService.transactions.getTransactions(filters);

      if (response.error) {
        throw new Error(response.error);
      }

      const rawTransactions = response.data || [];

      setState((prev) => ({
        ...prev,
        transactions: rawTransactions,
        totalCount: response.count ?? rawTransactions.length,
        loading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to fetch transactions",
        loading: false,
      }));
    }
  }, [debouncedSearchTerm, state.dateRange, state.transactionType, state.customerFilter, state.branchFilter, state.bankAccountFilter, state.userFilter, state.statusFilter, state.currentPage, state.pageSize, companyId]);

  const fetchGroupTransactions = useCallback(async () => {
    if (!state.groupBy) return;

    try {
      const filters = {
        search: debouncedSearchTerm || undefined,
        dateRange: state.dateRange || undefined,
        transaction_type: state.transactionType || undefined,
        customer_id: state.customerFilter?.id || undefined,
        branch_id: state.branchFilter || undefined,
        bank_account_id: state.bankAccountFilter || undefined,
        created_by: state.userFilter || undefined,
        status: state.statusFilter === "all" ? undefined : state.statusFilter,
        company_id: companyId,
        page: 1,
        pageSize: 1000,
      };

      const response = await databaseService.transactions.getTransactions(filters);

      if (response.error) {
        throw new Error(response.error);
      }

      setState((prev) => ({
        ...prev,
        groupTransactions: response.data || [],
      }));
    } catch (err) {
      // Group summary is best-effort; don't block the main list on errors.
      setState((prev) => ({
        ...prev,
        groupTransactions: [],
      }));
    }
  }, [debouncedSearchTerm, state.dateRange, state.transactionType, state.customerFilter, state.branchFilter, state.bankAccountFilter, state.userFilter, state.statusFilter, state.groupBy, companyId]);

  // Refetch unpaginated transactions for the group summary whenever the
  // visible transaction list changes (filters, pagination, mutations) or the
  // grouping mode changes.
  useEffect(() => {
    fetchGroupTransactions();
  }, [fetchGroupTransactions, state.transactions, state.groupBy]);

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => map.set(u.id, u.full_name || u.email || u.id));
    return map;
  }, [users]);

  const topScrollRef = useRef<HTMLDivElement>(null);
  const topInnerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTopScrollWidth = () => {
      if (tableContainerRef.current && topInnerRef.current) {
        topInnerRef.current.style.width = `${tableContainerRef.current.scrollWidth}px`;
      }
    };
    updateTopScrollWidth();
    window.addEventListener("resize", updateTopScrollWidth);
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && tableContainerRef.current) {
      resizeObserver = new ResizeObserver(updateTopScrollWidth);
      resizeObserver.observe(tableContainerRef.current);
    }
    return () => {
      window.removeEventListener("resize", updateTopScrollWidth);
      if (resizeObserver && tableContainerRef.current) {
        resizeObserver.unobserve(tableContainerRef.current);
      }
    };
  }, [state.transactions, state.groupBy, visibleColumnKeys]);

  const handleTopScroll = useCallback(() => {
    if (topScrollRef.current && tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  }, []);

  const handleTableScroll = useCallback(() => {
    if (tableContainerRef.current && topScrollRef.current) {
      topScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    }
  }, []);

  useEffect(() => {
    const loadFilters = async () => {
      const [branchResult, bankResult, customerResult, userResult] = await Promise.all([
        databaseService.branches.getBranches(companyId, "active"),
        databaseService.bankAccounts.getBankAccounts(companyId, "active"),
        databaseService.customers.getCustomers({ limit: 500, company_id: companyId, status: "active" }),
        databaseService.users.getUsers(),
      ]);

      const getName = (record: Record<string, unknown>, ...keys: string[]) => {
        for (const key of keys) {
          const value = record[key];
          if (value != null) return String(value);
        }
        return String(record.id ?? "");
      };

      if (branchResult?.data) {
        setBranches(
          branchResult.data.map((branch: Record<string, unknown>) => ({
            id: String(branch.id ?? ""),
            name: getName(branch, "name", "branch_name", "code"),
          })),
        );
      }

      if (bankResult?.data) {
        setBankAccounts(
          bankResult.data.map((account: Record<string, unknown>) => ({
            id: String(account.id ?? ""),
            name: getName(account, "account_name", "bank_name"),
          })),
        );
      }

      if (customerResult?.data) {
        setCustomers(
          customerResult.data.map((customer: Record<string, unknown>) => ({
            id: String(customer.id ?? ""),
            name: getName(customer, "full_name", "customer_name", "customer_code"),
            code: customer.customer_code == null ? undefined : String(customer.customer_code),
          })),
        );
      }

      if (userResult?.data) {
        const allUsers = userResult.data.map((u: Record<string, unknown>) => ({
          id: String(u.id ?? ""),
          full_name: getName(u, "full_name", "email", "name"),
          email: u.email == null ? undefined : String(u.email),
          company_id: u.company_id == null ? undefined : String(u.company_id),
        }));
        setUsers(
          companyId ? allUsers.filter((u) => u.company_id === companyId || !u.company_id) : allUsers,
        );
      }

    };
    loadFilters();
  }, [companyId]);

  // Load transactions on mount and when filters change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Load color settings on mount
  const [colorsReady, setColorsReady] = useState(false);
  
  useEffect(() => {
    fetchColorSettings().then(() => {
      setColorsReady(true);
    });
  }, []);

  const handlePageChange = (page: number) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setState((prev) => ({ ...prev, pageSize, currentPage: 1 }));
  };

  const handleSearch = (term: string) => {
    setState((prev) => ({ ...prev, searchTerm: term, currentPage: 1 }));
  };

  const applyPresetRange = (preset: "today" | "lastWeek" | "thisMonth" | "thisQuarter" | "thisYear" | "all") => {
    if (preset === "all") {
      setState((prev) => ({ ...prev, dateRange: null, currentPage: 1 }));
      return;
    }
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    if (preset === "today") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (preset === "lastWeek") {
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      end.setDate(now.getDate() - diffToMonday - 1);
      end.setHours(23, 59, 59, 999);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (preset === "thisMonth") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else if (preset === "thisQuarter") {
      const quarter = Math.floor(start.getMonth() / 3) * 3;
      start.setMonth(quarter, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(quarter + 3, 0);
      end.setHours(23, 59, 59, 999);
    } else if (preset === "thisYear") {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
    }
    setState((prev) => ({
      ...prev,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      currentPage: 1,
    }));
    setCustomStart(start.toISOString().slice(0, 10));
    setCustomEnd(end.toISOString().slice(0, 10));
    setShowDateMenu(false);
  };

  const applyCustomDateRange = () => {
    if (!customStart || !customEnd) return;
    const start = new Date(customStart);
    const end = new Date(customEnd);
    if (start > end) return;
    setState((prev) => ({
      ...prev,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      currentPage: 1,
    }));
    setShowDateMenu(false);
  };

  const clearDateRange = () => {
    setCustomStart("");
    setCustomEnd("");
    setState((prev) => ({ ...prev, dateRange: null, currentPage: 1 }));
  };

  const handleBranchChange = (branchId: string) => {
    setState((prev) => ({ ...prev, branchFilter: branchId || null, currentPage: 1 }));
  };

  const handleBankChange = (bankId: string) => {
    setState((prev) => ({ ...prev, bankAccountFilter: bankId || null, currentPage: 1 }));
  };

  const handleUserChange = (userId: string) => {
    setState((prev) => ({ ...prev, userFilter: userId || null, currentPage: 1 }));
  };

  const handleCustomerChange = (customerId: string) => {
    if (!customerId) {
      setState((prev) => ({ ...prev, customerFilter: null, currentPage: 1 }));
      return;
    }
    const selected = customers.find((c) => c.id === customerId);
    setState((prev) => ({
      ...prev,
      customerFilter: { id: customerId, name: selected?.name || prev.customerFilter?.name || null },
      currentPage: 1,
    }));
  };

  const handleGroupByChange = (groupBy: TransactionListState["groupBy"]) => {
    setState((prev) => ({ ...prev, groupBy }));
  };

  const handleDelete = useCallback(
    async (transactionId: string) => {
      if (!confirm("Bạn có chắc muốn xóa giao dịch này?")) return;
      try {
        const result = await databaseService.transactions.deleteTransaction(transactionId);
        if (result.error) {
          toast.error("Xóa giao dịch thất bại");
        } else {
          fetchTransactions();
        }
      } catch (e) {
        toast.error("Xóa giao dịch thất bại");
      }
    },
    [fetchTransactions],
  );

  const openEditModal = useCallback((tx: Transaction) => {
    setEditingTx(tx);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditingTx(null);
  }, []);

  const handleEditSubmit = useCallback(async (values: TransactionEditFormValues) => {
    if (!editingTx) return;
    const amt = parseAmount(values.amount);
    if (!Number.isFinite(amt) || amt === 0) {
      toast.error("Số tiền không hợp lệ");
      return;
    }
    const dateIso = values.transaction_date
      ? new Date(values.transaction_date).toISOString()
      : editingTx.transaction_date;
    try {
      const result = await databaseService.transactions.updateTransaction(
        editingTx.id,
        {
          transaction_type: values.transaction_type,
          transaction_date: dateIso,
          amount: amt,
          description: values.description.trim() || null,
          bank_account_id: values.bank_account_id || null,
          branch_id: values.branch_id || null,
          reference_number: values.reference_number.trim() || null,
          transaction_code: editingTx.transaction_code,
          customer_id: values.customer_id || null,
          created_by: editingTx.created_by,
          company_id: editingTx.company_id,
        }
      );
      if (result.error) {
        toast.error("Cập nhật giao dịch thất bại");
      } else {
        closeEditModal();
        fetchTransactions();
      }
    } catch (e) {
      toast.error("Cập nhật giao dịch thất bại");
    }
  }, [closeEditModal, editingTx, fetchTransactions]);

  const getBranchName = (branchId: string): string => {
    const match = branches.find((branch) => branch.id === String(branchId));
    return match?.name || "N/A";
  };

  const getCustomerCode = (customerId?: string | null) => {
    if (!customerId) return "";
    const match = customers.find((c) => c.id === String(customerId));
    return match?.code || "";
  };

  const getCustomerName = (transaction: Transaction) => {
    return (
      transaction.customer_name ||
      (transaction.customer_id
        ? customers.find((c) => c.id === String(transaction.customer_id))?.name
        : null) ||
      t("transactions.noCustomer")
    );
  };

  const hasCustomerFilter = Boolean(state.customerFilter?.id);

  const paginationInfo = useMemo(() => {
    if (state.totalCount === 0) return { start: 0, end: 0, total: 0 };
    const start = (state.currentPage - 1) * state.pageSize + 1;
    const end = Math.min(state.currentPage * state.pageSize, state.totalCount);
    return { start, end, total: state.totalCount };
  }, [state.currentPage, state.pageSize, state.totalCount]);

  const userOptions = useMemo(() => {
    const uniqueUsers = new Map<string, string>();
    users.forEach((u) => uniqueUsers.set(u.id, userMap.get(u.id) || u.id));
    state.transactions.forEach((t) => {
      if (t.created_by) {
        const displayName = userMap.get(t.created_by) || t.creator_name || t.created_by;
        uniqueUsers.set(t.created_by, displayName);
      }
    });
    return Array.from(uniqueUsers.entries()).sort(([, a], [, b]) => a.localeCompare(b));
  }, [state.transactions, users, userMap]);

  const groupedData = useMemo(() => {
    if (!state.groupBy) return null;

    return state.groupTransactions.reduce<Record<string, GroupSummary>>((acc, tx) => {
      const d = new Date(tx.transaction_date);
      let key = "";
      let label = "";

      switch (state.groupBy) {
        case "day": {
          const iso = d.toISOString().slice(0, 10);
          key = `day:${iso}`;
          label = formatDate(tx.transaction_date);
          break;
        }
        case "week": {
          const year = d.getFullYear();
          const week = getISOWeek(d);
          key = `week:${year}-${String(week).padStart(2, "0")}`;
          label = `Tuần ${week}, ${year}`;
          break;
        }
        case "month": {
          const year = d.getFullYear();
          const month = d.getMonth() + 1;
          key = `month:${year}-${String(month).padStart(2, "0")}`;
          label = `Tháng ${month}/${year}`;
          break;
        }
        case "quarter": {
          const year = d.getFullYear();
          const quarter = getQuarter(d);
          key = `quarter:${year}-Q${quarter}`;
          label = `Quý ${quarter}/${year}`;
          break;
        }
        case "year": {
          const year = d.getFullYear();
          key = `year:${year}`;
          label = `Năm ${year}`;
          break;
        }
        case "branch": {
          const branchName = tx.branch_id ? getBranchName(tx.branch_id) : "Không có văn phòng";
          key = `branch:${tx.branch_id || "none"}`;
          label = branchName;
          break;
        }
        case "transaction_type": {
          const typeName = getTransactionTypeName(tx.transaction_type);
          key = `type:${tx.transaction_type}`;
          label = typeName;
          break;
        }
        case "customer": {
          const customerName =
            tx.customer_name ||
            (tx.customer_id ? customers.find((c) => c.id === String(tx.customer_id))?.name : null) ||
            "Không có khách hàng";
          key = `customer:${tx.customer_id || "none"}`;
          label = customerName;
          break;
        }
      }

      if (!acc[key]) {
        acc[key] = { label, count: 0, increase: 0, decrease: 0, deposit: 0, adjustment: 0, net: 0 };
      }

      const delta = getCustomerBalanceDelta(tx.transaction_type, tx.amount, getMathFactor(tx.transaction_type));
      const canonicalType = normalizeTransactionType(tx.transaction_type);
      if (canonicalType === "adjustment") {
        acc[key].adjustment += delta;
      } else if (canonicalType === "deposit") {
        acc[key].deposit += Math.abs(delta);
      } else if (delta > 0) {
        acc[key].increase += Math.abs(delta);
      } else if (delta < 0) {
        acc[key].decrease += Math.abs(delta);
      }
      acc[key].count += 1;
      acc[key].net += delta;

      return acc;
    }, {});
  }, [state.groupBy, state.groupTransactions, getBranchName, customers, getTransactionTypeName, getMathFactor]);

  const filteredGroupedEntries = useMemo(() => {
    if (!groupedData) return [];

    return Object.entries(groupedData).sort(([keyA, a], [keyB, b]) => {
      if (state.groupBy === "day" || state.groupBy === "week" || state.groupBy === "month" || state.groupBy === "quarter" || state.groupBy === "year") {
        return keyA.localeCompare(keyB);
      }
      return a.label.localeCompare(b.label);
    });
  }, [groupedData, state.groupBy]);

  const timeLabel = useMemo(() => {
    if (!state.dateRange) return "Tất cả thời gian";
    const start = new Date(state.dateRange.start);
    const end = new Date(state.dateRange.end);
    const formatter = (d: Date) => d.toLocaleDateString("vi-VN");
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Hôm nay";
    if (days === 6) return "Tuần này";
    return `${formatter(start)} - ${formatter(end)}`;
  }, [state.dateRange]);

  useEffect(() => {
    if (!state.dateRange) {
      setCustomStart("");
      setCustomEnd("");
      return;
    }
    setCustomStart(state.dateRange.start.slice(0, 10));
    setCustomEnd(state.dateRange.end.slice(0, 10));
  }, [state.dateRange]);

  if (state.loading || !colorsReady) {
    return (
      <LoadingFallback
        title="Đang tải"
        message="Vui lòng chờ trong giây lát"
      />
    );
  }

  return (
    <div>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeader
            title="Danh sách giao dịch"
            subtitle="Xem và quản lý tất cả các giao dịch"
            actions={
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <input
                  type="search"
                  value={state.searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Tìm kiếm giao dịch, khách hàng..."
                  className="flex-1 sm:w-72 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => fetchTransactions()}
                >
                  Làm mới
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate("/import/transactions")}
                  className="hidden sm:inline-flex"
                >
                  Nhập giao dịch
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate("/import/transactions?tab=bulk")}
                  className="hidden sm:inline-flex"
                >
                  Nhập hàng loạt
                </Button>
              </div>
            }
          />

          {/* Status Tabs */}
          <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700 mb-4">
            {[
              { key: "all", label: "Tất cả", color: "blue" },
              { key: "draft", label: "Nháp", color: "gray" },
              { key: "pending", label: "Chờ duyệt", color: "amber" },
              { key: "completed", label: "Hoàn thành", color: "green" },
              { key: "rejected", label: "Từ chối", color: "red" },
            ].map((tab) => {
              const active = state.statusFilter === tab.key;
              const colorClass =
                tab.color === "blue"
                  ? "text-blue-600 dark:text-blue-300 border-blue-600 dark:border-blue-300"
                  : tab.color === "gray"
                  ? "text-gray-600 dark:text-gray-300 border-gray-600 dark:border-gray-300"
                  : tab.color === "amber"
                  ? "text-amber-600 dark:text-amber-300 border-amber-600 dark:border-amber-300"
                  : tab.color === "green"
                  ? "text-green-600 dark:text-green-300 border-green-600 dark:border-green-300"
                  : "text-red-600 dark:text-red-300 border-red-600 dark:border-red-300";
              const badgeClass =
                tab.color === "amber"
                  ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                  : tab.color === "red"
                  ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                  : tab.color === "green"
                  ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
              return (
                <button
                  key={tab.key}
                  className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${active ? `${colorClass} border-b-2` : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
                  onClick={() => setState(prev => ({ ...prev, statusFilter: tab.key as typeof prev.statusFilter, currentPage: 1 }))}
                >
                  {tab.label}
                  {active && tab.key !== "all" && <span className={`py-0.5 px-2 rounded-full text-xs ${badgeClass}`}>{state.totalCount}</span>}
                </button>
              );
            })}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 mb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDateMenu((v) => !v)}
                  className={`w-full inline-flex items-center justify-between rounded-md border ${showDateMenu ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300 dark:border-gray-700"} bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white`}
                >
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {timeLabel}
                  </span>
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showDateMenu && (
                  <div className="absolute z-50 mt-2 w-full max-w-xs sm:max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 space-y-3">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">Khoảng thời gian</div>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { k: "today", l: "Hôm nay" },
                        { k: "lastWeek", l: "Tuần trước" },
                        { k: "thisMonth", l: "Tháng này" },
                        { k: "thisQuarter", l: "Quý này" },
                        { k: "thisYear", l: "Năm nay" },
                        { k: "all", l: "Tất cả thời gian" },
                      ].map((o) => (
                        <button key={o.k} className="text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm text-gray-900 dark:text-white transition-colors" onClick={() => applyPresetRange(o.k as any)}>{o.l}</button>
                      ))}
                    </div>
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">Tùy chọn</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-xs text-gray-500">Từ ngày</span>
                        <input
                          type="date"
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                          className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-xs text-gray-500">Đến ngày</span>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={(e) => setCustomEnd(e.target.value)}
                          className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          className="px-3 py-1 rounded-md text-sm border border-gray-300 dark:border-gray-600"
                          onClick={() => setShowDateMenu(false)}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 rounded-md text-sm bg-blue-600 text-white"
                          onClick={applyCustomDateRange}
                        >
                          Áp dụng
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <select
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                value={state.branchFilter || ""}
                onChange={(e) => handleBranchChange(e.target.value)}
              >
                <option value="">Tất cả văn phòng</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <select
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                value={state.bankAccountFilter || ""}
                onChange={(e) => handleBankChange(e.target.value)}
              >
                <option value="">Tất cả tài khoản</option>
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <select
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                value={state.userFilter || ""}
                onChange={(e) => handleUserChange(e.target.value)}
              >
                <option value="">Tất cả người thực hiện</option>
                {userOptions.map(([userId, displayName]) => (
                  <option key={userId} value={userId}>{displayName}</option>
                ))}
              </select>

              <select
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                value={state.customerFilter?.id || ""}
                onChange={(e) => handleCustomerChange(e.target.value)}
              >
                <option value="">Tất cả khách hàng</option>
                {state.customerFilter?.id && !customers.some((c) => c.id === state.customerFilter?.id) && (
                  <option value={state.customerFilter.id}>{state.customerFilter.name || state.customerFilter.id}</option>
                )}
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                value={state.groupBy}
                onChange={(e) => handleGroupByChange(e.target.value as TransactionListState["groupBy"])}
              >
                <option value="">Không nhóm</option>
                <option value="day">Ngày</option>
                <option value="week">Tuần</option>
                <option value="month">Tháng</option>
                <option value="quarter">Quý</option>
                <option value="year">Năm</option>
                <option value="branch">Văn phòng</option>
                <option value="transaction_type">Loại giao dịch</option>
                <option value="customer">Khách hàng</option>
              </select>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColumnMenu((v) => !v)}
                  className={`w-full inline-flex items-center justify-between rounded-md border ${showColumnMenu ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300 dark:border-gray-700"} bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white`}
                >
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Cột hiển thị
                  </span>
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showColumnMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowColumnMenu(false)} />
                    <div className="absolute z-40 right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 space-y-1">
                      {COLUMN_OPTIONS.map((col) => (
                        <label
                          key={col.key}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${col.always ? "text-gray-400 dark:text-gray-500 cursor-not-allowed" : "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"}`}
                        >
                          <input
                            type="checkbox"
                            checked={col.always || visibleColumns[col.key]}
                            disabled={col.always}
                            onChange={() => toggleColumn(col.key)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-900 dark:text-white">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Hiển thị {paginationInfo.start} - {paginationInfo.end} / {paginationInfo.total} giao dịch
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-300">Số dòng/trang:</label>
                <select
                  className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
                  value={state.pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {hasCustomerFilter && (
            <div className="sm:hidden mb-3">
              <button
                type="button"
                onClick={() => navigate("/customers")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Quay lại khách hàng
              </button>
            </div>
          )}

          <div className="hidden sm:block">
            {groupedData && (
              <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Tổng hợp theo nhóm</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{filteredGroupedEntries.length} nhóm</span>
                  </div>
                  {(state.groupBy === "day" || state.groupBy === "week" || state.groupBy === "month" || state.groupBy === "quarter" || state.groupBy === "year") && (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
                      />
                      <span className="text-xs text-gray-500">-</span>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={applyCustomDateRange}
                        className="px-2 py-1 rounded-md text-xs bg-blue-600 text-white"
                      >
                        Lọc
                      </button>
                      {state.dateRange && (
                        <button
                          type="button"
                          onClick={clearDateRange}
                          className="px-2 py-1 rounded-md text-xs border border-gray-300 dark:border-gray-600"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nhóm</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Số giao dịch</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tổng phát sinh tăng</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tổng phát sinh giảm</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tổng đặt cọc</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tổng điều chỉnh</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Net</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredGroupedEntries.map(([key, data]) => (
                          <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-700/60">
                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{data.label}</td>
                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right text-xs sm:text-sm text-gray-700 dark:text-gray-200">{data.count}</td>
                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(data.increase)}</td>
                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(data.decrease)}</td>
                            <td className={`px-4 sm:px-6 py-3 whitespace-nowrap text-right text-xs sm:text-sm font-semibold ${data.deposit > 0 ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-300"}`}>{formatCurrency(data.deposit)}</td>
                            <td className={`px-4 sm:px-6 py-3 whitespace-nowrap text-right text-xs sm:text-sm font-semibold ${data.adjustment > 0 ? "text-red-600 dark:text-red-400" : data.adjustment < 0 ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-300"}`}>{formatCurrency(data.adjustment)}</td>
                            <td className={`px-4 sm:px-6 py-3 whitespace-nowrap text-right text-xs sm:text-sm font-semibold ${data.net > 0 ? "text-red-600 dark:text-red-400" : data.net < 0 ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-300"}`}>{formatCurrency(data.net)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="h-4 overflow-x-auto overflow-y-hidden bg-gray-100 dark:bg-gray-800 rounded mb-2" ref={topScrollRef} onScroll={handleTopScroll}>
              <div ref={topInnerRef} className="h-1" />
            </div>
            <div ref={tableContainerRef} className="overflow-x-auto relative" onScroll={handleTableScroll}>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="sticky left-0 z-30 w-32 px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600">Ngày giao dịch</th>
                    <th className="sticky left-32 z-20 w-48 px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600">Khách hàng</th>
                    {visibleColumnKeys.includes("type") && (
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Loại giao dịch</th>
                    )}
                    {visibleColumnKeys.includes("amount") && (
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Số tiền</th>
                    )}
                    {visibleColumnKeys.includes("branch") && (
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Văn phòng</th>
                    )}
                    {visibleColumnKeys.includes("bank") && (
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tài khoản</th>
                    )}
                    {visibleColumnKeys.includes("creator") && (
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Người thực hiện</th>
                    )}
                    {visibleColumnKeys.includes("code") && (
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mã GD</th>
                    )}
                    {visibleColumnKeys.includes("status") && (
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</th>
                    )}
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {state.transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="sticky left-0 z-20 w-32 px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="sticky left-32 z-10 w-48 px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                        {transaction.customer_id ? (
                          <button
                            type="button"
                            className="block text-left bg-transparent p-0 border-none text-gray-900 dark:text-white hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors max-w-44 truncate font-medium"
                            title={transaction.customer_name || customers.find(c => c.id === String(transaction.customer_id))?.name || `Customer #${transaction.customer_id}`}
                            onClick={() => navigate(`/customers/${transaction.customer_id}`)}
                          >
                            {transaction.customer_name || (transaction.customer_id ? customers.find(c => c.id === String(transaction.customer_id))?.name : null) || `Customer #${transaction.customer_id}`}
                          </button>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">Không có khách hàng</span>
                        )}
                        {getCustomerCode(transaction.customer_id) ? (
                          <div className="mt-0.5 font-mono text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{getCustomerCode(transaction.customer_id)}</div>
                        ) : null}
                      </td>
                      {visibleColumnKeys.includes("type") && (
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}
                          >
                            {getTransactionTypeName(transaction.transaction_type)}
                          </span>
                        </td>
                      )}
                      {visibleColumnKeys.includes("amount") && (
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                          <span
                            className={`text-xs sm:text-sm font-bold ${getTransactionTypeAmountColor(transaction.transaction_type, transaction.amount)}`}
                          >
                            {formatCurrency(parseAmount(transaction.amount))}
                          </span>
                        </td>
                      )}
                      {visibleColumnKeys.includes("branch") && (
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                          {transaction.branch_name || "—"}
                        </td>
                      )}
                      {visibleColumnKeys.includes("bank") && (
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                          {transaction.bank_account_name || transaction.bank_account_id ? `#${transaction.bank_account_id}` : "Không có tài khoản"}
                        </td>
                      )}
                      {visibleColumnKeys.includes("creator") && (
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                          {userMap.get(transaction.created_by || "") || transaction.creator_name || transaction.created_by || "—"}
                        </td>
                      )}
                      {visibleColumnKeys.includes("code") && (
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs">
                            {transaction.transaction_code}
                          </span>
                        </td>
                      )}
                      {visibleColumnKeys.includes("status") && (
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          {transaction.status === "draft" ? (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Nháp</span>
                          ) : transaction.status === "pending" ? (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Chờ duyệt</span>
                          ) : transaction.status === "rejected" ? (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Từ chối</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Hoàn thành</span>
                          )}
                        </td>
                      )}
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {transaction.status === "draft" && (
                            <button
                              type="button"
                              className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                              onClick={async () => {
                                if (!confirm("Gửi giao dịch Nháp để chờ duyệt?")) return;
                                const { error } = await databaseService.transactions.updateTransaction(transaction.id, { status: "pending" });
                                if (error) toast.error("Lỗi khi gửi duyệt"); else fetchTransactions();
                              }}
                            >
                              Gửi duyệt
                            </button>
                          )}
                          {canApprove && (transaction.status === "pending" || transaction.status === "rejected") && (
                            <button
                              type="button"
                              className="px-2 py-1 rounded border border-green-300 dark:border-green-600 text-green-700 dark:text-green-200 bg-green-50 dark:bg-green-900/40 hover:bg-green-100 dark:hover:bg-green-800 font-medium"
                              onClick={async () => {
                                if (!confirm("Duyệt giao dịch vào công nợ?")) return;
                                const { error } = await databaseService.transactions.updateTransaction(transaction.id, { status: "completed" });
                                if (error) toast.error("Lỗi khi duyệt"); else fetchTransactions();
                              }}
                            >
                              Duyệt
                            </button>
                          )}
                          {canApprove && transaction.status === "pending" && (
                            <button
                              type="button"
                              className="px-2 py-1 rounded border border-red-300 dark:border-red-600 text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-900/40 hover:bg-red-100 dark:hover:bg-red-800 font-medium"
                              onClick={async () => {
                                if (!confirm("Từ chối giao dịch này?")) return;
                                const { error } = await databaseService.transactions.updateTransaction(transaction.id, { status: "rejected" });
                                if (error) toast.error("Lỗi khi từ chối"); else fetchTransactions();
                              }}
                            >
                              Từ chối
                            </button>
                          )}
                          <button
                            type="button"
                            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => openEditModal(transaction)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/40 dark:text-red-200"
                            onClick={() => handleDelete(transaction.id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>

        {/* Mobile group summary */}
        {groupedData && (
          <div className="sm:hidden mb-4 space-y-3">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg border-t border-l border-r dark:border-gray-700 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Tổng hợp theo nhóm</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">{filteredGroupedEntries.length} nhóm</span>
              </div>
              {(state.groupBy === "day" || state.groupBy === "week" || state.groupBy === "month" || state.groupBy === "quarter" || state.groupBy === "year") && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="flex-1 min-w-[110px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
                  />
                  <span className="text-xs text-gray-500">-</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="flex-1 min-w-[110px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={applyCustomDateRange}
                    className="px-2 py-1 rounded-md text-xs bg-blue-600 text-white"
                  >
                    Lọc
                  </button>
                  {state.dateRange && (
                    <button
                      type="button"
                      onClick={clearDateRange}
                      className="px-2 py-1 rounded-md text-xs border border-gray-300 dark:border-gray-600"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              )}
            </div>
            {filteredGroupedEntries.map(([key, data]) => (
                <div key={key} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{data.label}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{data.count} giao dịch</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Tăng</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(data.increase)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Giảm</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(data.decrease)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Cọc</span>
                      <span className={`font-semibold ${data.deposit > 0 ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-300"}`}>{formatCurrency(data.deposit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Điều chỉnh</span>
                      <span className={`font-semibold ${data.adjustment > 0 ? "text-red-600 dark:text-red-400" : data.adjustment < 0 ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-300"}`}>{formatCurrency(data.adjustment)}</span>
                    </div>
                    <div className="col-span-2 flex justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">Net</span>
                      <span className={`font-semibold ${data.net > 0 ? "text-red-600 dark:text-red-400" : data.net < 0 ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-300"}`}>{formatCurrency(data.net)}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Mobile card list */}
        <div className="sm:hidden space-y-3">
          {state.transactions.length === 0 ? (
            <div className="text-center py-10 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
              <svg
                className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Không có giao dịch nào
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Thử điều chỉnh bộ lọc hoặc thêm giao dịch mới.
              </p>
            </div>
          ) : (
            state.transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}
                  >
                    {getTransactionTypeName(transaction.transaction_type)}
                  </span>
                  <span
                    className={`text-sm font-bold ${getTransactionTypeAmountColor(transaction.transaction_type, transaction.amount)}`}
                  >
                    {formatCurrency(parseAmount(transaction.amount))}
                  </span>
                </div>

                <div>
                  {transaction.customer_id ? (
                    <button
                      type="button"
                      className="block text-left font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => navigate(`/customers/${transaction.customer_id}`)}
                    >
                      {getCustomerName(transaction)}
                    </button>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Không có khách hàng</span>
                  )}
                  {getCustomerCode(transaction.customer_id) ? (
                    <div className="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">
                      {getCustomerCode(transaction.customer_id)}
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-600 dark:text-gray-300">
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">Ngày:</span>{" "}
                    {formatDate(transaction.transaction_date)}
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">Mã GD:</span>{" "}
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-[10px]">
                      {transaction.transaction_code}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-gray-400 dark:text-gray-500">Văn phòng:</span>{" "}
                    {transaction.branch_name || transaction.branches?.name || getBranchName(transaction.branch_id) || "—"}
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-gray-400 dark:text-gray-500">Tài khoản:</span>{" "}
                    {transaction.bank_account_name || transaction.bank_accounts?.account_name || (transaction.bank_account_id ? `#${transaction.bank_account_id}` : "—")}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400 dark:text-gray-500">Người thực hiện:</span>{" "}
                    {userMap.get(transaction.created_by || "") || transaction.creator_name || transaction.created_by || "—"}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  {transaction.status === "draft" ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      Nháp
                    </span>
                  ) : transaction.status === "pending" ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      Chờ duyệt
                    </span>
                  ) : transaction.status === "rejected" ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      Từ chối
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Hoàn thành
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    {transaction.status === "draft" && (
                      <button
                        type="button"
                        className="min-h-[44px] px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={async () => {
                          if (!confirm("Gửi giao dịch Nháp để chờ duyệt?")) return;
                          const { error } = await databaseService.transactions.updateTransaction(transaction.id, { status: "pending" });
                          if (error) toast.error("Lỗi khi gửi duyệt");
                          else fetchTransactions();
                        }}
                      >
                        Gửi duyệt
                      </button>
                    )}
                    {canApprove && (transaction.status === "pending" || transaction.status === "rejected") && (
                      <button
                        type="button"
                        className="min-h-[44px] px-3 py-1.5 rounded-md text-xs font-medium border border-green-300 dark:border-green-600 text-green-700 dark:text-green-200 bg-green-50 dark:bg-green-900/40 hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
                        onClick={async () => {
                          if (!confirm("Duyệt giao dịch vào công nợ?")) return;
                          const { error } = await databaseService.transactions.updateTransaction(transaction.id, { status: "completed" });
                          if (error) toast.error("Lỗi khi duyệt");
                          else fetchTransactions();
                        }}
                      >
                        Duyệt
                      </button>
                    )}
                    {canApprove && transaction.status === "pending" && (
                      <button
                        type="button"
                        className="min-h-[44px] px-3 py-1.5 rounded-md text-xs font-medium border border-red-300 dark:border-red-600 text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-900/40 hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
                        onClick={async () => {
                          if (!confirm("Từ chối giao dịch này?")) return;
                          const { error } = await databaseService.transactions.updateTransaction(transaction.id, { status: "rejected" });
                          if (error) toast.error("Lỗi khi từ chối");
                          else fetchTransactions();
                        }}
                      >
                        Từ chối
                      </button>
                    )}
                    <button
                      type="button"
                      className="min-h-[44px] px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => openEditModal(transaction)}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="min-h-[44px] px-3 py-1.5 rounded-md text-xs font-medium border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/40 dark:text-red-200 transition-colors"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {state.totalCount > 0 && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-600">
            <Pagination
              currentPage={state.currentPage}
              totalPages={Math.ceil(state.totalCount / state.pageSize)}
              onPageChange={handlePageChange}
              totalItems={state.totalCount}
              itemsPerPage={state.pageSize}
            />
          </div>
        )}
      </div>

      <TransactionEditModal
        isOpen={Boolean(editingTx)}
        transaction={editingTx}
        customers={customers}
        transactionTypes={typesForDropdown}
        branches={branches}
        bankAccounts={bankAccounts}
        getTransactionTypeName={getTransactionTypeName}
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
      />
    </div>
  </div>
  );
};

export default TransactionList;
