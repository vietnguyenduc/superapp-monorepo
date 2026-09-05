import { Product, ProductStatus } from '../../types';

export class ProductMapper {
  static mapDbToProduct(item: any): Product {
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      businessCode: item.business_code,
      promotionCode: item.promotion_code,
      isFinishedProduct: item.is_finished_product,
      outputQuantity: item.output_quantity,
      inputQuantity: item.input_quantity,
      finishedProductCode: item.finished_product_code,
      inputUnit: item.input_unit,
      outputUnit: item.output_unit,
      status: item.status,
      businessStatus: item.business_status,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      createdBy: item.created_by,
      updatedBy: item.updated_by,
      
      // Logic properties
      allowedForms: item.allowed_forms || [],
      canBePurchased: item.can_be_purchased ?? true,
      canBeSold: item.can_be_sold ?? item.is_finished_product,
      rawToProcessedRatio: Number(item.raw_to_processed_ratio || 1),
      processedToFinishedRatio: Number(item.processed_to_finished_ratio || 1),
      recipe: item.recipe || [],
      linkedFinishedProductCodes: item.linked_finished_product_codes || [],
      intermediateUnits: item.intermediate_units || [],
      conversions: item.conversions || []
    };
  }

  static mapProductToDb(product: Partial<Product>): any {
    const row: any = {};
    
    if (product.name !== undefined) row.name = product.name;
    if (product.category !== undefined) row.category = product.category;
    if (product.businessCode !== undefined) row.business_code = product.businessCode || null;
    if (product.promotionCode !== undefined) row.promotion_code = product.promotionCode;
    if (product.isFinishedProduct !== undefined) row.is_finished_product = product.isFinishedProduct;
    if (product.outputQuantity !== undefined) row.output_quantity = product.outputQuantity;
    if (product.inputQuantity !== undefined) row.input_quantity = product.inputQuantity;
    if (product.finishedProductCode !== undefined) row.finished_product_code = product.finishedProductCode;
    if (product.inputUnit !== undefined) row.input_unit = product.inputUnit;
    if (product.outputUnit !== undefined) row.output_unit = product.outputUnit;
    if (product.status !== undefined) row.status = product.status;
    if (product.businessStatus !== undefined) row.business_status = product.businessStatus;
    
    // Logic properties
    if (product.allowedForms !== undefined) row.allowed_forms = product.allowedForms;
    if (product.canBePurchased !== undefined) row.can_be_purchased = product.canBePurchased;
    if (product.canBeSold !== undefined) row.can_be_sold = product.canBeSold;
    if (product.rawToProcessedRatio !== undefined) row.raw_to_processed_ratio = product.rawToProcessedRatio;
    if (product.processedToFinishedRatio !== undefined) row.processed_to_finished_ratio = product.processedToFinishedRatio;
    if (product.recipe !== undefined) row.recipe = product.recipe;
    if (product.linkedFinishedProductCodes !== undefined) row.linked_finished_product_codes = product.linkedFinishedProductCodes;
    if (product.intermediateUnits !== undefined) row.intermediate_units = product.intermediateUnits;
    if (product.conversions !== undefined) row.conversions = product.conversions;

    if (product.createdAt) row.created_at = product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt;
    if (product.updatedAt) row.updated_at = product.updatedAt instanceof Date ? product.updatedAt.toISOString() : product.updatedAt;
    if (product.createdBy) row.created_by = product.createdBy;
    if (product.updatedBy) row.updated_by = product.updatedBy;

    return row;
  }
}
