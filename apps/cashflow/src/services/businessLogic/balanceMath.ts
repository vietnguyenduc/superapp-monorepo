import { parseAmount } from "./parsers";
import type { Transaction } from "../../types";

/**
 * Single source of truth for how a transaction affects a customer's balance.
 * Negative result = customer owes money (debt / công nợ).
 * Positive result = customer has credit / overpayment.
 *
 * For payment/charge/refund the amount sign reverses the normal direction:
 * e.g. charge -1000 reduces the customer's debt by 1000 (same customer effect
 * as payment 1000), while payment -1000 increases debt by 1000.
 * Adjustments and unknown types keep the signed amount as-is.
 */
export function getCustomerBalanceDelta(transactionType: string, amount: number | string): number {
  const signed = parseAmount(amount);
  const magnitude = Math.abs(signed);
  const sign = signed === 0 ? 1 : Math.sign(signed);
  const type = String(transactionType ?? "").toLowerCase().trim();

  switch (type) {
    case "charge":
      return -magnitude * sign;
    case "payment":
    case "refund":
    case "deposit":
      return magnitude * sign;
    case "adjustment":
    default:
      return signed;
  }
}

/**
 * Single source of truth for how a transaction affects a bank account's cash balance.
 * Charge does not move cash (it creates receivable), payment/refund move cash,
 * and adjustment uses the signed amount.
 *
 * The amount sign reverses the cash-flow direction for payment/refund:
 * e.g. payment -1000 is a cash outflow of 1000, refund -1000 is a cash inflow.
 */
export function getBankAccountBalanceDelta(transactionType: string, amount: number | string): number {
  const signed = parseAmount(amount);
  const magnitude = Math.abs(signed);
  const sign = signed === 0 ? 1 : Math.sign(signed);
  const type = String(transactionType ?? "").toLowerCase().trim();

  switch (type) {
    case "payment":
    case "deposit":
      return magnitude * sign;
    case "refund":
      return -magnitude * sign;
    case "adjustment":
    default:
      return signed;
    case "charge":
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
