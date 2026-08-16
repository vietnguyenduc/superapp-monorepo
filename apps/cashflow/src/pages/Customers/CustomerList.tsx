import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "../../utils/toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { useAuthContext as useAuth } from "@superapp/iam";
import { useCompanyId } from "../../hooks/useCompanyId";
import { useDebounce } from "../../hooks/useDebounce";
import { databaseService } from "../../services/database";
import { getInitialEntityStatus, canManageAllCustomers } from "../../utils/permissions";
import type { Customer } from "../../types";
import { LoadingFallback, ErrorFallback } from "../../components/UI/FallbackUI";
import {
  CustomerSearch,
  CustomerFilters,
  CustomerTable,
  CustomerDetailModal,
  CustomerFormModal,
  ColumnVisibilityDropdown,
  CustomerBulkEditModal,
} from "./components";
import Pagination from "../../components/UI/Pagination";
import Button from "../../components/UI/Button";
import PageHeader from "../../components/UI/PageHeader";
import { formatCurrency } from "../../utils/formatting";

interface CustomerListState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  searchTerm: string;
  dateRange: { start: string; end: string } | null;
  balanceRange: { min: number | null; max: number | null } | null;
  sortBy: string;
  sortOrder: "asc" | "desc";
  selectedCustomer: Customer | null;
  showDetailModal: boolean;
  showFormModal: boolean;
  formMode: "create" | "edit";
  visibleColumns: Record<string, boolean>;
  showBulkEditModal: boolean;
  totalBalance: number;
  allCustomers: Customer[];
}

const defaultVisibleColumns: Record<string, boolean> = {
  customerCode: true,
  fullName: true,
  balance: true,
  lastTransaction: true,
  phone: false,
  address: false,
  workingMethod: false,
};

const allColumnOptions = [
  { key: "customerCode", label: "Mã khách hàng" },
  { key: "fullName", label: "Tên khách hàng" },
  { key: "balance", label: "Công nợ" },
  { key: "lastTransaction", label: "Giao dịch cuối" },
  { key: "phone", label: "ĐT" },
  { key: "address", label: "Địa chỉ" },
  { key: "workingMethod", label: "Cách làm việc công nợ" },
];

const columnFieldMap: Record<string, keyof Customer> = {
  customerCode: "customer_code",
  fullName: "full_name",
  balance: "total_balance",
  lastTransaction: "last_transaction_date",
  phone: "phone",
  address: "address",
  workingMethod: "working_method",
};

const CustomerList: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const navigate = useNavigate();

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [stickyFilterEl, setStickyFilterEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!stickyFilterEl) return;
    const setVar = () => {
      document.documentElement.style.setProperty(
        "--customer-sticky-top",
        `${stickyFilterEl.offsetHeight}px`,
      );
    };
    setVar();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(setVar) : null;
    if (ro) ro.observe(stickyFilterEl);
    window.addEventListener("resize", setVar);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", setVar);
      document.documentElement.style.removeProperty("--customer-sticky-top");
    };
  }, [stickyFilterEl]);

  const [state, setState] = useState<CustomerListState>(() => {
    let savedColumns: Record<string, boolean> | null = null;
    try {
      const raw = localStorage.getItem("cashflow_customerList_columns");
      if (raw) savedColumns = JSON.parse(raw);
    } catch {
      savedColumns = null;
    }
    return {
      customers: [],
      loading: true,
      error: null,
      totalCount: 0,
      currentPage: 1,
      pageSize: 20,
      searchTerm: "",
      dateRange: null,
      balanceRange: null,
      sortBy: "created_at",
      sortOrder: "desc",
      selectedCustomer: null,
      showDetailModal: false,
      showFormModal: false,
      formMode: "create",
      visibleColumns: { ...defaultVisibleColumns, ...(savedColumns || {}) },
      showBulkEditModal: false,
      totalBalance: 0,
      allCustomers: [],
    };
  });

  useEffect(() => {
    localStorage.setItem("cashflow_customerList_columns", JSON.stringify(state.visibleColumns));
  }, [state.visibleColumns]);

  // Debounce search term so API isn't called on every keystroke (300ms delay)
  const debouncedSearchTerm = useDebounce(state.searchTerm, 300);

  // Fetch customers — uses debounced search term so typing doesn't spam the API
  const fetchCustomers = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const offset = (state.currentPage - 1) * state.pageSize;

      const result = await databaseService.customers.getCustomers({
        company_id: companyId,
        search: debouncedSearchTerm || undefined,
        limit: state.pageSize,
        offset,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        dateRange: state.dateRange || undefined,
        balanceRange: state.balanceRange || undefined,
      });

      if (result.error) {
        setState((prev) => ({ ...prev, error: result.error, loading: false }));
      } else {
        setState((prev) => ({
          ...prev,
          customers: (result.data || []) as Customer[],
          totalCount: result.count,
          loading: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      }));
    }
  }, [companyId, state.currentPage, state.pageSize, debouncedSearchTerm, state.sortBy, state.sortOrder, state.dateRange, state.balanceRange]);

  // Load customers on mount and when filters change
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Fetch all matching customers for total balance summary and Excel export
  useEffect(() => {
    const fetchAll = async () => {
      if (!companyId) return;
      try {
        const result = await databaseService.customers.getCustomers({
          company_id: companyId,
          search: debouncedSearchTerm || undefined,
          limit: 10000,
          offset: 0,
          sortBy: "created_at",
          sortOrder: "desc",
          dateRange: state.dateRange || undefined,
          balanceRange: state.balanceRange || undefined,
        });
        const all = (result.data || []) as Customer[];
        const total = all.reduce((sum, c) => sum + (Number(c.total_balance) || 0), 0);
        setState((prev) => ({ ...prev, allCustomers: all, totalBalance: total }));
      } catch {
        // non-blocking: summary/export is best-effort
      }
    };
    fetchAll();
  }, [companyId, debouncedSearchTerm, state.dateRange, state.balanceRange]);

  // Handle search
  const handleSearch = useCallback((searchTerm: string) => {
    setState((prev) => ({ ...prev, searchTerm, currentPage: 1 }));
  }, []);

  // Handle date range filter
  const handleDateRangeChange = useCallback(
    (dateRange: { start: string; end: string } | null) => {
      setState((prev) => ({ ...prev, dateRange, currentPage: 1 }));
    },
    [],
  );

  // Handle balance range filter
  const handleBalanceRangeChange = useCallback(
    (balanceRange: { min: number | null; max: number | null } | null) => {
      setState((prev) => ({ ...prev, balanceRange, currentPage: 1 }));
    },
    [],
  );

  // Handle sorting
  const handleSort = useCallback((sortBy: string) => {
    setState((prev) => ({
      ...prev,
      sortBy,
      sortOrder:
        prev.sortBy === sortBy && prev.sortOrder === "asc" ? "desc" : "asc",
      currentPage: 1,
    }));
  }, []);

  const handleToggleColumn = useCallback((key: string) => {
    setState((prev) => ({
      ...prev,
      visibleColumns: { ...prev.visibleColumns, [key]: !prev.visibleColumns[key] },
    }));
  }, []);

  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\\\]/g, "\\$&");

  const handleBulkEditApply = useCallback(async (config: {
    mode: "findReplace" | "prefix" | "suffix";
    find: string;
    replace: string;
    prefix: string;
    suffix: string;
    caseSensitive: boolean;
  }) => {
    if (!companyId) {
      toast.error("Không xác định được công ty");
      return;
    }
    setState((prev) => ({ ...prev, loading: true, showBulkEditModal: false }));
    try {
      const result = await databaseService.customers.getCustomers({
        company_id: companyId,
        search: debouncedSearchTerm || undefined,
        limit: 10000,
        offset: 0,
        sortBy: "created_at",
        sortOrder: "desc",
      });
      const allCustomers = (result.data || []) as Customer[];
      const now = new Date().toISOString();
      const records: { id: string; full_name: string; updated_at: string }[] = [];

      for (const c of allCustomers) {
        const name = c.full_name || "";
        let newName = name;
        if (config.mode === "findReplace") {
          if (config.find) {
            const regex = new RegExp(escapeRegex(config.find), config.caseSensitive ? "g" : "gi");
            newName = name.replace(regex, () => config.replace);
          }
        } else if (config.mode === "prefix") {
          newName = config.prefix + name;
        } else if (config.mode === "suffix") {
          newName = name + config.suffix;
        }
        if (newName !== name) {
          records.push({ id: c.id, full_name: newName, updated_at: now });
        }
      }

      if (records.length === 0) {
        toast.warning("Không có khách hàng nào thay đổi");
        return;
      }

      const updateRes = await databaseService.customers.bulkUpdateCustomerNames(records);
      if (updateRes.error) {
        toast.error(updateRes.error);
      } else {
        fetchCustomers();
      }
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [companyId, debouncedSearchTerm, fetchCustomers]);

  const handleExportExcel = useCallback(() => {
    // Export the same filtered + sorted dataset the user sees, and only visible columns.
    const direction = state.sortOrder === "asc" ? 1 : -1;
    const sorted = [...state.allCustomers].sort((a, b) => {
      if (state.sortBy === "customer_code") {
        return (toNum(getField(a, "customer_code")) - toNum(getField(b, "customer_code"))) * direction;
      }
      const aValue = getField(a, state.sortBy);
      const bValue = getField(b, state.sortBy);
      if (aValue === undefined || aValue === null) return 1 * direction;
      if (bValue === undefined || bValue === null) return -1 * direction;
      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * direction;
      }
      if (state.sortBy === "last_transaction_date" || state.sortBy === "created_at") {
        return (new Date(aValue).getTime() - new Date(bValue).getTime()) * direction;
      }
      return String(aValue).localeCompare(String(bValue)) * direction;
    });

    const rows = sorted.map((c) => {
      const row: Record<string, unknown> = {};
      for (const col of allColumnOptions) {
        if (!state.visibleColumns[col.key]) continue;
        const field = columnFieldMap[col.key];
        row[col.label] = field === "total_balance" ? Number(getField(c, field)) || 0 : (getField(c, field) ?? "");
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách khách hàng");
    XLSX.writeFile(wb, "danh-sach-khach-hang.xlsx");
  }, [state.allCustomers, state.visibleColumns, state.sortBy, state.sortOrder]);

  const toNum = (v: unknown) => {
    const n = Number(String(v ?? "").replace(/\s/g, ""));
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  };

  const getField = (customer: Customer, key: string): unknown =>
    (customer as unknown as Record<string, unknown>)[key];

  const sortedCustomers = useMemo(() => {
    const sorted = [...state.customers];
    const direction = state.sortOrder === "asc" ? 1 : -1;
    sorted.sort((a, b) => {
      if (state.sortBy === "customer_code") {
        return (toNum(getField(a, "customer_code")) - toNum(getField(b, "customer_code"))) * direction;
      }

      const aValue = getField(a, state.sortBy);
      const bValue = getField(b, state.sortBy);

      if (aValue === undefined || aValue === null) return 1 * direction;
      if (bValue === undefined || bValue === null) return -1 * direction;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * direction;
      }

      if (state.sortBy === "last_transaction_date" || state.sortBy === "created_at") {
        const aDate = new Date(aValue).getTime();
        const bDate = new Date(bValue).getTime();
        return (aDate - bDate) * direction;
      }

      return String(aValue).localeCompare(String(bValue)) * direction;
    });
    return sorted;
  }, [state.customers, state.sortBy, state.sortOrder]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setState((prev) => ({ ...prev, pageSize, currentPage: 1 }));
  }, []);

  // Handle customer selection
  const handleCustomerSelect = useCallback((customer: Customer) => {
    setState((prev) => ({
      ...prev,
      selectedCustomer: customer,
      showDetailModal: true,
    }));
  }, []);

  // Handle customer actions
  const handleCustomerAction = useCallback(
    (action: string, customer: Customer) => {
      switch (action) {
        case "view":
          setState((prev) => ({
            ...prev,
            selectedCustomer: customer,
            showDetailModal: true,
          }));
          break;
        case "transactions":
          // Navigate to transactions page with customer filter
          navigate(
            `/transactions?customer_id=${customer.id}&customer_name=${encodeURIComponent(customer.full_name)}`,
          );
          break;
        case "edit":
          setState((prev) => ({
            ...prev,
            selectedCustomer: customer,
            formMode: "edit",
            showFormModal: true,
          }));
          break;
        case "delete":
          handleDeleteCustomer(customer.id);
          break;
      }
    },
    [],
  );

  // Handle delete customer
  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm(t("customers.deleteConfirm"))) return;

    try {
      const result = await databaseService.customers.deleteCustomer(customerId);
      if (result.error) {
        toast.error(t("customers.deleteError"));
      } else {
        fetchCustomers(); // Refresh the list
      }
    } catch (error) {
      toast.error(t("customers.deleteError"));
    }
  };

  // Handle form submission
  const handleFormSubmit = useCallback(
    async (customerData: Partial<Customer>, options?: { createTransactions?: boolean }) => {
      try {
        let result;

        if (state.formMode === "create") {
          const status = getInitialEntityStatus(
            user,
            "customers",
            user?.company?.approval_settings,
            false,
            canManageAllCustomers(user),
          );
          result = await databaseService.customers.createCustomer({
            ...customerData,
            company_id: customerData.company_id ?? companyId ?? null,
            branch_id: customerData.branch_id ?? user?.branch_id ?? null,
            status,
          });
        } else {
          result = await databaseService.customers.updateCustomer(
            state.selectedCustomer!.id,
            customerData,
          );
        }

        if (result.error) {
          toast.error(t("customers.saveError"));
        } else {
          setState((prev) => ({
            ...prev,
            showFormModal: false,
            selectedCustomer: null,
          }));
          fetchCustomers(); // Refresh the list

          if (state.formMode === "create" && options?.createTransactions) {
            const name = customerData.full_name || result.data?.full_name;
            if (name) {
              navigate(`/import/transactions?customer_name=${encodeURIComponent(String(name))}`, { replace: true });
            } else {
              navigate("/import/transactions", { replace: true });
            }
          }
        }
      } catch (error) {
        toast.error(t("customers.saveError"));
      }
    },
    [
      state.formMode,
      state.selectedCustomer,
      user?.branch_id,
      fetchCustomers,
      t,
    ],
  );

  // Close modals
  const closeModals = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showDetailModal: false,
      showFormModal: false,
      selectedCustomer: null,
    }));
  }, []);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    if (state.totalCount === 0) return { start: 0, end: 0, total: 0 };
    const start = (state.currentPage - 1) * state.pageSize + 1;
    const end = Math.min(state.currentPage * state.pageSize, state.totalCount);
    return { start, end, total: state.totalCount };
  }, [state.currentPage, state.pageSize, state.totalCount]);

  if (state.loading && state.customers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingFallback
            title={t("customers.loading")}
            message={t("customers.loadingData")}
            size="lg"
          />
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorFallback
            title={t("customers.error")}
            message={state.error}
            retry={fetchCustomers}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="sm:min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8">
      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 pb-4 sm:pb-8">
        <PageHeader
          title={t("customers.title")}
          subtitle={t("customers.subtitle")}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    formMode: "create",
                    selectedCustomer: null,
                    showFormModal: true,
                  }))
                }
                className="inline-flex items-center"
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
                {t("customers.addNew")}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate("/import/customers?tab=bulk")}
                className="inline-flex items-center"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Nhập hàng loạt
              </Button>
            </div>
          }
        />

        {/* Filters and Search */}
        <div ref={setStickyFilterEl} className="bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-lg shadow mb-3 sticky top-0 z-20">
          <div className="px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-200 dark:border-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Bộ lọc khách hàng
            </h3>
            <div className="flex flex-wrap items-center gap-1 text-xs sm:text-sm" title={formatCurrency(state.totalBalance)}>
              <span className="text-gray-500 dark:text-gray-400">
                {t("customers.totalDebt", "Tổng công nợ")} ({state.allCustomers.length.toLocaleString("vi-VN")}{" "}{t("customers.customersCount", "khách hàng")}):
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(state.totalBalance)}
              </span>
            </div>
          </div>
          <div className="p-3 space-y-3">
            <CustomerSearch
              value={state.searchTerm}
              onChange={handleSearch}
              placeholder={t("customers.searchPlaceholder")}
            />
            <div className="flex flex-col sm:flex-row sm:items-start gap-2">
              <div className="flex-1 min-w-0">
                <CustomerFilters
                  dateRange={state.dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  balanceRange={state.balanceRange}
                  onBalanceRangeChange={handleBalanceRangeChange}
                />
              </div>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:justify-end">
                <select
                  value={state.pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="h-10 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 pl-2 pr-7 flex-shrink-0"
                  aria-label="Số dòng hiển thị"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>{size} dòng</option>
                  ))}
                </select>
                <ColumnVisibilityDropdown
                  columns={allColumnOptions}
                  visibleColumns={state.visibleColumns}
                  onToggle={handleToggleColumn}
                />
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setState((prev) => ({ ...prev, showBulkEditModal: true }))}
                  className="h-10 flex-shrink-0 whitespace-nowrap"
                >
                  Chỉnh tên hàng loạt
                </Button>
                <div className="relative flex-shrink-0" ref={exportMenuRef}>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setExportMenuOpen((prev) => !prev)}
                    className="h-10 inline-flex items-center whitespace-nowrap"
                  >
                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Xuất
                    <svg
                      className={`ml-1.5 h-3.5 w-3.5 transition-transform ${exportMenuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </Button>
                  {exportMenuOpen && (
                    <div className="absolute right-0 z-50 mt-1 w-56 origin-top-right rounded-md shadow-lg ring-1 ring-black ring-opacity-5 bg-white dark:bg-gray-800 focus:outline-none">
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setExportMenuOpen(false);
                            handleExportExcel();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Xuất Excel danh sách
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setExportMenuOpen(false);
                            navigate("/customers/opening-balance");
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Xuất tồn đầu kỳ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                {t("customers.customerList")}
              </h3>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {t("customers.showingResults", {
                  start: paginationInfo.start,
                  end: paginationInfo.end,
                  total: paginationInfo.total,
                })}
              </div>
            </div>
          </div>

          <CustomerTable
            customers={sortedCustomers}
            sortBy={state.sortBy}
            sortOrder={state.sortOrder}
            onSort={handleSort}
            onCustomerSelect={handleCustomerSelect}
            onCustomerAction={handleCustomerAction}
            loading={state.loading}
            visibleColumns={state.visibleColumns}
          />

          {/* Pagination */}
          {state.totalCount > state.pageSize && (
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200 dark:border-gray-600 sticky bottom-20 sm:bottom-0 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur">
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

        {/* Modals */}
        {state.showDetailModal && state.selectedCustomer && (
          <CustomerDetailModal
            customer={state.selectedCustomer}
            onClose={closeModals}
            onEdit={() => {
              setState((prev) => ({
                ...prev,
                showDetailModal: false,
                formMode: "edit",
                showFormModal: true,
              }));
            }}
          />
        )}

        {state.showFormModal && (
          <CustomerFormModal
            mode={state.formMode}
            customer={state.selectedCustomer}
            onClose={closeModals}
            onSubmit={handleFormSubmit}
          />
        )}

        {state.showBulkEditModal && (
          <CustomerBulkEditModal
            isOpen={state.showBulkEditModal}
            totalCustomers={state.totalCount}
            onClose={() => setState((prev) => ({ ...prev, showBulkEditModal: false }))}
            onApply={handleBulkEditApply}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerList;
