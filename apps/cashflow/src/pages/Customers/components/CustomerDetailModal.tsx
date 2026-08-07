import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Customer, Transaction } from "../../../types";
import { databaseService } from "../../../services/database";
import { useCompanyId } from "../../../hooks/useCompanyId";
import { formatCurrency, formatDate, formatPhoneNumber, fetchColorSettings, getTransactionTypeColor, getCustomerDetailBalanceColor, getTransactionTypeAmountColor } from "../../../utils/formatting";
import { getCustomerBalanceDelta, parseAmount } from "../../../services/businessLogic";
import { useTransactionTypes } from "../../../contexts/TransactionTypeContext";
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
  const companyId = useCompanyId();
  const { getNameById: getTransactionTypeName } = useTransactionTypes();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch customer transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const result = await databaseService.transactions.getTransactions({
          customer_id: customer.id,
          company_id: companyId,
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
  }, [customer.id, companyId]);

  // Fetch color settings on mount
  useEffect(() => {
    fetchColorSettings();
  }, []);

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

  const openingBalance = customer.opening_balance ?? 0;

  // Tính công nợ hiện tại real-time từ opening_balance + signed customer deltas
  // Negative balance = debt (red); positive = credit/overpayment (green)
  const currentBalance = transactions.reduce((balance, transaction) => {
    return balance + getCustomerBalanceDelta(transaction.transaction_type, transaction.amount);
  }, openingBalance);

  // Tìm giao dịch cuối từ transactions array
  const lastTransactionDate = transactions.length > 0
    ? transactions.reduce((latest, tx) => {
      const txDate = new Date(tx.transaction_date);
      const latestDate = new Date(latest.transaction_date);
      return txDate > latestDate ? tx : latest;
    }).transaction_date
    : null;

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-700/70 dark:bg-gray-900/80 transition-opacity"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-6 sm:align-middle max-w-full sm:max-w-md md:max-w-2xl lg:max-w-4xl sm:w-full w-full mx-4 sm:mx-0">
          <div className="bg-white dark:bg-gray-900 px-3 pt-4 pb-3 sm:px-4 sm:pt-5 sm:pb-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                  Chi tiết khách hàng
                </h3>
                <p className="mt-0.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Xem thông tin và lịch sử giao dịch
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onEdit}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
                  title="Sửa"
                >
                  <svg
                    className="w-3.5 h-3.5 mr-1"
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
                  Sửa
                </button>
                <button
                  onClick={onClose}
                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
                >
                  Đóng
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Customer Information */}
              <div>
                <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">
                  Thông tin khách hàng
                </h4>

                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Mã khách hàng
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {customer.customer_code || "-"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                      Họ và tên
                    </dt>
                    <dd className="mt-0.5 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      {customer.full_name || "-"}
                    </dd>
                  </div>

                  {customer.email && (
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                        Email
                      </dt>
                      <dd className="mt-0.5 text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">
                        {customer.email}
                      </dd>
                    </div>
                  )}

                  {customer.phone && (
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                        Số điện thoại
                      </dt>
                      <dd className="mt-0.5 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        {formatPhoneNumber(customer.phone)}
                      </dd>
                    </div>
                  )}

                  {customer.address && (
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                        Địa chỉ
                      </dt>
                      <dd className="mt-0.5 text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">
                        {customer.address}
                      </dd>
                    </div>
                  )}

                  {customer.nguoi_dai_dien && (
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                        Người đại diện
                      </dt>
                      <dd className="mt-0.5 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        {customer.nguoi_dai_dien}
                      </dd>
                    </div>
                  )}

                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                      Trạng thái
                    </dt>
                    <dd className="mt-0.5">
                      {getStatusBadge(customer.is_active)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                      Ngày tạo
                    </dt>
                    <dd className="mt-0.5 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      {customer.created_at ? formatDate(customer.created_at) : "-"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/60">
                  <h5 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                    Cách làm việc công nợ
                  </h5>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {customer.working_method ||
                      "Thu nợ theo chu kỳ 7 ngày. Khách hàng xác nhận đối soát vào thứ Hai, thanh toán trước 17:00 cùng ngày. Nếu quá hạn 3 ngày sẽ chuyển nhắc nợ lần 2 và áp dụng mức chiết khấu 1% khi thanh toán trong tuần."}
                  </p>
                </div>
              </div>

              {/* Financial Summary */}
              <div>
                <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">
                  Tóm tắt tài chính
                </h4>

                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                      Công nợ hiện tại
                    </dt>
                    <dd
                      className={`mt-0.5 text-xl sm:text-2xl font-bold ${getCustomerDetailBalanceColor(currentBalance)}`}
                    >
                      {formatCurrency(currentBalance)}
                    </dd>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                        Số dư đầu kỳ
                      </dt>
                      <dd className="mt-0.5 text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(customer.opening_balance ?? 0)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                        Cập nhật lúc
                      </dt>
                      <dd className="mt-0.5 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        {customer.opening_balance_updated_at
                          ? formatDate(customer.opening_balance_updated_at)
                          : customer.updated_at
                            ? formatDate(customer.updated_at)
                            : customer.created_at
                              ? formatDate(customer.created_at)
                              : "-"}
                      </dd>
                    </div>
                  </div>

                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                      Tổng số tiền mua hàng
                    </dt>
                    <dd className="mt-0.5 text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(totalPurchaseAmount)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                      Giao dịch cuối
                    </dt>
                    <dd className="mt-0.5 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      {lastTransactionDate
                        ? formatDate(lastTransactionDate)
                        : "Không có giao dịch"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                      Tổng giao dịch
                    </dt>
                    <dd className="mt-0.5 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                      {transactions.length}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Transaction History */}
            <div className="mt-6">
              <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">
                Lịch sử giao dịch
              </h4>

              {loading ? (
                <LoadingFallback
                  title={t("customers.detail.loadingTransactions")}
                  message={t("customers.detail.loadingTransactionsMessage")}
                  size="sm"
                />
              ) : error ? (
                <div className="text-center py-3">
                  <p className="text-xs sm:text-sm text-red-600">{error}</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {t("customers.detail.noTransactions")}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ngày
                        </th>
                        <th className="px-3 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Loại
                        </th>
                        <th className="px-3 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Số tiền
                        </th>
                        <th className="px-3 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Mô tả
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {transactions.slice(0, 10).map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-3 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(transaction.transaction_date)}
                          </td>
                          <td className="px-3 sm:px-4 py-2 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}
                            >
                              {getTransactionTypeName(transaction.transaction_type)}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                            <span
                              className={`text-xs sm:text-sm font-bold ${getTransactionTypeAmountColor(transaction.transaction_type, transaction.amount)}`}
                            >
                              {formatCurrency(parseAmount(transaction.amount))}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-900 truncate max-w-[150px] sm:max-w-[200px]">
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
