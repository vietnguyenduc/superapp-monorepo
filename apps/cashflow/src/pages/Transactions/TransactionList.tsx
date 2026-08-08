import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "../../utils/toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCompanyId } from "../../hooks/useCompanyId";
import { useDebounce } from "../../hooks/useDebounce";
import { databaseService } from "../../services/database";
import type { Transaction } from "../../types";
import { formatCurrency, formatDate, fetchColorSettings, getTransactionTypeColor, getTransactionTypeAmountColor } from "../../utils/formatting";
import { getCustomerBalanceDelta, parseAmount } from "../../services/businessLogic";
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
  statusFilter: "all" | "pending" | "completed";
  groupBy: "" | "day" | "week" | "month" | "branch" | "transaction_type" | "customer";
}

interface GroupSummary {
  label: string;
  count: number;
  increase: number;
  decrease: number;
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

const TransactionList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { getNameById: getTransactionTypeName, getMathFactor } = useTransactionTypes();
  const [searchParams] = useSearchParams();
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [bankAccounts, setBankAccounts] = useState<{ id: string; name: string }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string; email?: string; company_id?: string | null }[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<{ id: string; name: string }[]>([]);
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
  });

  // Debounce search term so API isn't called on every keystroke (300ms delay)
  const debouncedSearchTerm = useDebounce(state.searchTerm, 300);

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

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
      const filteredTransactions = rawTransactions.filter((transaction) => {
        if (state.bankAccountFilter && transaction.bank_account_id !== state.bankAccountFilter) {
          return false;
        }
        if (state.userFilter && transaction.created_by !== state.userFilter) {
          return false;
        }
        return true;
      });

      setState((prev) => ({
        ...prev,
        transactions: filteredTransactions,
        totalCount: filteredTransactions.length,
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
  }, [state.transactions, state.groupBy]);

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
      const [branchResult, bankResult, customerResult, userResult, typeResult] = await Promise.all([
        databaseService.branches.getBranches(companyId),
        databaseService.bankAccounts.getBankAccounts(companyId),
        databaseService.customers.getCustomers({ limit: 500, company_id: companyId }),
        databaseService.users.getUsers(),
        databaseService.transactionTypes.getTransactionTypes(companyId),
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

      if (typeResult?.data) {
        const seen = new Set<string>();
        const names = typeResult.data
          .filter((t: Record<string, unknown>) =>
            String(t.is_active ?? t.isActive ?? true) !== "false"
          )
          .filter((t: Record<string, unknown>) => {
            const name = String(t.name || "").trim();
            if (!name || seen.has(name.toLowerCase())) return false;
            seen.add(name.toLowerCase());
            return true;
          })
          .map((t: Record<string, unknown>) => ({
            id: String(t.id ?? t.value ?? t.name ?? ""),
            name: String(t.name ?? t.id ?? t.value ?? ""),
          }));
        if (names.length > 0) setTransactionTypes(names);
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

  const handleBranchChange = (branchId: string) => {
    setState((prev) => ({ ...prev, branchFilter: branchId || null, currentPage: 1 }));
  };

  const handleBankChange = (bankId: string) => {
    setState((prev) => ({ ...prev, bankAccountFilter: bankId || null, currentPage: 1 }));
  };

  const handleUserChange = (userId: string) => {
    setState((prev) => ({ ...prev, userFilter: userId || null, currentPage: 1 }));
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

    return state.transactions.reduce<Record<string, GroupSummary>>((acc, tx) => {
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
        acc[key] = { label, count: 0, increase: 0, decrease: 0, adjustment: 0, net: 0 };
      }

      const delta = getCustomerBalanceDelta(tx.transaction_type, tx.amount, getMathFactor(tx.transaction_type));
      if (tx.transaction_type === "adjustment") {
        acc[key].adjustment += delta;
      } else if (delta > 0) {
        acc[key].increase += Math.abs(delta);
      } else if (delta < 0) {
        acc[key].decrease += Math.abs(delta);
      }
      acc[key].count += 1;
      acc[key].net += delta;

      return acc;
    }, {});
  }, [state.groupBy, state.transactions, getBranchName, customers, getTransactionTypeName, getMathFactor]);

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
            <button
              className={`px-4 py-2 text-sm font-medium ${state.statusFilter === "all" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setState(prev => ({ ...prev, statusFilter: "all", currentPage: 1 }))}
            >
              Tất cả
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${state.statusFilter === "pending" ? "text-amber-600 border-b-2 border-amber-600" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setState(prev => ({ ...prev, statusFilter: "pending", currentPage: 1 }))}
            >
              Hàng chờ duyệt
              {state.statusFilter === "pending" && <span className="bg-amber-100 text-amber-700 py-0.5 px-2 rounded-full text-xs">{state.totalCount}</span>}
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${state.statusFilter === "completed" ? "text-green-600 border-b-2 border-green-600" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setState(prev => ({ ...prev, statusFilter: "completed", currentPage: 1 }))}
            >
              Đã hoàn thành
            </button>
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
                    <span aria-hidden>📅</span>
                    {timeLabel}
                  </span>
                  <span aria-hidden>▾</span>
                </button>
                {showDateMenu && (
                  <div className="absolute z-50 mt-2 w-full max-w-xs sm:max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 space-y-3">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">Khoảng thời gian</div>
                    <div className="grid grid-cols-1 gap-2">
                      <button className="text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm" onClick={() => applyPresetRange("today")}>Hôm nay</button>
                      <button className="text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm" onClick={() => applyPresetRange("lastWeek")}>Tuần trước</button>
                      <button className="text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm" onClick={() => applyPresetRange("thisMonth")}>Tháng này</button>
                      <button className="text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm" onClick={() => applyPresetRange("thisQuarter")}>Quý này</button>
                      <button className="text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm" onClick={() => applyPresetRange("thisYear")}>Năm nay</button>
                      <button className="text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm" onClick={() => applyPresetRange("all")}>Tất cả thời gian</button>
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
                value={state.groupBy}
                onChange={(e) => handleGroupByChange(e.target.value as TransactionListState["groupBy"])}
              >
                <option value="">Không nhóm</option>
                <option value="day">Ngày</option>
                <option value="week">Tuần</option>
                <option value="month">Tháng</option>
                <option value="branch">Văn phòng</option>
                <option value="transaction_type">Loại giao dịch</option>
                <option value="customer">Khách hàng</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center justify-start sm:justify-end">
                Hiển thị {paginationInfo.start} - {paginationInfo.end} / {paginationInfo.total} giao dịch
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
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Tổng hợp theo nhóm</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{Object.keys(groupedData).length} nhóm</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nhóm</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Số giao dịch</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tổng phát sinh tăng</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tổng phát sinh giảm</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tổng điều chỉnh</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Net</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {Object.entries(groupedData)
                        .sort(([keyA, a], [keyB, b]) => {
                          if (state.groupBy === "day" || state.groupBy === "week" || state.groupBy === "month") {
                            return keyA.localeCompare(keyB);
                          }
                          return a.label.localeCompare(b.label);
                        })
                        .map(([key, data]) => (
                          <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-700/60">
                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{data.label}</td>
                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right text-xs sm:text-sm text-gray-700 dark:text-gray-200">{data.count}</td>
                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(data.increase)}</td>
                            <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(data.decrease)}</td>
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
                  <th className="sticky left-0 z-20 px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600">Khách hàng</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ngày giao dịch</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Loại giao dịch</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Số tiền</th>
                  <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Văn phòng</th>
                  <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tài khoản</th>
                  <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Người thực hiện</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mã GD</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {state.transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="sticky left-0 z-10 px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                      {transaction.customer_id ? (
                        <button
                          type="button"
                          className="block text-left text-gray-900 dark:text-white hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors max-w-[10rem] truncate font-medium"
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
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(transaction.transaction_date)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}
                      >
                        {getTransactionTypeName(transaction.transaction_type)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                      <span
                        className={`text-xs sm:text-sm font-bold ${getTransactionTypeAmountColor(transaction.transaction_type, transaction.amount)}`}
                      >
                        {formatCurrency(parseAmount(transaction.amount))}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                      {transaction.branch_name || "—"}
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                      {transaction.bank_account_name || transaction.bank_account_id ? `#${transaction.bank_account_id}` : "Không có tài khoản"}
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                      {userMap.get(transaction.created_by || "") || transaction.creator_name || transaction.created_by || "—"}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                      <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs">
                        {transaction.transaction_code}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {transaction.status === 'pending' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">Chờ duyệt</span>
                      ) : transaction.status === 'cancelled' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">Đã hủy</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Hoàn thành</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {transaction.status === 'pending' && (
                          <button
                            type="button"
                            className="px-2 py-1 rounded border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-800 font-medium"
                            onClick={async () => {
                              if (!confirm("Xác nhận duyệt giao dịch vào công nợ?")) return;
                              const { error } = await databaseService.transactions.updateTransaction(transaction.id, { status: 'completed' });
                              if (error) toast.error("Lỗi khi duyệt"); else fetchTransactions();
                            }}
                          >
                            Duyệt
                          </button>
                        )}
                        <button
                          type="button"
                          className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                  {transaction.status === "pending" ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      Chờ duyệt
                    </span>
                  ) : transaction.status === "cancelled" ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      Đã hủy
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Hoàn thành
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    {transaction.status === "pending" && (
                      <button
                        type="button"
                        className="min-h-[44px] px-3 py-1.5 rounded-md text-xs font-medium border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-800 transition-colors"
                        onClick={async () => {
                          if (!confirm("Xác nhận duyệt giao dịch vào công nợ?")) return;
                          const { error } = await databaseService.transactions.updateTransaction(transaction.id, { status: "completed" });
                          if (error) toast.error("Lỗi khi duyệt");
                          else fetchTransactions();
                        }}
                      >
                        Duyệt
                      </button>
                    )}
                    <button
                      type="button"
                      className="min-h-[44px] px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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

        {state.totalCount > state.pageSize && (
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
        transactionTypes={transactionTypes}
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
