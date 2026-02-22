import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { databaseService } from "../../services/database";
import type { Transaction } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatting";
import { LoadingFallback } from "../../components/UI/FallbackUI";
import Pagination from "../../components/UI/Pagination";
import PageHeader from "../../components/UI/PageHeader";
import CustomerDetailModal from "../Customers/components/CustomerDetailModal";

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
  showCustomerModal: boolean;
  modalCustomer: any | null;
}

const TransactionList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [bankAccounts, setBankAccounts] = useState<{ id: string; name: string }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string; code?: string }[]>([]);
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
    showCustomerModal: false,
    modalCustomer: null,
  });

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    transaction_type: "payment" as Transaction["transaction_type"],
    transaction_date: "",
    amount: "",
    description: "",
    bank_account_id: "",
    branch_id: "",
    reference_number: "",
  });

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
        search: state.searchTerm || undefined,
        dateRange: state.dateRange || undefined,
        transaction_type: state.transactionType || undefined,
        customer_id: state.customerFilter?.id || undefined,
        branch_id: state.branchFilter || undefined,
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
  }, [state.searchTerm, state.dateRange, state.transactionType, state.customerFilter, state.branchFilter, state.bankAccountFilter, state.userFilter, state.currentPage, state.pageSize]);

  useEffect(() => {
    const loadFilters = async () => {
      const [branchResult, bankResult, customerResult] = await Promise.all([
        databaseService.branches.getBranches(),
        databaseService.bankAccounts.getBankAccounts(),
        databaseService.customers.getCustomers({ limit: 500 }),
      ]);
      if (branchResult?.data) {
        setBranches(
          branchResult.data.map((branch: any) => ({
            id: String(branch.id),
            name: String(branch.name || branch.branch_name || branch.code || branch.id),
          })),
        );
      }
      if (bankResult?.data) {
        setBankAccounts(
          bankResult.data.map((account: any) => ({
            id: String(account.id),
            name: String(account.account_name || account.bank_name || account.id),
          })),
        );
      }
      if (customerResult?.data) {
        setCustomers(
          customerResult.data.map((customer: any) => ({
            id: String(customer.id),
            name: String(customer.full_name || customer.customer_name || customer.customer_code || customer.id),
            code: customer.customer_code,
          })),
        );
      }
    };
    loadFilters();
  }, []);

  // Load transactions on mount and when filters change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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

  const handleDelete = useCallback(
    async (transactionId: string) => {
      if (!confirm("Bạn có chắc muốn xóa giao dịch này?")) return;
      try {
        const result = await databaseService.transactions.deleteTransaction(transactionId);
        if (result.error) {
          alert("Xóa giao dịch thất bại");
        } else {
          fetchTransactions();
        }
      } catch (e) {
        alert("Xóa giao dịch thất bại");
      }
    },
    [fetchTransactions],
  );

  const openEditModal = useCallback((tx: Transaction) => {
    setEditingTx(tx);
    setEditForm({
      transaction_type: tx.transaction_type,
      transaction_date: tx.transaction_date.slice(0, 10),
      amount: String(tx.amount),
      description: tx.description || "",
      bank_account_id: tx.bank_account_id || "",
      branch_id: tx.branch_id || "",
      reference_number: tx.reference_number || "",
    });
  }, []);

  const closeEditModal = useCallback(() => {
    setEditingTx(null);
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (!editingTx) return;
    let amt = Number(String(editForm.amount || "").replace(/[\s,]/g, ""));
    if (!Number.isFinite(amt)) {
      alert("Số tiền không hợp lệ");
      return;
    }
    if (editForm.transaction_type === "payment" && amt < 0) {
      amt = Math.abs(amt);
    }
    if (editForm.transaction_type === "charge" && amt > 0) {
      amt = -Math.abs(amt);
    }
    const dateIso = editForm.transaction_date ? new Date(editForm.transaction_date).toISOString() : editingTx.transaction_date;
    try {
      const result = await databaseService.transactions.updateTransaction(editingTx.id, {
        transaction_type: editForm.transaction_type,
        transaction_date: dateIso,
        amount: amt,
        description: editForm.description,
        bank_account_id: editForm.bank_account_id,
        branch_id: editForm.branch_id,
        reference_number: editForm.reference_number,
      });
      if (result.error) {
        alert("Cập nhật giao dịch thất bại");
      } else {
        closeEditModal();
        fetchTransactions();
      }
    } catch (e) {
      alert("Cập nhật giao dịch thất bại");
    }
  }, [closeEditModal, editForm.amount, editForm.bank_account_id, editForm.branch_id, editForm.description, editForm.reference_number, editForm.transaction_date, editForm.transaction_type, editingTx, fetchTransactions]);

  const getBranchName = (branchId: string): string => {
    const match = branches.find((branch) => branch.id === String(branchId));
    return match?.name || "N/A";
  };

  const getCustomerCode = (customerId?: string) => {
    if (!customerId) return "";
    const match = customers.find((c) => c.id === String(customerId));
    return match?.code || "";
  };

  const handleSelectCustomer = (id?: string) => {
    if (!id) return;
    setState((prev) => ({
      ...prev,
      showCustomerModal: true,
      modalCustomer: customers.find((c) => c.id === id) || null,
    }));
  };

  const getTransactionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      payment: "Phát sinh tăng",
      charge: "Phát sinh giảm",
      adjustment: "Điều chỉnh",
      refund: "Hoàn tiền",
    };
    return labels[type] || type;
  };

  const hasCustomerFilter = Boolean(state.customerFilter?.id);

  const paginationInfo = useMemo(() => {
    const start = (state.currentPage - 1) * state.pageSize + 1;
    const end = Math.min(state.currentPage * state.pageSize, state.totalCount);
    return { start, end, total: state.totalCount };
  }, [state.currentPage, state.pageSize, state.totalCount]);

  const userOptions = useMemo(() => {
    return Array.from(new Set(state.transactions.map((t) => t.created_by).filter(Boolean)));
  }, [state.transactions]);

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

  if (state.loading) {
    return (
      <LoadingFallback
        title="Đang tải giao dịch"
        message="Vui lòng chờ trong giây lát"
      />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeader
            title="Danh sách giao dịch"
            subtitle="Xem và quản lý tất cả các giao dịch"
            actions={
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="search"
                  value={state.searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Tìm kiếm giao dịch, khách hàng..."
                  className="flex-1 sm:w-72 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => fetchTransactions()}
                  className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  Làm mới
                </button>
              </div>
            }
          />

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
                {userOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
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

          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-[1200px] divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ngày giao dịch</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Loại giao dịch</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Số tiền</th>
                  <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Khách hàng</th>
                  <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Văn phòng</th>
                  <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tài khoản</th>
                  <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Người thực hiện</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mã giao dịch</th>
                  <th className="hidden xl:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cập nhật gần nhất</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {state.transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(transaction.transaction_date)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.transaction_type === "payment"
                            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                            : transaction.transaction_type === "charge"
                            ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                            : transaction.transaction_type === "adjustment"
                            ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                            : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        }`}
                      >
                        {getTransactionTypeLabel(transaction.transaction_type)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          transaction.amount >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                      <button
                        type="button"
                        className="text-left text-gray-900 dark:text-white hover:underline"
                        onClick={() => handleSelectCustomer(transaction.customer_id)}
                      >
                        {transaction.customer_name || `Customer #${transaction.customer_id}`}
                      </button>
                      {getCustomerCode(transaction.customer_id) ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{getCustomerCode(transaction.customer_id)}</div>
                      ) : null}
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                      {transaction.branch_id ? getBranchName(transaction.branch_id) : "—"}
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                      {transaction.bank_account_name || `#${transaction.bank_account_id}`}
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                      {transaction.created_by}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                      <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 sm:px-2 py-0.5 rounded text-xs sm:text-xs">
                        {transaction.transaction_code}
                      </span>
                    </td>
                    <td className="hidden xl:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                      {formatDate(transaction.updated_at)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
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
      </div>

      {state.showCustomerModal && state.modalCustomer && (
        <CustomerDetailModal
          customer={state.modalCustomer as any}
          onClose={() => setState((prev) => ({ ...prev, showCustomerModal: false }))}
          onEdit={() => {
            setState((prev) => ({ ...prev, showCustomerModal: false }));
            navigate(`/customers`);
          }}
        />
      )}

      {editingTx && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chỉnh sửa giao dịch</h3>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={closeEditModal}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại giao dịch</label>
                <select
                  className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  value={editForm.transaction_type}
                  onChange={(e) => setEditForm((p) => ({ ...p, transaction_type: e.target.value as any }))}
                >
                  <option value="payment">Phát sinh tăng</option>
                  <option value="charge">Phát sinh giảm</option>
                  <option value="adjustment">Điều chỉnh</option>
                  <option value="refund">Hoàn tiền</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày giao dịch</label>
                <input
                  type="date"
                  className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  value={editForm.transaction_date}
                  onChange={(e) => setEditForm((p) => ({ ...p, transaction_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số tiền</label>
                <input
                  type="text"
                  className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  value={editForm.amount}
                  onChange={(e) => setEditForm((p) => ({ ...p, amount: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Văn phòng</label>
                <select
                  className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  value={editForm.branch_id}
                  onChange={(e) => setEditForm((p) => ({ ...p, branch_id: e.target.value }))}
                >
                  <option value="">Chọn văn phòng</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tài khoản</label>
                <select
                  className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  value={editForm.bank_account_id}
                  onChange={(e) => setEditForm((p) => ({ ...p, bank_account_id: e.target.value }))}
                >
                  <option value="">Chọn tài khoản</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
                <textarea
                  className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mã tham chiếu</label>
                <input
                  type="text"
                  className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  value={editForm.reference_number}
                  onChange={(e) => setEditForm((p) => ({ ...p, reference_number: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={closeEditModal}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={handleEditSubmit}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionList;
