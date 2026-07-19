import { describe, it, expect } from 'vitest';
import {
  validateCustomerData,
  validateTransactionData,
  validateBankAccountData,
  validateTransactionTypeData,
} from '../validation';

describe('validateCustomerData', () => {
  it('accepts valid customer data', () => {
    const result = validateCustomerData({
      customer_code: 'CUST001',
      full_name: 'Nguyen Van A',
      phone: '0901234567',
      email: 'a@example.com',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing required fields', () => {
    const result = validateCustomerData({});
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('customer_code is required and must be a non-empty string');
    expect(result.errors).toContain('full_name is required and must be a non-empty string');
  });

  it('rejects empty-string required fields (whitespace only)', () => {
    const result = validateCustomerData({ customer_code: '   ', full_name: '  ' });
    expect(result.isValid).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = validateCustomerData({
      customer_code: 'C1',
      full_name: 'Test',
      email: 'not-an-email',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('email must be a valid email address');
  });

  it('rejects invalid phone format', () => {
    const result = validateCustomerData({
      customer_code: 'C1',
      full_name: 'Test',
      phone: 'call-me-maybe',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('phone must be a valid phone number');
  });

  it('rejects non-numeric opening_balance', () => {
    const result = validateCustomerData({
      customer_code: 'C1',
      full_name: 'Test',
      opening_balance: 'a lot of money',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('opening_balance must be a valid number');
  });
});

describe('validateTransactionData', () => {
  const base = {
    transaction_code: 'TXN001',
    transaction_type: 'payment',
    amount: 1000,
    transaction_date: '2026-07-19',
  };

  it('accepts valid transaction data', () => {
    expect(validateTransactionData(base).isValid).toBe(true);
  });

  it('rejects invalid transaction_type', () => {
    const result = validateTransactionData({ ...base, transaction_type: 'bogus' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('transaction_type must be one of'))).toBe(true);
  });

  it('rejects missing amount', () => {
    const { amount, ...rest } = base;
    const result = validateTransactionData(rest);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('amount is required and must be a valid number');
  });

  it('rejects NaN amount', () => {
    const result = validateTransactionData({ ...base, amount: NaN });
    expect(result.isValid).toBe(false);
  });

  it('accepts all documented valid transaction types', () => {
    for (const type of ['payment', 'charge', 'refund', 'adjustment']) {
      expect(validateTransactionData({ ...base, transaction_type: type }).isValid).toBe(true);
    }
  });
});

describe('validateBankAccountData', () => {
  it('accepts valid bank account data', () => {
    const result = validateBankAccountData({
      account_name: 'Main Account',
      account_number: '123456789',
      bank_name: 'Vietcombank',
      balance: 500000,
    });
    expect(result.isValid).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = validateBankAccountData({});
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects non-boolean is_active', () => {
    const result = validateBankAccountData({
      account_name: 'A',
      account_number: '1',
      bank_name: 'B',
      is_active: 'yes',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('is_active must be a boolean');
  });
});

describe('validateTransactionTypeData', () => {
  it('accepts valid data', () => {
    const result = validateTransactionTypeData({
      name: 'Payment',
      impact_type: 'increase',
      math_factor: 1,
      color: '#ff0000',
    });
    expect(result.isValid).toBe(true);
  });

  it('rejects math_factor other than -1 or 1', () => {
    const result = validateTransactionTypeData({ name: 'X', math_factor: 5 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('math_factor must be either -1 or 1');
  });

  it('rejects invalid impact_type', () => {
    const result = validateTransactionTypeData({ name: 'X', impact_type: 'sideways' });
    expect(result.isValid).toBe(false);
  });
});
