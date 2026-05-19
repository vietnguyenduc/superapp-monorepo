import { SalesRecord } from '../../types';

export class SalesMapper {
  static mapDbToSales(item: any): SalesRecord {
    return {
      id: item.id,
      date: item.date,
      productId: item.product_id,
      productCode: item.product?.business_code || item.product_code,
      productName: item.product?.name || item.product_name,
      salesQuantity: Number(item.sales_quantity || 0),
      promotionQuantity: Number(item.promotion_quantity || 0),
      customerId: item.customer_id,
      customerName: item.customer?.full_name || item.customer_name,
      totalAmount: Number(item.total_amount || 0),
      notes: item.notes,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      createdBy: item.created_by,
      updatedBy: item.updated_by
    };
  }

  static mapSalesToDb(record: Partial<SalesRecord>): any {
    const row: any = {};
    if (record.date) row.date = record.date;
    if (record.productId) row.product_id = record.productId;
    if (record.productCode) row.product_code = record.productCode;
    if (record.productName) row.product_name = record.productName;
    if (record.salesQuantity !== undefined) row.sales_quantity = record.salesQuantity;
    if (record.promotionQuantity !== undefined) row.promotion_quantity = record.promotionQuantity;
    if (record.customerId) row.customer_id = record.customerId;
    if (record.totalAmount !== undefined) row.total_amount = record.totalAmount;
    if (record.notes !== undefined) row.notes = record.notes;
    
    if (record.createdAt) row.created_at = record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt;
    if (record.updatedAt) row.updated_at = record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt;
    if (record.createdBy) row.created_by = record.createdBy;
    if (record.updatedBy) row.updated_by = record.updatedBy;

    return row;
  }
}
