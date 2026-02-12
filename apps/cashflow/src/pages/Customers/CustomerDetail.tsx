import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "../../components/UI/Button";
import { useAuth } from "../../hooks/useAuth";
import { databaseService } from "../../services/database";
import type { Customer, Transaction } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatting";
import { LoadingFallback, ErrorFallback } from "../../components/UI/FallbackUI";

const CustomerDetail: React.FC = () => {
  const { t } = useTranslation();
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "payment":
        return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200";
      case "charge":
        return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
      case "adjustment":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200";
      case "refund":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customerId) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch customer details
        const customerResult =
          await databaseService.customers.getCustomerById(customerId);
        if (customerResult.error) {
          setError(customerResult.error);
          return;
        }
        setCustomer(customerResult.data);

        // Fetch customer transactions
        const transactionsResult =
          await databaseService.transactions.getTransactions({
            customer_id: customerId,
            branch_id: user?.branch_id,
          });
        if (transactionsResult.error) {
          console.error(
            "Failed to fetch transactions:",
            transactionsResult.error,
          );
        } else {
          setTransactions(transactionsResult.data || []);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch customer data",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerId, user?.branch_id]);

  if (loading) {
    return (
      <LoadingFallback
        title={t("common.loading")}
        message={t("customers.loadingCustomer")}
      />
    );
  }

  if (error) {
    return (
      <ErrorFallback
        title={t("common.error")}
        message={error}
        retry={() => window.location.reload()}
      />
    );
  }

  if (!customer) {
    return (
      <ErrorFallback
        title={t("common.error")}
        message={t("customers.customerNotFound")}
        retry={() => navigate("/customers")}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => navigate("/customers")}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Quay lại
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
              {customer.full_name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{customer.customer_code}</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => alert("Tính năng đang được phát triển")}
            >
              {t("common.edit")}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Information */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Thông tin khách hàng
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Mã khách hàng
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {customer.customer_code}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Họ và tên
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{customer.full_name}</p>
              </div>

              {customer.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Số điện thoại
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">{customer.phone}</p>
                </div>
              )}

              {customer.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">{customer.email}</p>
                </div>
              )}

              {customer.address && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Địa chỉ
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">{customer.address}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Trạng thái
                </label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    customer.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {customer.is_active ? "Hoạt động" : "Không hoạt động"}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Ngày tạo
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDate(customer.created_at)}
                </p>
              </div>

              {customer.last_transaction_date && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Giao dịch cuối
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDate(customer.last_transaction_date)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 mt-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Cách làm việc
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {customer.working_method ||
                "Thu nợ theo chu kỳ 7 ngày. Khách hàng xác nhận đối soát vào thứ Hai, thanh toán trước 17:00 cùng ngày. Nếu quá hạn 3 ngày sẽ chuyển nhắc nợ lần 2 và áp dụng mức chiết khấu 1% khi thanh toán trong tuần."}
            </p>
          </div>

        </div>
        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Lịch sử giao dịch
              </h2>
            </div>

            <div className="overflow-x-auto">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Không có giao dịch nào</p>
                </div>
              ) : (
                <>
                  <div className="sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="p-4 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatDate(transaction.transaction_date)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                              {transaction.description || "-"}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-auto">
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {formatCurrency(transaction.amount)}
                            </div>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium mt-1 ${getTransactionTypeColor(
                                transaction.transaction_type,
                              )}`}
                            >
                              {getTransactionTypeLabel(transaction.transaction_type)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-300">
                          <span className="inline-flex items-center gap-1">
                            <span className="font-medium">Văn phòng:</span>
                            <span className="truncate">{transaction.branch_id || "-"}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="font-medium">Mã:</span>
                            <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                              {transaction.transaction_code}
                            </span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden sm:block">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Ngày
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Loại
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                            Số tiền
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Mô tả
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Văn phòng
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {formatDate(transaction.transaction_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(
                                  transaction.transaction_type,
                                )}`}
                              >
                                {getTransactionTypeLabel(transaction.transaction_type)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white tabular-nums">
                              <div className="flex justify-end">
                                {formatCurrency(transaction.amount)}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {transaction.description || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {transaction.branch_id || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
