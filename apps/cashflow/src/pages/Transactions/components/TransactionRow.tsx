import React, { memo } from "react";
import type { Transaction } from "../../../types";
import {
  formatCurrency,
  formatDate,
  getTransactionTypeColor,
  getTransactionTypeAmountColor,
  formatBankAccountLabel,
  formatShortTransactionCode,
} from "../../../utils/formatting";
import { parseAmount } from "../../../services/businessLogic";
import { databaseService } from "../../../services/database";
import { toast } from "../../../utils/toast";

/**
 * Props for a single transaction row in the desktop table.
 *
 * All callback props are expected to be stable (useCallback-wrapped in the
 * parent) so React.memo can skip re-renders when only unrelated state changes.
 */
interface TransactionRowProps {
  transaction: Transaction;
  visibleColumnKeys: string[];
  customerName: string;
  customerCode: string;
  getTransactionTypeName: (type: string) => string;
  resolveCreatorName: (
    createdBy?: string | null,
    creatorName?: string | null,
    creatorEmail?: string | null,
  ) => string;
  canApprove: boolean;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  onNavigate: (path: string) => void;
}

/**
 * Desktop table row for a single transaction.
 *
 * Extracted from TransactionList.tsx and wrapped in React.memo so that
 * parent re-renders (e.g. typing in the search box) don't re-render every
 * visible row. The memo comparison is the default shallow comparison, which
 * works because all props are either primitives or stable callbacks.
 */
const TransactionRowBase: React.FC<TransactionRowProps> = ({
  transaction,
  visibleColumnKeys,
  customerName,
  customerCode,
  getTransactionTypeName,
  resolveCreatorName,
  canApprove,
  onEdit,
  onDelete,
  onRefresh,
  onNavigate,
}) => {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {formatDate(transaction.transaction_date)}
      </td>
      <td className="px-2 py-2 text-sm text-gray-900 dark:text-white">
        {transaction.customer_id ? (
          <>
            <button
              type="button"
              className="block w-full text-left bg-transparent p-0 border-none text-gray-900 dark:text-white hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate font-medium"
              title={customerName || `Customer #${transaction.customer_id}`}
              onClick={() => onNavigate(`/customers/${transaction.customer_id}`)}
            >
              {customerName || `Customer #${transaction.customer_id}`}
            </button>
            {customerCode ? (
              <div className="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400 truncate">{customerCode}</div>
            ) : null}
          </>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">—</span>
        )}
      </td>
      {visibleColumnKeys.includes("type") && (
        <td className="px-2 py-2">
          <span
            className={`inline-block max-w-full truncate px-1.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}
            title={getTransactionTypeName(transaction.transaction_type)}
          >
            {getTransactionTypeName(transaction.transaction_type)}
          </span>
        </td>
      )}
      {visibleColumnKeys.includes("amount") && (
        <td className="px-2 py-2 text-right">
          <span
            className={`text-sm font-bold ${getTransactionTypeAmountColor(transaction.transaction_type, transaction.amount)}`}
          >
            {formatCurrency(parseAmount(transaction.amount))}
          </span>
        </td>
      )}
      {visibleColumnKeys.includes("branch") && (
        <td className="px-2 py-2 text-sm text-gray-900 dark:text-white truncate" title={transaction.branch_name || undefined}>
          {transaction.branch_name || "—"}
        </td>
      )}
      {visibleColumnKeys.includes("bank") && (
        <td className="px-2 py-2 text-sm text-gray-900 dark:text-white truncate" title={transaction.bank_account_name || undefined}>
          {transaction.bank_account_name || formatBankAccountLabel(
            transaction.bank_accounts?.bank_name,
            transaction.bank_accounts?.account_number,
            transaction.bank_accounts?.account_name,
          ) || (transaction.bank_account_id ? `#${transaction.bank_account_id}` : "—")}
        </td>
      )}
      {visibleColumnKeys.includes("creator") && (
        <td className="px-2 py-2 text-sm text-gray-900 dark:text-white truncate" title={resolveCreatorName(transaction.created_by, transaction.creator_name, transaction.users?.email) || undefined}>
          {resolveCreatorName(transaction.created_by, transaction.creator_name, transaction.users?.email)}
        </td>
      )}
      {visibleColumnKeys.includes("code") && (
        <td className="px-2 py-2 text-xs font-medium text-gray-900 dark:text-white">
          <span
            className="inline-block max-w-full truncate font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs"
            title={transaction.transaction_code}
          >
            {formatShortTransactionCode(transaction.transaction_code || "")}
          </span>
        </td>
      )}
      {visibleColumnKeys.includes("status") && (
        <td className="px-2 py-2">
          {transaction.status === "draft" ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Nháp</span>
          ) : transaction.status === "pending" ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Chờ</span>
          ) : transaction.status === "rejected" ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Từ chối</span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Xong</span>
          )}
        </td>
      )}
      <td className="px-2 py-2 text-sm text-gray-900 dark:text-white">
        <div className="flex flex-wrap items-center gap-1">
          {transaction.status === "draft" && (
            <button
              type="button"
              className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-xs"
              onClick={async () => {
                if (!confirm("Gửi giao dịch Nháp để chờ duyệt?")) return;
                const { error } = await databaseService.transactions.updateTransaction(transaction.id, { status: "pending" });
                if (error) toast.error("Lỗi khi gửi duyệt"); else onRefresh();
              }}
            >
              Gửi
            </button>
          )}
          {canApprove && (transaction.status === "pending" || transaction.status === "rejected") && (
            <button
              type="button"
              className="px-1.5 py-0.5 rounded border border-green-300 dark:border-green-600 text-green-700 dark:text-green-200 bg-green-50 dark:bg-green-900/40 hover:bg-green-100 dark:hover:bg-green-800 font-medium text-xs"
              onClick={async () => {
                if (!confirm("Duyệt giao dịch vào công nợ?")) return;
                const { error } = await databaseService.transactions.updateTransaction(transaction.id, { status: "completed" });
                if (error) toast.error("Lỗi khi duyệt"); else onRefresh();
              }}
            >
              Duyệt
            </button>
          )}
          {canApprove && transaction.status === "pending" && (
            <button
              type="button"
              className="px-1.5 py-0.5 rounded border border-red-300 dark:border-red-600 text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-900/40 hover:bg-red-100 dark:hover:bg-red-800 font-medium text-xs"
              onClick={async () => {
                if (!confirm("Từ chối giao dịch này?")) return;
                const { error } = await databaseService.transactions.updateTransaction(transaction.id, { status: "rejected" });
                if (error) toast.error("Lỗi khi từ chối"); else onRefresh();
              }}
            >
              Từ chối
            </button>
          )}
          <button
            type="button"
            className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs"
            onClick={() => onEdit(transaction)}
          >
            Sửa
          </button>
          <button
            type="button"
            className="px-1.5 py-0.5 rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/40 dark:text-red-200 text-xs"
            onClick={() => onDelete(transaction.id)}
          >
            Xóa
          </button>
        </div>
      </td>
    </tr>
  );
};

export const TransactionRow = memo(TransactionRowBase);
