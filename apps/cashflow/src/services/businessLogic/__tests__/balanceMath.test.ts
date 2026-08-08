import { describe, it, expect } from "vitest";
import {
  getCustomerBalanceDelta,
  getBankAccountBalanceDelta,
  applyTransactionsToCustomerBalance,
  applyTransactionsToBankAccountBalance,
} from "../balanceMath";

describe("balanceMath", () => {
  describe("getCustomerBalanceDelta", () => {
    it("charges increase the customer's debt (positive delta)", () => {
      expect(getCustomerBalanceDelta("charge", 100)).toBe(100);
    });

    it("payments reduce the customer's debt (negative delta)", () => {
      expect(getCustomerBalanceDelta("payment", 100)).toBe(-100);
    });

    it("refunds reduce the customer's debt (negative delta)", () => {
      expect(getCustomerBalanceDelta("refund", 100)).toBe(-100);
    });

    it("deposits reduce the customer's debt (negative delta)", () => {
      expect(getCustomerBalanceDelta("deposit", 100)).toBe(-100);
    });

    it("adjustments use the signed amount", () => {
      expect(getCustomerBalanceDelta("adjustment", -50)).toBe(-50);
      expect(getCustomerBalanceDelta("adjustment", 50)).toBe(50);
    });

    it("ignores case and whitespace", () => {
      expect(getCustomerBalanceDelta("  CHARGE ", 100)).toBe(100);
    });

    it("reverses the customer effect when amount is negative", () => {
      expect(getCustomerBalanceDelta("charge", -100)).toBe(-100);
      expect(getCustomerBalanceDelta("payment", -100)).toBe(100);
      expect(getCustomerBalanceDelta("refund", -100)).toBe(100);
      expect(getCustomerBalanceDelta("deposit", -100)).toBe(100);
    });

    it("falls back to signed amount for unknown types", () => {
      expect(getCustomerBalanceDelta("unknown", -25)).toBe(-25);
    });

    it("honours an explicit mathFactor", () => {
      expect(getCustomerBalanceDelta("payment", 100, 1)).toBe(100);
      expect(getCustomerBalanceDelta("charge", 100, -1)).toBe(-100);
    });
  });

  describe("getBankAccountBalanceDelta", () => {
    it("payments increase the bank account balance", () => {
      expect(getBankAccountBalanceDelta("payment", 100)).toBe(100);
    });

    it("deposits increase the bank account balance", () => {
      expect(getBankAccountBalanceDelta("deposit", 100)).toBe(100);
    });

    it("refunds decrease the bank account balance", () => {
      expect(getBankAccountBalanceDelta("refund", 100)).toBe(-100);
    });

    it("adjustments use the signed amount", () => {
      expect(getBankAccountBalanceDelta("adjustment", -30)).toBe(-30);
      expect(getBankAccountBalanceDelta("adjustment", 30)).toBe(30);
    });

    it("charges do not affect the bank account balance", () => {
      expect(getBankAccountBalanceDelta("charge", 100)).toBe(0);
    });

    it("reverses the bank cash-flow when amount is negative", () => {
      expect(getBankAccountBalanceDelta("payment", -100)).toBe(-100);
      expect(getBankAccountBalanceDelta("refund", -100)).toBe(100);
      expect(getBankAccountBalanceDelta("deposit", -100)).toBe(-100);
      expect(getBankAccountBalanceDelta("charge", -100)).toBe(0);
    });
  });

  describe("applyTransactionsToCustomerBalance", () => {
    it("produces the positive-debt convention", () => {
      const transactions = [
        { transaction_type: "charge", amount: 100 },
        { transaction_type: "payment", amount: 30 },
        { transaction_type: "refund", amount: 20 },
        { transaction_type: "deposit", amount: 15 },
        { transaction_type: "adjustment", amount: -10 },
      ] as const;
      // opening 0 + charge 100 - payment 30 - refund 20 - deposit 15 - adjustment 10 = 25
      expect(applyTransactionsToCustomerBalance(0, transactions as unknown as { transaction_type: string; amount: number }[])).toBe(25);
    });

    it("honours an optional factorMap", () => {
      const transactions = [
        { transaction_type: "custom_increase", amount: 100 },
        { transaction_type: "custom_decrease", amount: 40 },
      ] as const;
      const factorMap = { custom_increase: 1, custom_decrease: -1 };
      expect(applyTransactionsToCustomerBalance(0, transactions as unknown as { transaction_type: string; amount: number }[], factorMap)).toBe(60);
    });
  });

  describe("applyTransactionsToBankAccountBalance", () => {
    it("produces the dashboard bank account balance convention", () => {
      const transactions = [
        { transaction_type: "payment", amount: 100 },
        { transaction_type: "refund", amount: 30 },
        { transaction_type: "charge", amount: 50 },
        { transaction_type: "adjustment", amount: -10 },
      ] as const;
      // opening 0 + payment 100 - refund 30 + charge 0 - adjustment 10 = 60
      expect(applyTransactionsToBankAccountBalance(0, transactions as unknown as { transaction_type: string; amount: number }[])).toBe(60);
    });
  });
});
