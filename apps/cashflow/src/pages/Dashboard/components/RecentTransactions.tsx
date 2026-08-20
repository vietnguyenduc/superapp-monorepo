import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { Transaction } from "../../../types";
import {
  formatCurrency,
  formatDate,
  formatBankAccountLabel,
  formatShortTransactionCode,
  getTransactionTypeColor,
  getTransactionTypeAmountColor,
} from "../../../utils/formatting";
import { parseAmount } from "../../../services/businessLogic";
import { useTransactionTypes } from "../../../contexts/TransactionTypeContext";

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
  const { getNameById: getTransactionTypeName } = useTransactionTypes();

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">{t("dashboard.noTransactions")}</p>
      </div>
    );
  }

  const displayTransactions = transactions.slice(0, maxItems);

  const getCustomerTransactionsUrl = (transaction: Transaction) => {
    const params = new URLSearchParams();
    if (transaction.customer_id) {
      params.set("customer_id", transaction.customer_id);
    }
    if (transaction.customer_name) {
      params.set("customer_name", transaction.customer_name);
    }
    return `/transactions?${params.toString()}`;
  };

  return (
    <div>
      {onMaxItemsChange && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Hiển thị {displayTransactions.length}/{transactions.length}
          </span>
          <div className="relative">
            <select
              value={maxItems}
              onChange={(e) => onMaxItemsChange(Number(e.target.value))}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {displayTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => navigate(getCustomerTransactionsUrl(transaction))}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                  {transaction.customer_name ||
                    t("dashboard.customerId", { id: transaction.customer_id })}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                    {formatShortTransactionCode(transaction.transaction_code || "")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(transaction.transaction_date)}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <p
                  className={`text-base sm:text-lg font-bold ${getTransactionTypeAmountColor(
                    transaction.transaction_type,
                    transaction.amount,
                  )}`}
                >
                  {formatCurrency(parseAmount(transaction.amount))}
                </p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getTransactionTypeColor(
                    transaction.transaction_type,
                  )}`}
                >
                  {getTransactionTypeName(transaction.transaction_type)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
              {transaction.bank_account_name || transaction.bank_accounts || transaction.bank_account_id ? (
                <span className="inline-flex items-center gap-1 truncate">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  {transaction.bank_account_name ||
                    formatBankAccountLabel(
                      transaction.bank_accounts?.bank_name,
                      transaction.bank_accounts?.account_number,
                      transaction.bank_accounts?.account_name,
                    ) ||
                    `#${transaction.bank_account_id}`}
                </span>
              ) : null}
              {transaction.branch_name || transaction.branch_id ? (
                <span className="inline-flex items-center gap-1 truncate">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {transaction.branch_name || transaction.branches?.name || `VP #${transaction.branch_id}`}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {transactions.length > maxItems && !onMaxItemsChange && (
        <div className="text-center pt-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Hiển thị {maxItems}/{transactions.length} giao dịch
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
