import { describe, it, expect } from 'vitest';
import {
  validateProduct,
  validateInventoryRecord,
  validateBulkImport,
  checkImportLimit,
  validators,
  MAX_IMPORT_ROWS,
} from './validation';
import { ProductCategory } from '../types';

describe('validateProduct', () => {
  it('validates required fields', () => {
    const result = validateProduct({});
    expect(result.valid).toBe(false);
    expect(result.errors.map(e => e.field)).toContain('businessCode');
    expect(result.errors.map(e => e.field)).toContain('name');
    expect(result.errors.map(e => e.field)).toContain('category');
    expect(result.errors.map(e => e.field)).toContain('inputUnit');
    expect(result.errors.map(e => e.field)).toContain('outputUnit');
  });

  it('passes with valid product', () => {
    const result = validateProduct({
      businessCode: 'SP001',
      name: 'Test Product',
      category: ProductCategory.FRUIT,
      inputQuantity: 10,
      inputUnit: 'kg',
      outputUnit: 'kg',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects duplicate businessCode', () => {
    const existing = [
      { id: '1', businessCode: 'SP001', name: 'Existing', category: ProductCategory.FRUIT, inputUnit: 'kg', outputUnit: 'kg' },
    ];
    const result = validateProduct({ businessCode: 'SP001', name: 'New', category: ProductCategory.FRUIT, inputUnit: 'kg', outputUnit: 'kg' }, existing as any);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('đã tồn tại'))).toBe(true);
  });

  it('allows duplicate businessCode for same product (update)', () => {
    const existing = [
      { id: '1', businessCode: 'SP001', name: 'Existing', category: ProductCategory.FRUIT, inputUnit: 'kg', outputUnit: 'kg' },
    ];
    const result = validateProduct({ id: '1', businessCode: 'SP001', name: 'Updated', category: ProductCategory.FRUIT, inputUnit: 'kg', outputUnit: 'kg' }, existing as any);
    expect(result.valid).toBe(true);
  });

  it('rejects invalid category', () => {
    const result = validateProduct({ businessCode: 'SP002', name: 'X', category: 'invalid' as any, inputUnit: 'kg', outputUnit: 'kg' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'category')).toBe(true);
  });

  it('rejects negative inputQuantity', () => {
    const result = validateProduct({ businessCode: 'SP003', name: 'X', category: ProductCategory.FRUIT, inputQuantity: -1, inputUnit: 'kg', outputUnit: 'kg' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'inputQuantity')).toBe(true);
  });

  it('rejects empty businessCode', () => {
    const result = validateProduct({ businessCode: '   ', name: 'X', category: ProductCategory.FRUIT, inputUnit: 'kg', outputUnit: 'kg' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'businessCode' && e.message.includes('trống'))).toBe(true);
  });

  it('rejects name longer than 200 chars', () => {
    const result = validateProduct({ businessCode: 'SP004', name: 'x'.repeat(201), category: ProductCategory.FRUIT, inputUnit: 'kg', outputUnit: 'kg' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'name' && e.message.includes('200'))).toBe(true);
  });
});

describe('validateInventoryRecord', () => {
  it('validates required fields', () => {
    const result = validateInventoryRecord({});
    expect(result.valid).toBe(false);
    expect(result.errors.map(e => e.field)).toContain('productCode');
    expect(result.errors.map(e => e.field)).toContain('productName');
  });

  it('passes with valid record', () => {
    const result = validateInventoryRecord({
      productCode: 'SP001',
      productName: 'Product',
      rawMaterialStock: 10,
      processedStock: 5,
      finishedProductStock: 2,
    });
    expect(result.valid).toBe(true);
  });

  it('rejects negative stock values', () => {
    const result = validateInventoryRecord({
      productCode: 'SP001',
      productName: 'Product',
      rawMaterialStock: -1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'rawMaterialStock')).toBe(true);
  });

  it('allows zero stock', () => {
    const result = validateInventoryRecord({
      productCode: 'SP001',
      productName: 'Product',
      rawMaterialStock: 0,
      processedStock: 0,
      finishedProductStock: 0,
    });
    expect(result.valid).toBe(true);
  });
});

describe('validateBulkImport', () => {
  it('validates all required columns present', () => {
    const rows = [{ businessCode: 'SP001', name: 'A', category: 'NVL' }];
    const result = validateBulkImport(rows, ['businessCode', 'name', 'category']);
    expect(result.valid).toBe(true);
    expect(result.validRows).toBe(1);
  });

  it('detects missing required columns', () => {
    const rows = [{ businessCode: 'SP001' }];
    const result = validateBulkImport(rows, ['businessCode', 'name', 'category']);
    expect(result.valid).toBe(false);
    expect(result.errorCount).toBe(2);
    expect(result.rows[0].errors.length).toBe(2);
  });

  it('runs custom validators', () => {
    const rows = [{ businessCode: 'SP001', name: 'A', qty: 'abc' }];
    const result = validateBulkImport(rows, ['businessCode', 'name', 'qty'], {
      qty: validators.positiveNumber,
    });
    expect(result.valid).toBe(false);
    expect(result.rows[0].errors.some(e => e.includes('Phải là số'))).toBe(true);
  });

  it('reports per-row errors', () => {
    const rows = [
      { businessCode: 'SP001', name: 'A', category: 'NVL' },
      { businessCode: '', name: '', category: '' },
    ];
    const result = validateBulkImport(rows, ['businessCode', 'name', 'category']);
    expect(result.totalRows).toBe(2);
    expect(result.validRows).toBe(1);
    expect(result.rows[1].errors.length).toBe(3);
  });
});

describe('checkImportLimit', () => {
  it('allows within limit', () => {
    const result = checkImportLimit(100);
    expect(result.allowed).toBe(true);
  });

  it('rejects over limit', () => {
    const result = checkImportLimit(MAX_IMPORT_ROWS + 1);
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('200');
  });

  it('rejects zero rows', () => {
    const result = checkImportLimit(0);
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('Không tìm thấy');
  });
});

describe('validators', () => {
  it('positiveNumber rejects non-positive', () => {
    expect(validators.positiveNumber(0)).toContain('lớn hơn 0');
    expect(validators.positiveNumber(-1)).toContain('lớn hơn 0');
    expect(validators.positiveNumber('abc')).toContain('Phải là số');
    expect(validators.positiveNumber(5)).toBeNull();
  });

  it('nonNegativeNumber rejects negative', () => {
    expect(validators.nonNegativeNumber(-1)).toContain('âm');
    expect(validators.nonNegativeNumber(0)).toBeNull();
    expect(validators.nonNegativeNumber(5)).toBeNull();
  });

  it('integer rejects decimals', () => {
    expect(validators.integer(1.5)).toContain('số nguyên');
    expect(validators.integer(5)).toBeNull();
  });

  it('maxLength rejects long strings', () => {
    const check = validators.maxLength(5);
    expect(check('123456')).toContain('5');
    expect(check('12345')).toBeNull();
  });

  it('date validates correctly', () => {
    expect(validators.date('2024-01-01')).toBeNull();
    expect(validators.date('invalid')).toContain('hợp lệ');
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(validators.date(future.toISOString())).toContain('tương lai');
  });

  it('email validates format', () => {
    expect(validators.email('test@example.com')).toBeNull();
    expect(validators.email('invalid')).toContain('hợp lệ');
    expect(validators.email(null)).toBeNull();
  });

  it('phone validates length', () => {
    expect(validators.phone('0912345678')).toBeNull();
    expect(validators.phone('123')).toContain('10-11');
    expect(validators.phone('0912 345 678')).toBeNull();
  });

  it('oneOf validates options', () => {
    const check = validators.oneOf(['a', 'b']);
    expect(check('a')).toBeNull();
    expect(check('c')).toContain('a, b');
  });
});
