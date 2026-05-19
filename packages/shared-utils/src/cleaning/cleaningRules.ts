/**
 * Data cleaning rules and interfaces
 */

export interface CleaningRule {
  name: string;
  description: string;
  apply: (data: any) => any;
  validate?: (data: any) => { valid: boolean; error?: string };
}

export interface CleaningResult {
  original: any;
  cleaned: any;
  originalCount?: number;
  cleanedCount?: number;
  removed: number;
  modified: number;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
}

/**
 * Trim whitespace from text fields
 */
export const trimWhitespaceRule: CleaningRule = {
  name: 'trim_whitespace',
  description: 'Trims leading and trailing whitespace from text fields',
  apply: (data: any) => {
    if (typeof data === 'string') {
      return data.trim();
    }
    if (typeof data === 'object' && data !== null) {
      const result: any = {};
      for (const key in data) {
        if (typeof data[key] === 'string') {
          result[key] = data[key].trim();
        } else {
          result[key] = data[key];
        }
      }
      return result;
    }
    return data;
  },
};

/**
 * Normalize dates to ISO format
 */
export const normalizeDatesRule: CleaningRule = {
  name: 'normalize_dates',
  description: 'Normalizes date fields to ISO 8601 format',
  apply: (data: any) => {
    if (typeof data === 'object' && data !== null) {
      const result: any = {};
      for (const key in data) {
        if (data[key] instanceof Date) {
          result[key] = data[key].toISOString();
        } else if (typeof data[key] === 'string' && isDateString(data[key])) {
          result[key] = new Date(data[key]).toISOString();
        } else {
          result[key] = data[key];
        }
      }
      return result;
    }
    return data;
  },
};

/**
 * Validate numeric fields
 */
export const validateQuantitiesRule: CleaningRule = {
  name: 'validate_quantities',
  description: 'Validates that quantity fields are positive numbers',
  apply: (data: any) => {
    if (typeof data === 'object' && data !== null) {
      const quantityFields = ['quantity', 'amount', 'count', 'total', 'value'];
      for (const field of quantityFields) {
        if (field in data && data[field] !== null && data[field] !== undefined) {
          const value = Number(data[field]);
          if (isNaN(value) || value < 0) {
            // Set to 0 if invalid
            data[field] = 0;
          }
        }
      }
    }
    return data;
  },
};

/**
 * Remove duplicate records based on a key field
 */
export const removeDuplicatesRule = (keyField: string): CleaningRule => ({
  name: 'remove_duplicates',
  description: `Removes duplicate records based on ${keyField}`,
  apply: (data: any[]) => {
    if (!Array.isArray(data)) {
      return data;
    }
    
    const seen = new Set();
    const result: any[] = [];
    
    for (const item of data) {
      const key = item[keyField];
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
    
    return result;
  },
});

/**
 * Remove invalid entries (entries with null/undefined required fields)
 */
export const removeInvalidEntriesRule = (requiredFields: string[]): CleaningRule => ({
  name: 'remove_invalid_entries',
  description: 'Removes entries with missing required fields',
  apply: (data: any[]) => {
    if (!Array.isArray(data)) {
      return data;
    }
    
    return data.filter(item => {
      return requiredFields.every(field => {
        const value = item[field];
        return value !== null && value !== undefined && value !== '';
      });
    });
  },
});

/**
 * Normalize text to lowercase
 */
export const normalizeTextRule: CleaningRule = {
  name: 'normalize_text',
  description: 'Normalizes text fields to lowercase',
  apply: (data: any) => {
    if (typeof data === 'string') {
      return data.toLowerCase();
    }
    if (typeof data === 'object' && data !== null) {
      const result: any = {};
      for (const key in data) {
        if (typeof data[key] === 'string') {
          result[key] = data[key].toLowerCase();
        } else {
          result[key] = data[key];
        }
      }
      return result;
    }
    return data;
  },
};

/**
 * Helper function to check if a string is a date
 */
function isDateString(value: string): boolean {
  return !isNaN(Date.parse(value));
}

/**
 * Applies multiple cleaning rules to data
 */
export function applyRules(
  data: any,
  rules: CleaningRule[]
): { data: any; result: CleaningResult } {
  const errors: Array<{ field: string; message: string }> = [];
  const warnings: Array<{ field: string; message: string }> = [];
  let removed = 0;
  let modified = 0;

  let currentData = data;

  for (const rule of rules) {
    try {
      const before = JSON.stringify(currentData);
      currentData = rule.apply(currentData);
      const after = JSON.stringify(currentData);

      if (before !== after) {
        modified++;
      }

      // Check if any items were removed
      if (Array.isArray(currentData) && Array.isArray(data)) {
        removed = Math.max(removed, data.length - currentData.length);
      }
    } catch (error) {
      errors.push({ field: rule.name, message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  const cleaningResult: CleaningResult = {
    original: data,
    cleaned: currentData,
    originalCount: Array.isArray(data) ? data.length : 1,
    cleanedCount: Array.isArray(currentData) ? currentData.length : 1,
    removed,
    modified,
    errors,
    warnings,
  };

  return {
    data: currentData,
    result: cleaningResult,
  };
}
