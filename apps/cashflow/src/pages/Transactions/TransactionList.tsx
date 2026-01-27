import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { databaseService } from "../../services/database";
import type { Transaction, Customer } from "../../types";
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
import PageHeader from "../../components/UI/PageHeader";

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customer_id: "",
    bank_account_id: "",
    transaction_type: "payment",
    amount: "",
    description: "",
    reference_number: "",
    transaction_date: new Date().toISOString().slice(0, 10),
  });
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

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const filters = {
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
    state.searchTerm,
    state.dateRange,
    state.transactionType,
    state.customerFilter,
    state.currentPage,
    state.pageSize,
  ]);

  const loadFormOptions = useCallback(async () => {
    const [customerResult, bankResult] = await Promise.all([
      databaseService.customers.getCustomers(),
      databaseService.bankAccounts.getBankAccounts(),
    ]);
    if (customerResult.data) setCustomers(customerResult.data);
    if (bankResult.data) setBankAccounts(bankResult.data);
  }, []);

  useEffect(() => {
    if (!showCreateModal) return;
    loadFormOptions();
  }, [showCreateModal, loadFormOptions]);

  const resetForm = () => {
    setFormData({
      customer_id: "",
      bank_account_id: "",
      transaction_type: "payment",
      amount: "",
      description: "",
      reference_number: "",
      transaction_date: new Date().toISOString().slice(0, 10),
    });
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.bank_account_id || !formData.amount) return;
    setIsSaving(true);
    try {
      const amount = Number(formData.amount);
      const result = await databaseService.transactions.createTransaction({
        customer_id: formData.customer_id,
        bank_account_id: formData.bank_account_id,
        transaction_type: formData.transaction_type,
        amount: Number.isFinite(amount) ? amount : 0,
        description: formData.description,
        reference_number: formData.reference_number,
        transaction_date: formData.transaction_date
          ? new Date(formData.transaction_date).toISOString()
          : new Date().toISOString(),
      });
      if (!result.error) {
        setShowCreateModal(false);
        resetForm();
        fetchTransactions();
      }
    } finally {
      setIsSaving(false);
    }
  };

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
      "1": "Văn phòng chính",
      "2": "Văn phòng Bắc",
      "3": "Văn phòng Nam",
    };
    return branchMap[branchId] || "Văn phòng không xác định";
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
        <PageHeader
          title="Giao dịch"
          subtitle="Quản lý và theo dõi các giao dịch công nợ"
          actions={
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowCreateModal(true)}
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
          }
        />
        {state.customerFilter && (
          <div className="mb-4 flex items-center space-x-2">
            <span className="text-sm text-gray-500">Đang xem giao dịch của:</span>
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      Ngày giao dịch
                    </th>
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
                      Văn phòng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại giao dịch
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mô tả
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {state.transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.transaction_date)}
                      </td>
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

      {showCreateModal && (
        <div className="fixed inset-0 z-[200] overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateTransaction}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Thêm giao dịch mới
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Nhập thông tin giao dịch cho khách hàng
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className="w-6 h-6"
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

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Khách hàng *
                      </label>
                      <select
                        value={formData.customer_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customer_id: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        required
                      >
                        <option value="">Chọn khách hàng</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.full_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tài khoản ngân hàng *
                      </label>
                      <select
                        value={formData.bank_account_id}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            bank_account_id: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        required
                      >
                        <option value="">Chọn tài khoản</option>
                        {bankAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Loại giao dịch *
                        </label>
                        <select
                          value={formData.transaction_type}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              transaction_type: e.target.value,
                            }))
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        >
                          <option value="payment">Thanh toán</option>
                          <option value="charge">Cho nợ</option>
                          <option value="adjustment">Điều chỉnh</option>
                          <option value="refund">Hoàn tiền</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Ngày giao dịch *
                        </label>
                        <input
                          type="date"
                          value={formData.transaction_date}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              transaction_date: e.target.value,
                            }))
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Số tiền *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            amount: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Mã tham chiếu
                      </label>
                      <input
                        type="text"
                        value={formData.reference_number}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            reference_number: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Mô tả
                      </label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:mr-3 sm:w-auto sm:text-sm"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-0 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {isSaving ? "Đang lưu..." : "Tạo giao dịch"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
