import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { databaseService } from "../../services/database";
import { Transaction } from "../../types";
import {
  formatCurrency,
  formatDate,
  getTransactionTypeColor,
  getTransactionTypeTextColor,
} from "../../utils/formatting";
import { LoadingFallback, ErrorFallback } from "../../components/UI/FallbackUI";
import Pagination from "../../components/UI/Pagination";
import TimeRangeFilter from "../../components/UI/TimeRangeFilter";
import Button from "../../components/UI/Button";

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
  customerFilter: {
    id: string | null;
    name: string | null;
  } | null;
}

const TransactionList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
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
    customerFilter: null,
  });

  // Initialize customer filter from URL params
  useEffect(() => {
    const customerId = searchParams.get("customer_id");
    const customerName = searchParams.get("customer_name");

    if (customerId && customerName) {
      setState((prev) => ({
        ...prev,
        customerFilter: {
          id: customerId,
          name: customerName,
        },
      }));
    }
  }, [searchParams]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!user?.branch_id) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const filters = {
        branch_id: user.branch_id,
        search: state.searchTerm || undefined,
        dateRange: state.dateRange || undefined,
        transaction_type: state.transactionType || undefined,
        customer_id: state.customerFilter?.id || undefined,
        page: state.currentPage,
        pageSize: state.pageSize,
      };

      const result =
        await databaseService.transactions.getTransactions(filters);

      if (result.error) {
        setState((prev) => ({ ...prev, error: result.error, loading: false }));
      } else if (result.data) {
        setState((prev) => ({
          ...prev,
          transactions: result.data,
          totalCount: result.count || 0,
          loading: false,
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error:
          err instanceof Error ? err.message : "Failed to load transactions",
        loading: false,
      }));
    }
  }, [
    user?.branch_id,
    state.searchTerm,
    state.dateRange,
    state.transactionType,
    state.customerFilter,
    state.currentPage,
    state.pageSize,
  ]);

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Handle search
  const handleSearch = (value: string) => {
    setState((prev) => ({ ...prev, searchTerm: value, currentPage: 1 }));
  };

  // Handle date range change
  const handleDateRangeChange = (start: string, end: string) => {
    setState((prev) => ({
      ...prev,
      dateRange: start && end ? { start, end } : null,
      currentPage: 1,
    }));
  };

  // Handle transaction type filter
  const handleTransactionTypeChange = (type: string | null) => {
    setState((prev) => ({
      ...prev,
      transactionType: type,
      currentPage: 1,
    }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  };

  // Get transaction type color
  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "payment":
        return "Thanh toán";
      case "charge":
        return "Cho nợ";
      case "adjustment":
        return "Điều chỉnh";
      case "refund":
        return "Hoàn tiền";
      default:
        return type;
    }
  };

  // Function to get branch name from branch_id
  const getBranchName = (branchId: string) => {
    const branchMap: { [key: string]: string } = {
      "1": "Chi nhánh chính",
      "2": "Chi nhánh Bắc",
      "3": "Chi nhánh Nam",
    };
    return branchMap[branchId] || "Chi nhánh không xác định";
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingFallback
            title={t("transactions.loading")}
            message={t("transactions.loadingData")}
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
            title={t("transactions.error")}
            message={state.error}
            retry={fetchTransactions}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                Giao dịch
              </h1>
              <p className="mt-2 text-base font-normal text-gray-600 tracking-normal">
                Quản lý và theo dõi các giao dịch công nợ
              </p>
              {state.customerFilter && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    Đang xem giao dịch của:
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {state.customerFilter.name}
                  </span>
                  <button
                    onClick={() => {
                      setState((prev) => ({ ...prev, customerFilter: null }));
                      navigate("/transactions");
                    }}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    title="Xóa bộ lọc khách hàng"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => alert("Tính năng đang được phát triển")}
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
                Thêm giao dịch mới
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Bộ lọc giao dịch
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tìm kiếm
                </label>
                <input
                  type="text"
                  id="search"
                  value={state.searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Tìm kiếm theo mã, khách hàng, mô tả..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khoảng thời gian
                </label>
                <TimeRangeFilter
                  value={state.dateRange}
                  onChange={(range) => {
                    if (range) {
                      handleDateRangeChange(range.start, range.end);
                    } else {
                      handleDateRangeChange("", "");
                    }
                  }}
                  placeholder="Tất cả thời gian"
                />
              </div>

              {/* Transaction Type */}
              <div>
                <label
                  htmlFor="transactionType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Loại giao dịch
                </label>
                <select
                  id="transactionType"
                  value={state.transactionType || ""}
                  onChange={(e) =>
                    handleTransactionTypeChange(e.target.value || null)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value="">Tất cả loại</option>
                  <option value="payment">Thanh toán</option>
                  <option value="charge">Cho nợ</option>
                  <option value="adjustment">Điều chỉnh</option>
                  <option value="refund">Hoàn tiền</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Danh sách giao dịch
              </h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Hiển thị</span>
                  <select
                    value={state.pageSize}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        pageSize: Number(e.target.value),
                        currentPage: 1,
                      }))
                    }
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 min-w-[60px]"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-500">giao dịch</span>
                </div>
                <p className="text-sm text-gray-500">
                  Hiển thị {(state.currentPage - 1) * state.pageSize + 1} đến{" "}
                  {Math.min(
                    state.currentPage * state.pageSize,
                    state.totalCount,
                  )}{" "}
                  trong tổng số {state.totalCount} giao dịch
                </p>
              </div>
            </div>
          </div>

          {state.transactions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">Không có giao dịch nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã giao dịch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tài khoản ngân hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chi nhánh
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại giao dịch
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày giao dịch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mô tả
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {state.transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.transaction_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.customer_name ||
                          `Customer #${transaction.customer_id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.bank_account_name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getBranchName(transaction.branch_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}
                        >
                          {getTransactionTypeLabel(
                            transaction.transaction_type,
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        <span
                          className={getTransactionTypeTextColor(
                            transaction.transaction_type,
                          )}
                        >
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {transaction.description || "-"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
      </div>
    </div>
  );
};

export default TransactionList;
