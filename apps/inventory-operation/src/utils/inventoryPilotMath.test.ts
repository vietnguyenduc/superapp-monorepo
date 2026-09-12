import { describe, expect, it } from 'vitest';
import { calculateDaysOnHand, calculateMovementStock, isSignificantVariance } from './inventoryPilotMath';

describe('inventory pilot math', () => {
  it('keeps negative stock visible', () => {
    expect(calculateMovementStock([{ inputQuantity: 50 }, { outputQuantity: 80 }])).toBe(-30);
  });

  it('uses output movements instead of inferring output from snapshots', () => {
    expect(calculateMovementStock([{ inputQuantity: 100, outputQuantity: 25 }])).toBe(75);
  });

  it('does not invent days on hand when there is no sales history', () => {
    expect(calculateDaysOnHand(100, 0)).toBeNull();
  });

  it('applies the five-percent threshold in percentage points', () => {
    expect(isSignificantVariance(4.9)).toBe(false);
    expect(isSignificantVariance(5)).toBe(false);
    expect(isSignificantVariance(5.1)).toBe(true);
  });
});
