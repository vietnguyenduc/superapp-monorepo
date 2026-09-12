import { describe, expect, it } from 'vitest';
import { buildInventoryTransactionReport, summarizeReportByUnit } from './inventoryReport';

describe('buildInventoryTransactionReport', () => {
  it('carries bulk inbound and outbound into opening and closing stock', () => {
    const rows = buildInventoryTransactionReport([
      { id: 'in', date: new Date('2026-09-10'), productId: 'p1', productCode: 'SP01', productName: 'Sản phẩm 1', inputQuantity: 10, outputQuantity: 0, createdAt: new Date('2026-09-10T01:00:00Z') },
      { id: 'out', date: new Date('2026-09-11'), productId: 'p1', productCode: 'SP01', productName: 'Sản phẩm 1', inputQuantity: 0, outputQuantity: 3, createdAt: new Date('2026-09-11T01:00:00Z') },
    ] as any);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: 'out', beginning_inventory: 10, inbound_quantity: 0, sales_quantity: 3, book_inventory: 7 });
    expect(rows[1]).toMatchObject({ id: 'in', beginning_inventory: 0, inbound_quantity: 10, sales_quantity: 0, book_inventory: 10 });
  });

  it('keeps report totals separate by unit', () => {
    const totals=summarizeReportByUnit([
      { unit:'kg',inbound_quantity:10,sales_quantity:0,book_inventory:10 },
      { unit:'cái',inbound_quantity:3,sales_quantity:0,book_inventory:3 },
    ] as any,'inbound_quantity');
    expect(totals).toEqual([{unit:'cái',quantity:3},{unit:'kg',quantity:10}]);
  });

  it('keeps balances separate for each product', () => {
    const rows = buildInventoryTransactionReport([
      { id: 'a', date: new Date('2026-09-10'), productId: 'a', productCode: 'A', productName: 'A', inputQuantity: 5 },
      { id: 'b', date: new Date('2026-09-10'), productId: 'b', productCode: 'B', productName: 'B', inputQuantity: 9 },
    ] as any);
    expect(rows.find((row) => row.id === 'a')?.book_inventory).toBe(5);
    expect(rows.find((row) => row.id === 'b')?.book_inventory).toBe(9);
  });
});
