import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "../../components/UI/Button";
import { useAuth } from "../../hooks/useAuth";
import { databaseService } from "../../services/database";
import { Customer, Transaction } from "../../types";
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
        <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold text-gray-900">
              {customer.full_name}
            </h1>
            <p className="text-gray-600 mt-1">{customer.customer_code}</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate("/customers")}
            >
              {t("common.back")}
            </Button>
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
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Thông tin khách hàng
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Mã khách hàng
                </label>
                <p className="text-sm text-gray-900">
                  {customer.customer_code}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Họ và tên
                </label>
                <p className="text-sm text-gray-900">{customer.full_name}</p>
              </div>

              {customer.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Số điện thoại
                  </label>
                  <p className="text-sm text-gray-900">{customer.phone}</p>
                </div>
              )}

              {customer.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <p className="text-sm text-gray-900">{customer.email}</p>
                </div>
              )}

              {customer.address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Địa chỉ
                  </label>
                  <p className="text-sm text-gray-900">{customer.address}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">
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
                <label className="text-sm font-medium text-gray-500">
                  Ngày tạo
                </label>
                <p className="text-sm text-gray-900">
                  {formatDate(customer.created_at)}
                </p>
              </div>

              {customer.last_transaction_date && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Giao dịch cuối
                  </label>
                  <p className="text-sm text-gray-900">
                    {formatDate(customer.last_transaction_date)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Tóm tắt tài chính
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">
                  Công nợ hiện tại
                </p>
                <p
                  className={`text-2xl font-bold ${
                    customer.total_balance >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(customer.total_balance)}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">
                  Tổng số tiền mua hàng
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(
                    transactions
                      .filter((t) => t.transaction_type === "charge")
                      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
                  )}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">
                  Tổng giao dịch
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.length}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">
                  Giao dịch trung bình
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.length > 0
                    ? formatCurrency(
                        transactions.reduce(
                          (sum, t) => sum + Math.abs(t.amount),
                          0,
                        ) / transactions.length,
                      )
                    : formatCurrency(0)}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Lịch sử giao dịch
              </h2>
            </div>

            <div className="overflow-x-auto">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Không có giao dịch nào</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số tiền
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mô tả
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số tham chiếu
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(transaction.transaction_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.transaction_type === "payment"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {transaction.transaction_type === "payment"
                              ? "Tiền vào"
                              : "Tiền ra"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span
                            className={
                              transaction.transaction_type === "payment"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {formatCurrency(Math.abs(transaction.amount))}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.description || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.reference_number || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
