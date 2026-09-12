import type { InventoryRecord } from '../types';

export interface InventoryTransactionReportRow {
  id: string;
  date: string;
  productCode: string;
  productName: string;
  beginning_inventory: number;
  inbound_quantity: number;
  sales_quantity: number;
  promotion_quantity: number;
  special_outbound_quantity: number;
  book_inventory: number;
  actual_inventory: number;
  variance: number;
  unit?: string;
  notes: string;
  created_at?: string;
}

export function buildInventoryTransactionReport(records: InventoryRecord[]): InventoryTransactionReportRow[] {
  const balances = new Map<string, number>();
  const ordered = [...records].sort((a, b) => {
    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  });

  return ordered.map((record) => {
    const key = record.productId || record.productCode;
    const beginning = balances.get(key) || 0;
    const inbound = Number(record.inputQuantity) || 0;
    const outbound = Number(record.outputQuantity) || 0;
    const closing = beginning + inbound - outbound;
    balances.set(key, closing);

    return {
      id: record.id,
      date: record.date instanceof Date ? record.date.toISOString().split('T')[0] : String(record.date),
      productCode: record.productCode,
      productName: record.productName,
      beginning_inventory: beginning,
      inbound_quantity: inbound,
      sales_quantity: outbound,
      promotion_quantity: 0,
      special_outbound_quantity: 0,
      book_inventory: closing,
      actual_inventory: closing,
      variance: 0,
      unit: record.rawMaterialUnit || record.finishedProductUnit,
      notes: record.notes || '',
      created_at: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
    };
  }).reverse();
}

export function summarizeReportByUnit(rows: InventoryTransactionReportRow[], field: 'inbound_quantity'|'sales_quantity'|'book_inventory'): Array<{unit:string;quantity:number}> {
  const totals=new Map<string,number>();
  for(const row of rows){const unit=row.unit?.trim()||'chưa rõ ĐVT';totals.set(unit,(totals.get(unit)||0)+Number(row[field]||0));}
  return Array.from(totals,([unit,quantity])=>({unit,quantity})).filter(item=>item.quantity!==0).sort((a,b)=>a.unit.localeCompare(b.unit,'vi'));
}
