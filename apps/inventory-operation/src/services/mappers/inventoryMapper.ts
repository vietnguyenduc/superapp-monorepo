import { InventoryRecord } from '../../types';
import { parseDateOrNow } from '@superapp/shared-utils';

export class InventoryMapper {
  static mapDbToInventory(item: any): InventoryRecord {
    return {
      id: item.id,
      date: parseDateOrNow(item.date),
      productCode: item.product?.business_code || item.product_code,
      productName: item.product?.name || item.product_name,
      inputQuantity: Number(item.input_quantity || 0),
      outputQuantity: Number(item.output_quantity || 0),
      rawMaterialStock: Number(item.raw_material_stock || 0),
      rawMaterialUnit: item.raw_material_unit || item.unit,
      processedStock: Number(item.processed_stock || 0),
      processedUnit: item.processed_unit || '',
      finishedProductStock: Number(item.finished_product_stock || 0),
      finishedProductUnit: item.finished_product_unit || '',
      branch: item.branch || item.branch_id,
      createdAt: parseDateOrNow(item.created_at),
      updatedAt: parseDateOrNow(item.updated_at),
      createdBy: item.created_by,
      updatedBy: item.updated_by,
      notes: item.notes,
      sourceType: item.source_type,
      referenceId: item.reference_id,
    };
  }

  static mapInventoryToDb(record: Partial<InventoryRecord> & { productId?: string }): any {
    const row: any = {};
    
    if (record.date) row.date = record.date instanceof Date ? record.date.toISOString().split('T')[0] : record.date;
    if (record.productId) row.product_id = record.productId;
    if (record.productCode) row.product_code = record.productCode;
    if (record.productName) row.product_name = record.productName;
    if (record.inputQuantity !== undefined) row.input_quantity = record.inputQuantity;
    if (record.outputQuantity !== undefined) row.output_quantity = record.outputQuantity;
    if (record.rawMaterialStock !== undefined) row.raw_material_stock = record.rawMaterialStock;
    if (record.rawMaterialUnit !== undefined) row.raw_material_unit = record.rawMaterialUnit;
    if (record.processedStock !== undefined) row.processed_stock = record.processedStock;
    if (record.processedUnit !== undefined) row.processed_unit = record.processedUnit;
    if (record.finishedProductStock !== undefined) row.finished_product_stock = record.finishedProductStock;
    if (record.finishedProductUnit !== undefined) row.finished_product_unit = record.finishedProductUnit;
    if (record.branch) row.branch = record.branch;
    if (record.notes) row.notes = record.notes;
    if (record.sourceType) row.source_type = record.sourceType;
    if (record.referenceId) row.reference_id = record.referenceId;
    if (record.supplierId) row.supplier_id = record.supplierId;
    if (record.supplierName) row.supplier_name = record.supplierName;
    if (record.unitPrice !== undefined) row.unit_price = record.unitPrice;
    if (record.totalAmount !== undefined) row.total_amount = record.totalAmount;

    if (record.createdAt) row.created_at = record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt;
    if (record.updatedAt) row.updated_at = record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt;
    if (record.createdBy) row.created_by = record.createdBy;
    if (record.updatedBy) row.updated_by = record.updatedBy;

    return row;
  }
}