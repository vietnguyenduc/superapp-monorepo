import { describe, expect, it } from 'vitest';
import { ConversionEngine } from './conversionLogic';

const product = { inputUnit: 'kg', outputUnit: 'gói', conversions: [
  { productId: 'p1', fromUnit: 'kg', toUnit: 'gram', conversionRate: 1000 },
  { productId: 'p1', fromUnit: 'gram', toUnit: 'gói', conversionRate: 0.1 },
] } as any;

describe('ConversionEngine', () => {
  it('converts across a multi-step unit path', () => {
    expect(ConversionEngine.convert(product, 'kg', 'gói', 2)).toMatchObject({ success: true, convertedValue: 200 });
  });
  it('returns a clear failure for an unknown unit without recursion', () => {
    expect(ConversionEngine.convert(product, 'thùng', 'kg', 1)).toMatchObject({ success: false, convertedValue: 0 });
  });
  it('rejects inconsistent conversion definitions', () => {
    const invalid = { ...product, conversions: [...product.conversions, { productId: 'p1', fromUnit: 'gói', toUnit: 'kg', conversionRate: 2 }] };
    expect(ConversionEngine.validateConversions(invalid).isValid).toBe(false);
  });
});
