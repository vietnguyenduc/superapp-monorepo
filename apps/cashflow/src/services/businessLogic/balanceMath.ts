import { parseAmount, normalizeTransactionType } from "./parsers";
import type { Transaction } from "../../types";

/**
 * Single source of truth for how a transaction affects a customer's balance.
 *
 * Convention: POSITIVE total_balance = debt / công nợ.  This matches the
 * production DB and the user's formula:
 *   Công nợ = Đầu kỳ + Phát sinh tăng - Phát sinh giảm + Hoàn tiền + Điều chỉnh - Đặt cọc
 *
 * Each transaction type has a `math_factor` (1 or -1).  The customer balance
 * delta is simply `amount * math_factor`.  When no `mathFactor` is provided we
 * fall back to the canonical factors stored in `transaction_types`:
 *   charge      -> +1  (phát sinh tăng, tăng công nợ)
 *   payment     -> -1  (phát sinh giảm, giảm công nợ)
 *   refund      -> +1  (hoàn tiền, tăng công nợ)
 *   deposit     -> -1  (đặt cọc, giảm công nợ)
 *   adjustment  -> +1  (use signed amount, factor +1)
 */
const DEFAULT_CUSTOMER_FACTORS: Record<string, number> = {
  charge: 1,
  payment: -1,
  refund: 1,
  deposit: -1,
  adjustment: 1,
};

export function getCustomerBalanceDelta(
  transactionType: string,
  amount: number | string,
  mathFactor?: number | null,
): number {
  const signed = parseAmount(amount);
  const canonical = normalizeTransactionType(transactionType);

  let factor: number;
  if (mathFactor !== undefined && mathFactor !== null) {
    factor = Number(mathFactor);
  } else {
    factor = DEFAULT_CUSTOMER_FACTORS[canonical] ?? 1;
  }

  return signed * factor;
}

/**
 * Single source of truth for how a transaction affects a bank account's cash balance.
 * Charge does not move cash (it creates receivable), payment/deposit move cash in,
 * refund moves cash out, and adjustment uses the signed amount.
 */
export function getBankAccountBalanceDelta(transactionType: string, amount: number | string): number {
  const signed = parseAmount(amount);
  const magnitude = Math.abs(signed);
  const sign = signed === 0 ? 1 : Math.sign(signed);
  const type = normalizeTransactionType(transactionType);

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
  factorMap?: Record<string, number>,
): number {
  return transactions.reduce(
    (balance, tx) =>
      balance +
      getCustomerBalanceDelta(
        tx.transaction_type,
        tx.amount,
        factorMap?.[tx.transaction_type],
      ),
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
