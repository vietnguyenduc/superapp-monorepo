import React from "react";
import { useTranslation } from "react-i18next";
import { Transaction } from "../../../types";
import { formatCurrency } from "../../../utils/formatting";

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

  // Function to get branch name from branch_id
  const getBranchName = (branchId: string) => {
    const branchMap: { [key: string]: string } = {
      "1": "Chi nhánh chính",
      "2": "Chi nhánh Bắc",
      "3": "Chi nhánh Nam",
    };
    return branchMap[branchId] || "Chi nhánh không xác định";
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t("dashboard.noTransactions")}</p>
      </div>
    );
  }

  const displayTransactions = transactions.slice(0, maxItems);

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

  return (
    <div>
      {/* Display Count Selector */}
      {onMaxItemsChange && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">
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
              className="appearance-none text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 pr-8 text-gray-900 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
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

      <div className="space-y-3">
        {displayTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="grid grid-cols-[auto_1fr_auto] gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {/* Date - Apple Style - Fixed Width */}
            <div className="w-20 flex justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 leading-none">
                  {new Date(transaction.transaction_date).getDate()}
                </div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  {new Date(transaction.transaction_date).toLocaleDateString(
                    "vi-VN",
                    { month: "short" },
                  )}
                </div>
              </div>
            </div>

            {/* Transaction Content - Flexible Width */}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {transaction.description ||
                  transaction.customer_name ||
                  t("dashboard.customerId", { id: transaction.customer_id })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {transaction.customer_name ||
                  t("dashboard.customerId", {
                    id: transaction.customer_id,
                  })}{" "}
                •{" "}
                {transaction.bank_account_name ||
                  t("dashboard.accountId", {
                    id: transaction.bank_account_id,
                  })}{" "}
                • {getBranchName(transaction.branch_id)}
              </p>
            </div>

            {/* Amount and Transaction Type - Fixed Width */}
            <div className="w-32 text-right">
              <p
                className={`text-sm font-bold ${
                  transaction.transaction_type === "payment"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(transaction.amount)}
              </p>
              <div className="mt-1 flex justify-end">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getTransactionTypeColor(
                    transaction.transaction_type,
                  )}`}
                >
                  {getTransactionTypeLabel(transaction.transaction_type)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {transactions.length > maxItems && !onMaxItemsChange && (
          <div className="text-center pt-2">
            <p className="text-sm text-gray-500">
              Hiển thị {maxItems}/{transactions.length} giao dịch
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
