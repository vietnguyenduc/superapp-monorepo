import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { databaseService } from "../../services/database";
import type { Customer } from "../../types";
import { LoadingFallback, ErrorFallback } from "../../components/UI/FallbackUI";
import {
  CustomerSearch,
  CustomerFilters,
  CustomerTable,
  CustomerDetailModal,
  CustomerFormModal,
} from "./components";
import Pagination from "../../components/UI/Pagination";
import Button from "../../components/UI/Button";
import PageHeader from "../../components/UI/PageHeader";

interface CustomerListState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  searchTerm: string;
  dateRange: { start: string; end: string } | null;
  sortBy: string;
  sortOrder: "asc" | "desc";
  selectedCustomer: Customer | null;
  showDetailModal: boolean;
  showFormModal: boolean;
  formMode: "create" | "edit";
}

const CustomerList: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [state, setState] = useState<CustomerListState>({
    customers: [],
    loading: true,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 20,
    searchTerm: "",
    dateRange: null,
    sortBy: "created_at",
    sortOrder: "desc",
    selectedCustomer: null,
    showDetailModal: false,
    showFormModal: false,
    formMode: "create",
  });

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const offset = (state.currentPage - 1) * state.pageSize;

      const result = await databaseService.customers.getCustomers({
        search: state.searchTerm || undefined,
        limit: state.pageSize,
        offset,
      });

      if (result.error) {
        setState((prev) => ({ ...prev, error: result.error, loading: false }));
      } else {
        setState((prev) => ({
          ...prev,
          customers: result.data,
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
  }, [state.currentPage, state.pageSize, state.searchTerm]);

  // Load customers on mount and when filters change
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

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

  // Handle sorting
  const handleSort = useCallback((sortBy: string) => {
    setState((prev) => ({
      ...prev,
      sortBy,
      sortOrder:
        prev.sortBy === sortBy && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  }, []);

  const sortedCustomers = useMemo(() => {
    const sorted = [...state.customers];
    const direction = state.sortOrder === "asc" ? 1 : -1;
    sorted.sort((a, b) => {
      const aValue = (a as any)[state.sortBy];
      const bValue = (b as any)[state.sortBy];

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
          window.location.href = `/transactions?customer_id=${customer.id}&customer_name=${encodeURIComponent(customer.full_name)}`;
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
        alert(t("customers.deleteError"));
      } else {
        fetchCustomers(); // Refresh the list
      }
    } catch (error) {
      alert(t("customers.deleteError"));
    }
  };

  // Handle form submission
  const handleFormSubmit = useCallback(
    async (customerData: Partial<Customer>, options?: { createTransactions?: boolean }) => {
      try {
        let result;

        if (state.formMode === "create") {
          result = await databaseService.customers.createCustomer({
            ...customerData,
            branch_id: customerData.branch_id ?? user?.branch_id ?? null,
          });
        } else {
          result = await databaseService.customers.updateCustomer(
            state.selectedCustomer!.id,
            customerData,
          );
        }

        if (result.error) {
          alert(t("customers.saveError"));
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
              window.location.href = `/import/transactions?customer_name=${encodeURIComponent(String(name))}`;
            } else {
              window.location.href = "/import/transactions";
            }
          }
        }
      } catch (error) {
        alert(t("customers.saveError"));
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
    const start = (state.currentPage - 1) * state.pageSize + 1;
    const end = Math.min(state.currentPage * state.pageSize, state.totalCount);
    return { start, end, total: state.totalCount };
  }, [state.currentPage, state.pageSize, state.totalCount]);

  if (state.loading && state.customers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
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
      <div className="min-h-screen bg-gray-50 py-8">
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title={t("customers.title")}
          subtitle={t("customers.subtitle")}
          actions={
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
          }
        />

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Bộ lọc khách hàng
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <CustomerSearch
              value={state.searchTerm}
              onChange={handleSearch}
              placeholder={t("customers.searchPlaceholder")}
            />
            <CustomerFilters
              dateRange={state.dateRange}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {t("customers.customerList")}
              </h3>
              <div className="text-sm text-gray-500">
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
          />

          {/* Pagination */}
          {state.totalCount > state.pageSize && (
            <div className="px-6 py-4 border-t border-gray-200">
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
      </div>
    </div>
  );
};

export default CustomerList;
