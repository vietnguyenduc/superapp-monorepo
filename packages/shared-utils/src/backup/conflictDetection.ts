/**
 * Conflict detection utilities for backup/restore operations
 */

export interface ConflictInfo {
  id: string;
  type: 'create' | 'update' | 'delete' | 'modified';
  fields?: string[];
  existing?: any;
  backup?: any;
  existingData?: any;
  backupData?: any;
  field?: string;
  reason?: string;
}

export interface ConflictDetectionOptions {
  idField?: string;
  timestampField?: string;
  ignoreFields?: string[];
}

/**
 * Detects conflicts between existing data and backup data
 */
export function detectConflicts<T extends Record<string, any>>(
  existingData: T[] | Record<string, T[]>,
  backupData: T[] | Record<string, T[]>,
  options: ConflictDetectionOptions = {}
): { conflicts: ConflictInfo[]; summary: { total: number; byType: Record<string, number> } } {
  const { idField = 'id', timestampField, ignoreFields = [] } = options;
  const conflicts: ConflictInfo[] = [];

  // Handle both array and object formats
  const existingArray = Array.isArray(existingData) ? existingData : Object.values(existingData).flat();
  const backupArray = Array.isArray(backupData) ? backupData : Object.values(backupData).flat();

  // Create a map of existing data for quick lookup
  existingArray.forEach(item => {
    const id = item[idField];
    if (id) {
      const backupItem = backupArray.find(b => b[idField] === id);
      
      if (backupItem) {
        // Check for conflicts
        const fieldConflicts: string[] = [];
        
        Object.keys(backupItem).forEach(field => {
          if (!ignoreFields.includes(field) && item[field] !== backupItem[field]) {
            fieldConflicts.push(field);
          }
        });

        if (fieldConflicts.length > 0) {
          conflicts.push({
            id,
            type: 'modified',
            fields: fieldConflicts,
            existing: item,
            backup: backupItem,
          });
        }
      } else {
        // Item doesn't exist in backup data - this is a delete conflict
        conflicts.push({
          id,
          type: 'delete',
          existingData: item,
          reason: 'Item does not exist in backup data',
        });
      }
    }
  });

  backupArray.forEach(backupItem => {
    const backupId = backupItem[idField];
    
    if (!backupId) {
      // New item without ID - potential create conflict
      conflicts.push({
        id: `new-${Date.now()}`,
        type: 'create',
        backupData: backupItem,
        reason: 'New item without ID',
      });
      return;
    }

    const existingItem = existingArray.find(e => e[idField] === backupId);

    if (!existingItem) {
      // Item doesn't exist in existing data - this is a create conflict
      // Item doesn't exist in existing data - this is a new item
      conflicts.push({
        id: String(backupId),
        type: 'create',
        backupData: backupItem,
        reason: 'Item does not exist in current data',
      });
    } else {
      // Item exists - check for update conflicts
      const fieldConflicts = detectFieldConflicts(
        backupItem,
        existingItem,
        ignoreFields
      );

      if (fieldConflicts.length > 0) {
        fieldConflicts.forEach(field => {
          conflicts.push({
            id: String(backupId),
            type: 'update',
            existingData: existingItem,
            backupData: backupItem,
            field: field,
            reason: `Field '${field}' has different values`,
          });
        });
      }

      // Check timestamp if available
      if (timestampField) {
        const backupTimestamp = new Date(backupItem[timestampField] || 0);
        const existingTimestamp = new Date(existingItem[timestampField] || 0);

        if (backupTimestamp < existingTimestamp) {
          conflicts.push({
            id: String(backupId),
            type: 'update',
            existingData: existingItem,
            backupData: backupItem,
            field: timestampField,
            reason: 'Backup data is older than existing data',
          });
        }
      }
    }
  });

  // Check for items in existing data that are not in backup (potential delete conflicts)
  existingArray.forEach(existingItem => {
    const existingId = existingItem[idField];
    if (!existingId) return;

    const existsInBackup = backupArray.some(
      backupItem => backupItem[idField] === existingId
    );

    if (!existsInBackup) {
      conflicts.push({
        id: String(existingId),
        type: 'delete',
        existingData: existingItem,
        reason: 'Item exists in current data but not in backup',
      });
    }
  });

  // Generate summary
  const byType: Record<string, number> = {
    create: 0,
    update: 0,
    delete: 0,
    modified: 0,
  };

  conflicts.forEach(conflict => {
    byType[conflict.type] = (byType[conflict.type] || 0) + 1;
  });

  return {
    conflicts,
    summary: {
      total: conflicts.length,
      byType,
    },
  };
}

/**
 * Detect field-level conflicts between two objects
 */
function detectFieldConflicts(
  obj1: any,
  obj2: any,
  ignoreFields: string[]
): string[] {
  const conflicts: string[] = [];
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  allKeys.forEach(key => {
    if (ignoreFields.includes(key)) {
      return;
    }

    const val1 = obj1[key];
    const val2 = obj2[key];

    // Compare values
    if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      conflicts.push(key);
    }
  });

  return conflicts;
}

/**
 * Resolve conflicts based on strategy
 */
export function resolveConflicts(
  conflicts: ConflictInfo[],
  strategy: 'skip' | 'overwrite' | 'merge' | 'keep_existing'
): {
  toCreate: any[];
  toUpdate: any[];
  toDelete: string[];
  toSkip: ConflictInfo[];
} {
  const toCreate: any[] = [];
  const toUpdate: any[] = [];
  const toDelete: string[] = [];
  const toSkip: ConflictInfo[] = [];

  conflicts.forEach(conflict => {
    switch (strategy) {
      case 'skip':
        toSkip.push(conflict);
        break;

      case 'overwrite':
        if (conflict.type === 'create' && conflict.backupData) {
          toCreate.push(conflict.backupData);
        } else if (conflict.type === 'update' && conflict.backupData) {
          toUpdate.push(conflict.backupData);
        } else if (conflict.type === 'delete') {
          toDelete.push(conflict.id);
        }
        break;

      case 'keep_existing':
        // Skip all conflicts, keep existing data
        toSkip.push(conflict);
        break;

      case 'merge':
        if (conflict.type === 'create' && conflict.backupData) {
          toCreate.push(conflict.backupData);
        } else if (conflict.type === 'update' && conflict.backupData && conflict.existingData) {
          // Merge data (simple implementation - can be enhanced)
          const merged = { ...conflict.existingData, ...conflict.backupData };
          toUpdate.push(merged);
        } else if (conflict.type === 'delete') {
          toSkip.push(conflict); // Don't delete on merge
        }
        break;
    }
  });

  return { toCreate, toUpdate, toDelete, toSkip };
}

/**
 * Generate a conflict report
 */
export function generateConflictReport(conflicts: ConflictInfo[]): {
  total: number;
  byType: Record<string, number>;
  details: ConflictInfo[];
} {
  const byType: Record<string, number> = {
    create: 0,
    update: 0,
    delete: 0,
  };

  conflicts.forEach(conflict => {
    byType[conflict.type] = (byType[conflict.type] || 0) + 1;
  });

  return {
    total: conflicts.length,
    byType,
    details: conflicts,
  };
}
