import { Product, ProductConversion } from '../types';

export interface ConversionResult {
  success: boolean;
  convertedValue: number;
  conversionPath: string[];
  error?: string;
}

export class ConversionEngine {
  /**
   * Convert quantity from one unit to another using product's conversion rates
   */
  static convert(
    product: Product,
    fromUnit: string,
    toUnit: string,
    quantity: number
  ): ConversionResult {
    // If same unit, no conversion needed
    if (fromUnit === toUnit) {
      return {
        success: true,
        convertedValue: quantity,
        conversionPath: [fromUnit],
      };
    }

    // Try direct conversion first
    const directConversion = this.findDirectConversion(product, fromUnit, toUnit);
    if (directConversion) {
      return {
        success: true,
        convertedValue: quantity * directConversion.conversionRate,
        conversionPath: [fromUnit, toUnit],
      };
    }

    // Try reverse direct conversion
    const reverseConversion = this.findDirectConversion(product, toUnit, fromUnit);
    if (reverseConversion) {
      return {
        success: true,
        convertedValue: quantity / reverseConversion.conversionRate,
        conversionPath: [fromUnit, toUnit],
      };
    }

    // Try pathfinding through conversion graph
    const pathConversion = this.findConversionPath(product, fromUnit, toUnit, quantity);
    if (pathConversion.success) {
      return pathConversion;
    }

    return {
      success: false,
      convertedValue: 0,
      conversionPath: [],
      error: `Không tìm thấy cách quy đổi từ ${fromUnit} sang ${toUnit}`,
    };
  }

  /**
   * Find direct conversion between two units
   */
  private static findDirectConversion(
    product: Product,
    fromUnit: string,
    toUnit: string
  ): ProductConversion | null {
    if (!product.conversions) return null;

    return product.conversions.find(
      conv => conv.fromUnit === fromUnit && conv.toUnit === toUnit
    ) || null;
  }

  /**
   * Find conversion path using graph traversal (BFS)
   */
  private static findConversionPath(
    product: Product,
    fromUnit: string,
    toUnit: string,
    quantity: number
  ): ConversionResult {
    if (!product.conversions || product.conversions.length === 0) {
      return {
        success: false,
        convertedValue: 0,
        conversionPath: [],
        error: 'Không có thông tin quy đổi',
      };
    }

    // Build adjacency list for graph traversal
    const graph = new Map<string, Array<{ unit: string; rate: number }>>();
    
    // Add all units to graph
    const allUnits = new Set<string>();
    allUnits.add(product.inputUnit);
    allUnits.add(product.outputUnit);
    
    product.conversions.forEach(conv => {
      allUnits.add(conv.fromUnit);
      allUnits.add(conv.toUnit);
      
      // Add forward conversion
      if (!graph.has(conv.fromUnit)) {
        graph.set(conv.fromUnit, []);
      }
      graph.get(conv.fromUnit)!.push({ unit: conv.toUnit, rate: conv.conversionRate });
      
      // Add reverse conversion
      if (!graph.has(conv.toUnit)) {
        graph.set(conv.toUnit, []);
      }
      graph.get(conv.toUnit)!.push({ unit: conv.fromUnit, rate: 1 / conv.conversionRate });
    });

    // BFS to find shortest path
    const queue: Array<{ unit: string; value: number; path: string[] }> = [
      { unit: fromUnit, value: quantity, path: [fromUnit] }
    ];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.unit === toUnit) {
        return {
          success: true,
          convertedValue: current.value,
          conversionPath: current.path,
        };
      }

      if (visited.has(current.unit)) continue;
      visited.add(current.unit);

      const neighbors = graph.get(current.unit) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.unit)) {
          queue.push({
            unit: neighbor.unit,
            value: current.value * neighbor.rate,
            path: [...current.path, neighbor.unit],
          });
        }
      }
    }

    return {
      success: false,
      convertedValue: 0,
      conversionPath: [],
      error: `Không tìm thấy đường dẫn quy đổi từ ${fromUnit} sang ${toUnit}`,
    };
  }

  /**
   * Get all possible units for a product
   */
  static getAllUnits(product: Product): string[] {
    const units = new Set<string>();
    units.add(product.inputUnit);
    units.add(product.outputUnit);
    
    if (product.conversions) {
      product.conversions.forEach(conv => {
        units.add(conv.fromUnit);
        units.add(conv.toUnit);
      });
    }
    
    return Array.from(units);
  }

  /**
   * Validate conversion rates for consistency
   */
  static validateConversions(product: Product): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!product.conversions || product.conversions.length === 0) {
      return { isValid: true, errors: [] };
    }

    const graph = new Map<string, Array<{ unit: string; rate: number }>>();
    for (const conversion of product.conversions) {
      if (!conversion.fromUnit || !conversion.toUnit || conversion.fromUnit === conversion.toUnit) errors.push('Đơn vị nguồn và đích phải khác nhau');
      if (!Number.isFinite(conversion.conversionRate) || conversion.conversionRate <= 0) errors.push('Tỷ lệ quy đổi phải lớn hơn 0');
      if (errors.length) continue;
      if (!graph.has(conversion.fromUnit)) graph.set(conversion.fromUnit, []);
      if (!graph.has(conversion.toUnit)) graph.set(conversion.toUnit, []);
      graph.get(conversion.fromUnit)!.push({ unit: conversion.toUnit, rate: conversion.conversionRate });
      graph.get(conversion.toUnit)!.push({ unit: conversion.fromUnit, rate: 1 / conversion.conversionRate });
    }
    const factors = new Map<string, number>();
    for (const start of graph.keys()) {
      if (factors.has(start)) continue;
      factors.set(start, 1);
      const queue = [start];
      while (queue.length) {
        const current = queue.shift()!;
        for (const edge of graph.get(current) || []) {
          const implied = factors.get(current)! * edge.rate;
          const known = factors.get(edge.unit);
          if (known === undefined) { factors.set(edge.unit, implied); queue.push(edge.unit); }
          else if (Math.abs(known - implied) > Math.max(0.001, Math.abs(known) * 0.001)) {
            errors.push(`Quy đổi không nhất quán tại ${current} → ${edge.unit}`);
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Get conversion summary for display
   */
  static getConversionSummary(product: Product): string[] {
    const units = this.getAllUnits(product);
    const summary: string[] = [];
    
    for (let i = 0; i < units.length; i++) {
      for (let j = i + 1; j < units.length; j++) {
        const unit1 = units[i];
        const unit2 = units[j];
        
        const conversion = this.convert(product, unit1, unit2, 1);
        if (conversion.success) {
          summary.push(`1 ${unit1} = ${conversion.convertedValue} ${unit2}`);
        }
      }
    }
    
    return summary;
  }
}
