import { describe, it, expect } from 'vitest';
import {
  trimWhitespaceRule,
  normalizeDatesRule,
  validateQuantitiesRule,
  removeDuplicatesRule,
  applyRules,
} from '../cleaning';

describe('Data Cleaning', () => {
  it('should trim whitespace from strings', () => {
    const data = { name: '  Test  ', code: ' ABC ' };
    const result = trimWhitespaceRule.apply(data);
    
    expect(result.name).toBe('Test');
    expect(result.code).toBe('ABC');
  });

  it('should normalize dates to ISO format', () => {
    const data = { date: '2024-03-16' };
    const result = normalizeDatesRule.apply(data);
    
    expect(result.date).toBeDefined();
  });

  it('should validate and fix negative quantities', () => {
    const data = { quantity: -5, amount: 100 };
    const result = validateQuantitiesRule.apply(data);
    
    expect(result.quantity).toBe(0);
    expect(result.amount).toBe(100);
  });

  it('should remove duplicates by key field', () => {
    const data = [
      { id: '1', name: 'Test' },
      { id: '1', name: 'Duplicate' },
      { id: '2', name: 'Another' },
    ];
    const rule = removeDuplicatesRule('id');
    const result = rule.apply(data);
    
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });

  it('should apply multiple rules to data', () => {
    const data = { name: '  Test  ', quantity: -5 };
    const rules = [trimWhitespaceRule, validateQuantitiesRule];
    const result = applyRules(data, rules);
    
    expect(result.data.name).toBe('Test');
    expect(result.data.quantity).toBe(0);
  });
});
