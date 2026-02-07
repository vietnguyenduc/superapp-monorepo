import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { Transaction } from "../../../types";
import { formatCurrency, formatDate } from "../../../utils/formatting";
import { databaseService } from "../../../services/database";

interface RecentTransactionsProps {
  transactions: Transaction[];
  maxItems?: number;
  onMaxItemsChange?: (maxItems: number) => void;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  maxItems = 10,
  onMaxItemsChange,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [balanceAfterMap, setBalanceAfterMap] = React.useState<Record<string, number>>({});
  const defaultBranchMap: Record<string, string> = {
    "1": "Văn phòng chính",
    "2": "Văn phòng Bắc",
    "3": "Văn phòng Nam",
  };
  const [branchMap, setBranchMap] = React.useState<Record<string, string>>(defaultBranchMap);

  React.useEffect(() => {
    let isMounted = true;
    const loadBranches = async () => {
      const response = await databaseService.branches.getBranches();
      if (!response?.data || !isMounted) return;
      const map = response.data.reduce((acc: Record<string, string>, branch: any) => {
        const rawName = String(branch.name || branch.branch_name || branch.code || branch.id);
        const normalizedName = rawName.replace(/Chi nhánh/gi, "Văn phòng");
        acc[String(branch.id)] = normalizedName;
        return acc;
      }, {} as Record<string, string>);
      if (Object.keys(map).length > 0) {
        setBranchMap(map);
      }
    };
    loadBranches();
    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    const loadBalances = async () => {
      const response = await databaseService.transactions.getTransactions({
        page: 1,
        pageSize: 5000,
      });
      if (!response?.data || !isMounted) return;
      const all = [...response.data].sort(
        (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime(),
      );
      const runningByCustomer = new Map<string, number>();
      const nextMap: Record<string, number> = {};
      all.forEach((tx) => {
        const prev = runningByCustomer.get(tx.customer_id) || 0;
        let delta = tx.amount;
        if (tx.transaction_type === "charge") delta = -Math.abs(tx.amount);
        else if (tx.transaction_type === "payment" || tx.transaction_type === "refund") {
          delta = Math.abs(tx.amount);
        } else if (tx.transaction_type === "adjustment") {
          delta = tx.amount;
        }
        const next = prev + delta;
        runningByCustomer.set(tx.customer_id, next);
        nextMap[tx.id] = next;
      });
      setBalanceAfterMap(nextMap);
    };
    loadBalances();
    return () => {
      isMounted = false;
    };
  }, []);

  // Function to get office name from branch_id
  const getBranchName = (branchId: string) => {
    return branchMap[String(branchId)] || defaultBranchMap[String(branchId)] || "Văn phòng không xác định";
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">{t("dashboard.noTransactions")}</p>
      </div>
    );
  }

  const displayTransactions = transactions.slice(0, maxItems);

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "payment":
        return "text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900";
      case "charge":
        return "text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900";
      case "adjustment":
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900";
      case "refund":
        return "text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-900";
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

  return (
    <div>
      {/* Display Count Selector */}
      {onMaxItemsChange && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Hiển thị {maxItems}/{transactions.length}
          </span>
          <div className="relative">
            <select
              value={maxItems}
              onChange={(e) => {
                const newValue = Number(e.target.value);
                console.log("Changing maxItems from", maxItems, "to", newValue);
                onMaxItemsChange(newValue);
              }}
              className="appearance-none text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 pr-8 text-gray-900 dark:text-gray-100 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400 dark:text-gray-500"
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
            </div>
          </div>
        </div>
      )}

      {/* Clean Table Layout */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Desktop Table - Hidden on mobile */}
        <div className="hidden lg:block">
          <div className="space-y-3">
            {displayTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => navigate(`/transactions/${transaction.id}`)}
              >
                {/* Top row: Description, Amount, and Type */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/transactions?customer_id=${transaction.customer_id}&customer_name=${encodeURIComponent(transaction.customer_name || '')}`);
                        }}
                        className="text-base font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline decoration-transparent hover:underline"
                      >
                        {transaction.customer_name ||
                          t("dashboard.customerId", { id: transaction.customer_id })}
                      </span>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-200">
                        {formatDate(transaction.transaction_date)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div
                      className={`text-lg font-bold ${
                        transaction.transaction_type === "payment"
                          ? "text-green-600 dark:text-green-300"
                          : "text-red-600 dark:text-red-300"
                      }`}
                    >
                      {formatCurrency(transaction.amount)}
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getTransactionTypeColor(
                        transaction.transaction_type,
                      )}`}
                    >
                      {getTransactionTypeLabel(transaction.transaction_type)}
                    </span>
                  </div>
                </div>

                {/* Bottom row: Account, Office, Date */}
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="text-base font-medium text-gray-900 dark:text-white">
                        {transaction.bank_account_name ||
                          t("dashboard.accountId", { id: transaction.bank_account_id })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-base font-medium text-gray-900 dark:text-white">
                        {getBranchName(transaction.branch_id)}
                      </span>
                    </div>
                  </div>
                  <div />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tablet Layout - Hidden on mobile, visible on tablet */}
        <div className="hidden sm:block lg:hidden">
          <table className="w-full bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-white uppercase tracking-wider">
                  {t("dashboard.description")}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-white uppercase tracking-wider">
                  {t("dashboard.customer")}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-white uppercase tracking-wider">
                  {t("dashboard.account")}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-white uppercase tracking-wider">
                  {t("dashboard.date")}
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-700 dark:text-white uppercase tracking-wider">
                  {t("dashboard.amount")}
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-white uppercase tracking-wider">
                  {t("dashboard.type")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {displayTransactions.map((transaction) => (
                <tr 
                  key={transaction.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => navigate(`/transactions/${transaction.id}`)}
                >
                  <td className="px-3 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {transaction.description ||
                        transaction.customer_name ||
                        t("dashboard.customerId", { id: transaction.customer_id })}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm text-gray-900 dark:text-white truncate">
                      {transaction.customer_name ||
                        t("dashboard.customerId", { id: transaction.customer_id })}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm text-gray-900 dark:text-white truncate">
                      {transaction.bank_account_name ||
                        t("dashboard.accountId", { id: transaction.bank_account_id })}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(transaction.transaction_date)}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div
                      className={`text-sm font-bold ${
                        transaction.transaction_type === "payment"
                          ? "text-green-600 dark:text-green-300"
                          : "text-red-600 dark:text-red-300"
                      }`}
                    >
                      {formatCurrency(transaction.amount)}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(
                        transaction.transaction_type,
                      )}`}
                    >
                      {getTransactionTypeLabel(transaction.transaction_type)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile-optimized cards for very small screens */}
        <div className="sm:hidden divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-800">
          {displayTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="p-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => navigate(`/transactions/${transaction.id}`)}
            >
              {/* Top row: Description and Amount (Priority) */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(transaction.transaction_date)}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div
                    className={`text-base font-bold ${
                      transaction.transaction_type === "payment"
                        ? "text-green-600 dark:text-green-300"
                        : "text-red-600 dark:text-red-300"
                    }`}
                  >
                    {formatCurrency(transaction.amount)}
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getTransactionTypeColor(
                      transaction.transaction_type,
                    )}`}
                  >
                    {getTransactionTypeLabel(transaction.transaction_type)}
                  </span>
                </div>
              </div>

              {/* Customer and Office Info */}
              <div className="mb-3 space-y-1">
                <div className="text-xs text-gray-600 dark:text-white">
                  <span className="font-medium">Khách hàng:</span> {transaction.customer_name ||
                    t("dashboard.customerId", { id: transaction.customer_id })}
                </div>
                <div className="text-xs text-gray-600 dark:text-white flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="font-medium">Văn phòng:</span>
                  <span>{getBranchName(transaction.branch_id)}</span>
                </div>
              </div>

              {/* Bottom row: Bank account + Outstanding balance */}
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-700 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="font-medium">Tài khoản:</span>
                  <span className="truncate">{transaction.bank_account_name ||
                    t("dashboard.accountId", { id: transaction.bank_account_id })}</span>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-[11px] text-gray-500 dark:text-gray-300">Số dư sau GD</div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(balanceAfterMap[transaction.id] ?? 0)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {transactions.length > maxItems && !onMaxItemsChange && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Hiển thị {maxItems}/{transactions.length} giao dịch
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
