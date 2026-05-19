// Data Cleaning Utilities for Inventory Operation
// Using shared utilities from @superapp/shared-utils

import type { Product } from '../types';
import type { InventoryMovement, StockCountEntry } from '../types/InventoryMovement';
import {
  CleaningRule as SharedCleaningRule,
  CleaningResult as SharedCleaningResult,
  trimWhitespaceRule,
  normalizeDatesRule,
  validateQuantitiesRule,
  applyRules,
} from "@superapp/shared-utils";

// Re-export shared types for backward compatibility
export type CleaningRule = SharedCleaningRule;
export type CleaningResult = SharedCleaningResult;

/**
 * Clean products using shared utilities + inventory-specific rules
 */
export function cleanProducts(products: Product[]): CleaningResult {
  const rules: CleaningRule[] = [
    trimWhitespaceRule,
    validateQuantitiesRule,
    // Add inventory-specific rules
    {
      name: 'Normalize category',
      description: 'Normalize category names to standard format',
      apply: (data: any) => {
        if (Array.isArray(data)) {
          const categoryMap: Record<string, string> = {
            'nguyên vật liệu': 'raw_material',
            'nvl': 'raw_material',
            'sơ chế': 'processed',
            'thành phẩm': 'finished_product',
            'tp': 'finished_product',
          };

          return data.map((product: Product) => {
            const normalizedCategory = categoryMap[product.category?.toLowerCase() || ''] || product.category;
            return { ...product, category: normalizedCategory as any };
          });
        }
        return data;
      },
    },
    {
      name: 'Remove invalid products',
      description: 'Remove products without name or business code',
      apply: (data: any) => {
        if (Array.isArray(data)) {
          return data.filter((product: Product) => {
            const hasName = product.name && product.name.trim().length > 0;
            const hasCode = product.businessCode && product.businessCode.trim().length > 0;
            return hasName || hasCode;
          });
        }
        return data;
      },
    },
  ];

  return applyRules(products, rules);
}

/**
 * Clean movements using shared utilities
 */
export function cleanMovements(movements: InventoryMovement[]): CleaningResult {
  const rules: CleaningRule[] = [
    trimWhitespaceRule,
    validateQuantitiesRule,
    normalizeDatesRule,
  ];

  return applyRules(movements, rules);
}

/**
 * Clean stock count entries using shared utilities
 */
export function cleanStockCountEntries(entries: StockCountEntry[]): CleaningResult {
  const rules: CleaningRule[] = [
    trimWhitespaceRule,
    validateQuantitiesRule,
  ];

  return applyRules(entries, rules);
}

/**
 * Validate data quality
 */
export function validateDataQuality(data: any[], dataType: 'products' | 'movements' | 'stockCounts'): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  if (data.length === 0) {
    issues.push('No data to validate');
    return { score: 0, issues, recommendations };
  }

  // Check for missing required fields
  if (dataType === 'products') {
    const missingNames = data.filter((p: Product) => !p.name || p.name.trim() === '').length;
    const missingCodes = data.filter((p: Product) => !p.businessCode || p.businessCode.trim() === '').length;
    
    if (missingNames > 0) {
      issues.push(`${missingNames} products missing name`);
      score -= missingNames * 10;
      recommendations.push('Add names to all products');
    }
    
    if (missingCodes > 0) {
      issues.push(`${missingCodes} products missing business code`);
      score -= missingCodes * 5;
      recommendations.push('Add business codes to all products');
    }

    // Check for duplicate codes
    const codes = data.map((p: Product) => p.businessCode);
    const uniqueCodes = new Set(codes);
    if (codes.length !== uniqueCodes.size) {
      issues.push(`${codes.length - uniqueCodes.size} duplicate business codes`);
      score -= (codes.length - uniqueCodes.size) * 15;
      recommendations.push('Remove or fix duplicate business codes');
    }
  }

  if (dataType === 'movements') {
    const invalidQuantities = data.filter((m: InventoryMovement) => Number(m.quantity) < 0).length;
    const invalidDates = data.filter((m: InventoryMovement) => isNaN(new Date(m.movementDate).getTime())).length;
    
    if (invalidQuantities > 0) {
      issues.push(`${invalidQuantities} movements with negative quantities`);
      score -= invalidQuantities * 10;
      recommendations.push('Fix negative quantities');
    }
    
    if (invalidDates > 0) {
      issues.push(`${invalidDates} movements with invalid dates`);
      score -= invalidDates * 10;
      recommendations.push('Fix invalid dates');
    }
  }

  if (dataType === 'stockCounts') {
    const invalidCounts = data.filter((e: StockCountEntry) => Number(e.countedQuantity) < 0).length;
    const invalidExpected = data.filter((e: StockCountEntry) => Number(e.expectedQuantity) < 0).length;
    
    if (invalidCounts > 0) {
      issues.push(`${invalidCounts} entries with negative counted quantities`);
      score -= invalidCounts * 10;
      recommendations.push('Fix negative counted quantities');
    }
    
    if (invalidExpected > 0) {
      issues.push(`${invalidExpected} entries with negative expected quantities`);
      score -= invalidExpected * 10;
      recommendations.push('Fix negative expected quantities');
    }
  }

  score = Math.max(0, score);

  return { score, issues, recommendations };
}
