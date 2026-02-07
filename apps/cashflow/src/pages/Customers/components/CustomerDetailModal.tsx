import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Customer, Transaction } from "../../../types";
import { databaseService } from "../../../services/database";
import {
  formatCurrency,
  formatDate,
  formatPhoneNumber,
} from "../../../utils/formatting";
import { LoadingFallback } from "../../../components/UI/FallbackUI";

interface CustomerDetailModalProps {
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  onClose,
  onEdit,
}) => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch customer transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const result = await databaseService.transactions.getTransactions({
          customer_id: customer.id,
          limit: 50,
        });

        if (result.error) {
          setError(result.error);
        } else {
          setTransactions(result.data);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load transactions",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [customer.id]);

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "payment":
        return "text-green-600 bg-green-100";
      case "charge":
        return "text-red-600 bg-red-100";
      case "adjustment":
        return "text-yellow-600 bg-yellow-100";
      case "refund":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "payment":
        return t("transactions.types.payment");
      case "charge":
        return t("transactions.types.charge");
      case "adjustment":
        return t("transactions.types.adjustment");
      case "refund":
        return t("transactions.types.refund");
      default:
        return type;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Hoạt động
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Không hoạt động
      </span>
    );
  };

  // Tính tổng số tiền mua hàng từ các giao dịch loại 'charge' (tiền ra)
  const totalPurchaseAmount = transactions
    .filter((transaction) => transaction.transaction_type === "charge")
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Chi tiết khách hàng
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Xem thông tin và lịch sử giao dịch
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onEdit}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  title="Sửa"
                </button>
                <button
                  onClick={onClose}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Đóng
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Thông tin khách hàng
                </h4>

                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Mã khách hàng
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {customer.customer_code}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Họ và tên
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {customer.full_name}
                    </dd>
                  </div>

                  {customer.email && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Email
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {customer.email}
                      </dd>
                    </div>
                  )}

                  {customer.phone && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Số điện thoại
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatPhoneNumber(customer.phone)}
                      </dd>
                    </div>
                  )}

                  {customer.address && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Địa chỉ
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {customer.address}
                      </dd>
                    </div>
                  )}

                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Trạng thái
                    </dt>
                    <dd className="mt-1">
                      {getStatusBadge(customer.is_active)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Ngày tạo
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(customer.created_at)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Financial Summary */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Tóm tắt tài chính
                </h4>

                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Công nợ hiện tại
                    </dt>
                    <dd
                      className={`mt-1 text-2xl font-bold ${
                        customer.total_balance < 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {formatCurrency(customer.total_balance)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Tổng số tiền mua hàng
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-blue-600">
                      {formatCurrency(totalPurchaseAmount)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Giao dịch cuối
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {customer.last_transaction_date
                        ? formatDate(customer.last_transaction_date)
                        : "Không có giao dịch"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Tổng giao dịch
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {transactions.length}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Transaction History */}
            <div className="mt-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Lịch sử giao dịch
              </h4>

              {loading ? (
                <LoadingFallback
                  title={t("customers.detail.loadingTransactions")}
                  message={t("customers.detail.loadingTransactionsMessage")}
                  size="sm"
                />
              ) : error ? (
                <div className="text-center py-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">
                    {t("customers.detail.noTransactions")}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.slice(0, 10).map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(transaction.transaction_date)}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span
                              className={
                                transaction.transaction_type === "charge"
                                  ? "text-red-600"
                                  : "text-green-600"
                              }
                            >
                              {formatCurrency(transaction.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {transaction.description || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailModal;
