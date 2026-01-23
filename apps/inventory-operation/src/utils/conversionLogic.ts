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

    // Try multi-step conversion using base unit as intermediary
    const baseUnitConversion = this.convertViaBaseUnit(product, fromUnit, toUnit, quantity);
    if (baseUnitConversion.success) {
      return baseUnitConversion;
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
   * Convert via base unit (inputUnit or outputUnit)
   */
  private static convertViaBaseUnit(
    product: Product,
    fromUnit: string,
    toUnit: string,
    quantity: number
  ): ConversionResult {
    const baseUnit = product.inputUnit;

    // Convert from source to base unit
    let toBaseResult: ConversionResult;
    if (fromUnit === baseUnit) {
      toBaseResult = { success: true, convertedValue: quantity, conversionPath: [fromUnit] };
    } else {
      toBaseResult = this.convert(product, fromUnit, baseUnit, quantity);
    }

    if (!toBaseResult.success) {
      return toBaseResult;
    }

    // Convert from base unit to target
    let fromBaseResult: ConversionResult;
    if (toUnit === baseUnit) {
      fromBaseResult = { success: true, convertedValue: toBaseResult.convertedValue, conversionPath: [baseUnit] };
    } else {
      fromBaseResult = this.convert(product, baseUnit, toUnit, toBaseResult.convertedValue);
    }

    if (!fromBaseResult.success) {
      return fromBaseResult;
    }

    return {
      success: true,
      convertedValue: fromBaseResult.convertedValue,
      conversionPath: [...toBaseResult.conversionPath, ...fromBaseResult.conversionPath.slice(1)],
    };
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

    // Check for circular conversions that don't add up
    const units = this.getAllUnits(product);
    
    for (let i = 0; i < units.length; i++) {
      for (let j = i + 1; j < units.length; j++) {
        const unit1 = units[i];
        const unit2 = units[j];
        
        // Try converting 1 unit from unit1 to unit2 and back
        const forward = this.convert(product, unit1, unit2, 1);
        if (forward.success) {
          const backward = this.convert(product, unit2, unit1, forward.convertedValue);
          if (backward.success) {
            const difference = Math.abs(backward.convertedValue - 1);
            if (difference > 0.001) { // Allow small floating point errors
              errors.push(
                `Quy đổi không nhất quán: ${unit1} → ${unit2} → ${unit1} = ${backward.convertedValue} (mong đợi 1)`
              );
            }
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
