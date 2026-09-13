import type { InventoryRecord } from '../types';

export interface ProductLedgerBalance {
  key: string;
  productId?: string;
  productCode: string;
  productName: string;
  unit: string;
  inbound: number;
  outbound: number;
  quantity: number;
}

const quantity = (value: unknown) => Number(value) || 0;
const recordKey = (record: InventoryRecord) => record.productId || record.productCode;

export function buildProductLedgerBalances(records: InventoryRecord[], asOf = new Date()): ProductLedgerBalance[] {
  const balances = new Map<string, ProductLedgerBalance>();
  for (const record of records) {
    if (record.status === 'cancelled' || new Date(record.date).getTime() > asOf.getTime()) continue;
    const key = recordKey(record);
    const unit = record.rawMaterialUnit || record.finishedProductUnit || 'chưa rõ ĐVT';
    const existing = balances.get(key) || {
      key,
      productId: record.productId,
      productCode: record.productCode,
      productName: record.productName,
      unit,
      inbound: 0,
      outbound: 0,
      quantity: 0,
    };
    if (existing.unit !== unit) throw new Error(`Sản phẩm ${record.productCode} có giao dịch lẫn đơn vị ${existing.unit} và ${unit}`);
    existing.inbound += quantity(record.inputQuantity);
    existing.outbound += quantity(record.outputQuantity);
    existing.quantity = existing.inbound - existing.outbound;
    balances.set(key, existing);
  }
  return Array.from(balances.values());
}

export function reconcileLedger(records: InventoryRecord[], from: Date, to: Date) {
  let opening = 0;
  let inbound = 0;
  let outbound = 0;
  for (const record of records) {
    if (record.status === 'cancelled') continue;
    const date = new Date(record.date).getTime();
    if (date < from.getTime()) opening += quantity(record.inputQuantity) - quantity(record.outputQuantity);
    else if (date <= to.getTime()) {
      inbound += quantity(record.inputQuantity);
      outbound += quantity(record.outputQuantity);
    }
  }
  return { opening, inbound, outbound, closing: opening + inbound - outbound };
}

export function calculateDailyOutput(records: InventoryRecord[], days: number, now = new Date()): number {
  const end = now.getTime();
  const start = end - days * 86_400_000;
  const output = records.reduce((sum, record) => {
    if (record.status === 'cancelled') return sum;
    const date = new Date(record.date).getTime();
    return date >= start && date <= end ? sum + quantity(record.outputQuantity) : sum;
  }, 0);
  return output / days;
}
