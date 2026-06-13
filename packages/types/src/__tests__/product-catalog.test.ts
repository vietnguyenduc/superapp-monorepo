import { describe, it, expect } from 'vitest';
import {
  validateProductCatalogItem,
  formatPrice,
  formatProductForDisplay,
  SAMPLE_PRODUCT_CATALOG,
  PRODUCT_CATALOG_COLUMNS,
} from '../product-catalog';

describe('Product Catalog', () => {
  describe('SAMPLE_PRODUCT_CATALOG', () => {
    it('has 5 sample items', () => {
      expect(SAMPLE_PRODUCT_CATALOG).toHaveLength(5);
    });

    it('each item has required fields', () => {
      SAMPLE_PRODUCT_CATALOG.forEach((item) => {
        expect(item.productCode).toBeDefined();
        expect(item.productName).toBeDefined();
        expect(item.unit).toBeDefined();
        expect(item.price).toBeGreaterThan(0);
        expect(item.category).toBeDefined();
        expect(item.isActive).toBe(true);
      });
    });
  });

  describe('PRODUCT_CATALOG_COLUMNS', () => {
    it('has 6 columns', () => {
      expect(PRODUCT_CATALOG_COLUMNS).toHaveLength(6);
    });

    it('productCode column is required', () => {
      const col = PRODUCT_CATALOG_COLUMNS.find((c) => c.key === 'productCode');
      expect(col?.required).toBe(true);
    });

    it('notes column is optional', () => {
      const col = PRODUCT_CATALOG_COLUMNS.find((c) => c.key === 'notes');
      expect(col?.required).toBe(false);
    });
  });

  describe('validateProductCatalogItem', () => {
    it('returns errors for empty item', () => {
      const errors = validateProductCatalogItem({});
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('Mã hàng'))).toBe(true);
      expect(errors.some((e) => e.includes('Tên hàng'))).toBe(true);
    });

    it('returns no errors for valid item', () => {
      const errors = validateProductCatalogItem({
        productCode: 'CF001',
        productName: 'Cà phê Sữa',
        unit: 'Ly',
        price: 25000,
        category: 'Cà phê',
      });
      expect(errors).toHaveLength(0);
    });

    it('validates productCode min length', () => {
      const errors = validateProductCatalogItem({
        productCode: 'A',
        productName: 'Test',
        unit: 'Ly',
        price: 10000,
        category: 'Khác',
      });
      expect(errors.some((e) => e.includes('ít nhất 2 ký tự'))).toBe(true);
    });

    it('validates price cannot be negative', () => {
      const errors = validateProductCatalogItem({
        productCode: 'CF001',
        productName: 'Test',
        unit: 'Ly',
        price: -1000,
        category: 'Khác',
      });
      expect(errors.some((e) => e.includes('không được âm'))).toBe(true);
    });
  });

  describe('formatPrice', () => {
    it('formats VND price correctly', () => {
      const result = formatPrice(25000);
      expect(result).toContain('25.000');
      expect(result).toContain('₫');
    });

    it('formats zero correctly', () => {
      const result = formatPrice(0);
      expect(result).toContain('0');
    });
  });

  describe('formatProductForDisplay', () => {
    it('formats product for display', () => {
      const result = formatProductForDisplay(SAMPLE_PRODUCT_CATALOG[0]);
      expect(result).toContain('CF001');
      expect(result).toContain('Cà phê Sữa Ly');
      expect(result).toContain('₫');
    });
  });
});
