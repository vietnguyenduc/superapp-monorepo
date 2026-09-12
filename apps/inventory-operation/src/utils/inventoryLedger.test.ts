import { describe, expect, it } from 'vitest';
import { buildProductLedgerBalances, calculateDailyOutput, reconcileLedger } from './inventoryLedger';

const records = [
  { id:'1',productId:'p1',productCode:'A',productName:'A',date:new Date('2026-09-01'),inputQuantity:10,outputQuantity:0,rawMaterialUnit:'kg' },
  { id:'2',productId:'p1',productCode:'A',productName:'A',date:new Date('2026-09-10'),inputQuantity:0,outputQuantity:3,rawMaterialUnit:'kg',sourceType:'stock_count_adjustment' },
] as any;

describe('inventory ledger reconciliation', () => {
  it('keeps the accounting identity including adjustments', () => {
    expect(reconcileLedger(records,new Date('2026-09-05'),new Date('2026-09-30'))).toEqual({opening:10,inbound:0,outbound:3,closing:7});
  });

  it('builds current stock from every movement instead of the latest row', () => {
    expect(buildProductLedgerBalances(records)[0]).toMatchObject({inbound:10,outbound:3,quantity:7,unit:'kg'});
  });

  it('rejects mixed units for one product', () => {
    expect(()=>buildProductLedgerBalances([...records,{...records[0],id:'3',rawMaterialUnit:'thùng'}])).toThrow(/lẫn đơn vị/);
  });

  it('keeps slow-moving demand and ignores future records', () => {
    const demand=[
      {date:new Date('2026-09-10'),outputQuantity:1},
      {date:new Date('2026-09-13'),outputQuantity:99},
    ] as any;
    expect(calculateDailyOutput(demand,30,new Date('2026-09-12'))).toBeCloseTo(1/30);
  });
});
