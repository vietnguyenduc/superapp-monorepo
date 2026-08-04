import { parseAmount } from "./parsers";
import type { Transaction } from "../../types";

/**
 * Single source of truth for how a transaction affects a customer's balance.
 * Negative result = customer owes money (debt / công nợ).
 * Positive result = customer has credit / overpayment.
 */
export function getCustomerBalanceDelta(transactionType: string, amount: number | string): number {
  const signed = parseAmount(amount);
  const absolute = Math.abs(signed);
  const type = String(transactionType ?? "").toLowerCase().trim();

  switch (type) {
    case "charge":
      return -absolute;
    case "payment":
    case "refund":
      return absolute;
    case "adjustment":
      return signed;
    default:
      return signed;
  }
}

/**
 * Single source of truth for how a transaction affects a bank account's cash balance.
 * Charge does not move cash (it creates receivable), payment/refund move cash,
 * and adjustment uses the signed amount.
 */
export function getBankAccountBalanceDelta(transactionType: string, amount: number | string): number {
  const signed = parseAmount(amount);
  const absolute = Math.abs(signed);
  const type = String(transactionType ?? "").toLowerCase().trim();

  switch (type) {
    case "payment":
      return absolute;
    case "refund":
      return -absolute;
    case "adjustment":
      return signed;
    case "charge":
    default:
      return 0;
  }
}

export function applyTransactionsToCustomerBalance(
  openingBalance: number,
  transactions: Pick<Transaction, "transaction_type" | "amount">[],
): number {
  return transactions.reduce(
    (balance, tx) => balance + getCustomerBalanceDelta(tx.transaction_type, tx.amount),
    openingBalance,
  );
}

export function applyTransactionsToBankAccountBalance(
  openingBalance: number,
  transactions: Pick<Transaction, "transaction_type" | "amount">[],
): number {
  return transactions.reduce(
    (balance, tx) => balance + getBankAccountBalanceDelta(tx.transaction_type, tx.amount),
    openingBalance,
  );
}
