import { describe, it, expect } from 'vitest';
import {
  normalizeTransactionType,
  parseAmount,
  calculateCustomerBalance,
  calculateTransactionTypeBreakdown,
  calculateOutstandingBalance,
} from '../calculations';

describe('normalizeTransactionType', () => {
  it('normalizes known types regardless of case/whitespace', () => {
    expect(normalizeTransactionType('Payment')).toBe('payment');
    expect(normalizeTransactionType('  CHARGE ')).toBe('charge');
    expect(normalizeTransactionType('Refund')).toBe('refund');
    expect(normalizeTransactionType('adjustment')).toBe('adjustment');
  });

  it('passes through unknown types unchanged', () => {
    expect(normalizeTransactionType('weird_type')).toBe('weird_type');
  });
});

describe('parseAmount', () => {
  it('parses plain numbers', () => {
    expect(parseAmount(1000)).toBe(1000);
  });

  it('parses numeric strings with thousands separators/spaces', () => {
    expect(parseAmount('1,000,000')).toBe(1000000);
    expect(parseAmount('1 000 000')).toBe(1000000);
  });

  it('returns 0 for null/undefined/invalid input', () => {
    expect(parseAmount(null)).toBe(0);
    expect(parseAmount(undefined)).toBe(0);
    expect(parseAmount('not-a-number')).toBe(0);
  });
});

describe('calculateCustomerBalance', () => {
  const customer = { id: 'cust-1', opening_balance: 100000 };

  it('reduces balance on payment', () => {
    const transactions = [{ customer_id: 'cust-1', transaction_type: 'payment', amount: 50000 }];
    expect(calculateCustomerBalance(customer, transactions)).toBe(50000);
  });

  it('increases balance on charge', () => {
    const transactions = [{ customer_id: 'cust-1', transaction_type: 'charge', amount: 20000 }];
    expect(calculateCustomerBalance(customer, transactions)).toBe(120000);
  });

  it('reduces balance on refund', () => {
    const transactions = [{ customer_id: 'cust-1', transaction_type: 'refund', amount: 10000 }];
    expect(calculateCustomerBalance(customer, transactions)).toBe(90000);
  });

  it('keeps sign on adjustment', () => {
    const transactions = [{ customer_id: 'cust-1', transaction_type: 'adjustment', amount: -5000 }];
    expect(calculateCustomerBalance(customer, transactions)).toBe(95000);
  });

  it('ignores transactions belonging to other customers', () => {
    const transactions = [{ customer_id: 'other-customer', transaction_type: 'charge', amount: 999999 }];
    expect(calculateCustomerBalance(customer, transactions)).toBe(100000);
  });

  it('handles multiple mixed transactions correctly', () => {
    const transactions = [
      { customer_id: 'cust-1', transaction_type: 'charge', amount: 50000 },
      { customer_id: 'cust-1', transaction_type: 'payment', amount: 30000 },
      { customer_id: 'cust-1', transaction_type: 'refund', amount: 10000 },
    ];
    // 100000 + 50000 - 30000 - 10000 = 110000
    expect(calculateCustomerBalance(customer, transactions)).toBe(110000);
  });

  it('defaults opening_balance to 0 when missing', () => {
    const noOpeningCustomer = { id: 'cust-2' };
    const transactions = [{ customer_id: 'cust-2', transaction_type: 'charge', amount: 1000 }];
    expect(calculateCustomerBalance(noOpeningCustomer, transactions)).toBe(1000);
  });
});

describe('calculateTransactionTypeBreakdown', () => {
  it('aggregates count and total per type', () => {
    const transactions = [
      { transaction_type: 'payment', amount: 100 },
      { transaction_type: 'payment', amount: 200 },
      { transaction_type: 'charge', amount: 50 },
    ];
    const result = calculateTransactionTypeBreakdown(transactions);
    expect(result.payment).toEqual({ count: 2, total: 300 });
    expect(result.charge).toEqual({ count: 1, total: 50 });
    expect(result.refund).toEqual({ count: 0, total: 0 });
    expect(result.adjustment).toEqual({ count: 0, total: 0 });
  });

  it('uses absolute value of amounts', () => {
    const transactions = [{ transaction_type: 'adjustment', amount: -500 }];
    const result = calculateTransactionTypeBreakdown(transactions);
    expect(result.adjustment.total).toBe(500);
  });

  it('returns all-zero breakdown for empty input', () => {
    const result = calculateTransactionTypeBreakdown([]);
    expect(result.payment.count).toBe(0);
    expect(result.charge.count).toBe(0);
  });
});

describe('calculateOutstandingBalance', () => {
  it('sums balances across multiple customers', () => {
    const customers = [
      { id: 'a', opening_balance: 1000 },
      { id: 'b', opening_balance: 2000 },
    ];
    const transactions = [
      { customer_id: 'a', transaction_type: 'charge', amount: 500 },
      { customer_id: 'b', transaction_type: 'payment', amount: 200 },
    ];
    // a: 1000+500=1500, b: 2000-200=1800 => total 3300
    expect(calculateOutstandingBalance(customers, transactions)).toBe(3300);
  });

  it('returns 0 for no customers', () => {
    expect(calculateOutstandingBalance([], [])).toBe(0);
  });
});
