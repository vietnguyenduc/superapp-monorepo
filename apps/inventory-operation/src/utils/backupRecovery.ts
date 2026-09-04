// Backup and Recovery System for Inventory Operation
// Based on cashflow's backupRecovery.ts pattern

import * as XLSX from 'xlsx';
import { supabase } from '../config/supabase';
import type { Product } from '../types';
import type { InventoryMovement, InventoryBalanceSnapshot, StockCountEntry } from '../types/InventoryMovement';
import { isTrialMode } from '@superapp/shared-utils';

// Note: This service requires a database table 'inventory_backup_history' to be created
// Migration will be added in a separate file

// Backup types
export interface InventoryBackupData {
  version: string;
  timestamp: string;
  company_id?: string;
  branch_id?: string;
  products: Product[];
  movements: InventoryMovement[];
  balanceSnapshots: InventoryBalanceSnapshot[];
  stockCountEntries: StockCountEntry[];
  metadata: {
    totalProducts: number;
    totalMovements: number;
    totalBalanceSnapshots: number;
    totalStockCountEntries: number;
    exportDate: string;
    exportedBy: string;
  };
}

export interface InventoryBackupOptions {
  includeProducts: boolean;
  includeMovements: boolean;
  includeBalanceSnapshots: boolean;
  includeStockCountEntries: boolean;
  company_id?: string;
  branch_id?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  format: 'xlsx' | 'json';
}

export interface ConflictInfo {
  totalConflicts: number;
  conflicts: Array<{
    type: 'product' | 'movement' | 'balance_snapshot' | 'stock_count_entry';
    id: string;
    name: string;
    existingData: any;
    backupData: any;
  }>;
  backupMetadata: InventoryBackupData['metadata'];
}

// Default backup options
export const defaultBackupOptions: InventoryBackupOptions = {
  includeProducts: true,
  includeMovements: true,
  includeBalanceSnapshots: true,
  includeStockCountEntries: true,
  format: 'xlsx',
};

// Backup service
export const inventoryBackupService = {
  // Create backup data
  async createBackup(
    options: InventoryBackupOptions = defaultBackupOptions,
    userId?: string,
  ): Promise<InventoryBackupData> {
    try {
      const isTrial = isTrialMode();
      if (isTrial) {
        // Return minimal trial backup data
        return {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          products: [],
          movements: [],
          balanceSnapshots: [],
          stockCountEntries: [],
          metadata: {
            totalProducts: 0,
            totalMovements: 0,
            totalBalanceSnapshots: 0,
            totalStockCountEntries: 0,
            exportDate: new Date().toISOString(),
            exportedBy: userId || 'trial-user',
          },
        };
      }

      const backupData: InventoryBackupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        company_id: options.company_id,
        branch_id: options.branch_id,
        products: [],
        movements: [],
        balanceSnapshots: [],
        stockCountEntries: [],
        metadata: {
          totalProducts: 0,
          totalMovements: 0,
          totalBalanceSnapshots: 0,
          totalStockCountEntries: 0,
          exportDate: new Date().toISOString(),
          exportedBy: userId || 'unknown',
        },
      };

      // Fetch products
      if (options.includeProducts) {
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('company_id', options.company_id || '')
          .eq('branch_id', options.branch_id || '');
        
        if (products) {
          backupData.products = products as Product[];
          backupData.metadata.totalProducts = products.length;
        }
      }

      // Fetch movements
      if (options.includeMovements) {
        let query = supabase
          .from('inventory_movements')
          .select('*')
          .eq('company_id', options.company_id || '');
        
        if (options.branch_id) {
          query = query.eq('branch_id', options.branch_id);
        }
        
        if (options.dateRange) {
          query = query.gte('movement_date', options.dateRange.start)
                     .lte('movement_date', options.dateRange.end);
        }

        const { data: movements } = await query;
        
        if (movements) {
          backupData.movements = movements as InventoryMovement[];
          backupData.metadata.totalMovements = movements.length;
        }
      }

      // Fetch balance snapshots
      if (options.includeBalanceSnapshots) {
        let query = supabase
          .from('inventory_balance_snapshots')
          .select('*')
          .eq('company_id', options.company_id || '');
        
        if (options.branch_id) {
          query = query.eq('branch_id', options.branch_id);
        }

        const { data: snapshots } = await query;
        
        if (snapshots) {
          backupData.balanceSnapshots = snapshots as InventoryBalanceSnapshot[];
          backupData.metadata.totalBalanceSnapshots = snapshots.length;
        }
      }

      // Fetch stock count entries
      if (options.includeStockCountEntries) {
        let query = supabase
          .from('stock_count_entries')
          .select('*')
          .eq('company_id', options.company_id || '');
        
        if (options.branch_id) {
          query = query.eq('branch_id', options.branch_id);
        }

        if (options.dateRange) {
          query = query.gte('count_date', options.dateRange.start)
                     .lte('count_date', options.dateRange.end);
        }

        const { data: entries } = await query;
        
        if (entries) {
          backupData.stockCountEntries = entries as StockCountEntry[];
          backupData.metadata.totalStockCountEntries = entries.length;
        }
      }

      return backupData;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup');
    }
  },

  // Export backup to file
  async exportToFile(
    backupData: InventoryBackupData,
    format: 'xlsx' | 'json' = 'xlsx'
  ): Promise<Blob> {
    try {
      if (format === 'json') {
        const jsonString = JSON.stringify(backupData, null, 2);
        return new Blob([jsonString], { type: 'application/json' });
      }

      // Excel format
      const workbook = XLSX.utils.book_new();

      // Products sheet
      if (backupData.products.length > 0) {
        const productsSheet = XLSX.utils.json_to_sheet(backupData.products);
        XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');
      }

      // Movements sheet
      if (backupData.movements.length > 0) {
        const movementsSheet = XLSX.utils.json_to_sheet(backupData.movements);
        XLSX.utils.book_append_sheet(workbook, movementsSheet, 'Movements');
      }

      // Balance Snapshots sheet
      if (backupData.balanceSnapshots.length > 0) {
        const snapshotsSheet = XLSX.utils.json_to_sheet(backupData.balanceSnapshots);
        XLSX.utils.book_append_sheet(workbook, snapshotsSheet, 'Balance Snapshots');
      }

      // Stock Count Entries sheet
      if (backupData.stockCountEntries.length > 0) {
        const entriesSheet = XLSX.utils.json_to_sheet(backupData.stockCountEntries);
        XLSX.utils.book_append_sheet(workbook, entriesSheet, 'Stock Count Entries');
      }

      // Metadata sheet
      const metadataSheet = XLSX.utils.json_to_sheet([backupData.metadata]);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    } catch (error) {
      console.error('Error exporting to file:', error);
      throw new Error('Failed to export backup to file');
    }
  },

  // Save backup to database
  async saveBackupToDatabase(
    backupData: InventoryBackupData,
    companyId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const isTrial = isTrialMode();
      if (isTrial) {
        return { success: true };
      }

      const { error } = await supabase
        .from('inventory_backup_history')
        .insert([{
          company_id: companyId,
          created_by: userId,
          backup_data: backupData,
          metadata: backupData.metadata,
          created_at: new Date().toISOString(),
        }]);

      if (error) {
        console.error('Error saving backup to database:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving backup to database:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Restore backup from data
  async restoreBackup(
    backupData: InventoryBackupData,
    options: {
      skipConflicts?: boolean;
      overwriteExisting?: boolean;
    } = {}
  ): Promise<{ success: boolean; conflicts?: ConflictInfo; error?: string }> {
    try {
      const isTrial = isTrialMode();
      if (isTrial) {
        return { success: true };
      }

      const conflicts: ConflictInfo['conflicts'] = [];
      let totalConflicts = 0;

      // Restore products
      if (backupData.products.length > 0) {
        for (const product of backupData.products) {
          const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('id', product.id)
            .single();

          if (existing) {
            if (!options.skipConflicts) {
              conflicts.push({
                type: 'product',
                id: product.id,
                name: product.name,
                existingData: existing,
                backupData: product,
              });
              totalConflicts++;
            } else if (options.overwriteExisting) {
              await supabase
                .from('products')
                .update(product)
                .eq('id', product.id);
            }
          } else {
            await supabase
              .from('products')
              .insert([product]);
          }
        }
      }

      // Restore movements
      if (backupData.movements.length > 0) {
        for (const movement of backupData.movements) {
          const { data: existing } = await supabase
            .from('inventory_movements')
            .select('id')
            .eq('id', movement.id)
            .single();

          if (existing) {
            if (!options.skipConflicts) {
              conflicts.push({
                type: 'movement',
                id: movement.id,
                name: `${movement.productName} - ${movement.movementDate}`,
                existingData: existing,
                backupData: movement,
              });
              totalConflicts++;
            } else if (options.overwriteExisting) {
              await supabase
                .from('inventory_movements')
                .update(movement)
                .eq('id', movement.id);
            }
          } else {
            await supabase
              .from('inventory_movements')
              .insert([movement]);
          }
        }
      }

      // Restore balance snapshots
      if (backupData.balanceSnapshots.length > 0) {
        for (const snapshot of backupData.balanceSnapshots) {
          const { data: existing } = await supabase
            .from('inventory_balance_snapshots')
            .select('id')
            .eq('id', snapshot.id)
            .single();

          if (existing) {
            if (!options.skipConflicts) {
              conflicts.push({
                type: 'balance_snapshot',
                id: snapshot.id,
                name: `${snapshot.productName} - ${snapshot.periodStart}`,
                existingData: existing,
                backupData: snapshot,
              });
              totalConflicts++;
            } else if (options.overwriteExisting) {
              await supabase
                .from('inventory_balance_snapshots')
                .update(snapshot)
                .eq('id', snapshot.id);
            }
          } else {
            await supabase
              .from('inventory_balance_snapshots')
              .insert([snapshot]);
          }
        }
      }

      // Restore stock count entries
      if (backupData.stockCountEntries.length > 0) {
        for (const entry of backupData.stockCountEntries) {
          const { data: existing } = await supabase
            .from('stock_count_entries')
            .select('id')
            .eq('id', entry.id)
            .single();

          if (existing) {
            if (!options.skipConflicts) {
              conflicts.push({
                type: 'stock_count_entry',
                id: entry.id,
                name: `${entry.productName} - ${entry.countDate}`,
                existingData: existing,
                backupData: entry,
              });
              totalConflicts++;
            } else if (options.overwriteExisting) {
              await supabase
                .from('stock_count_entries')
                .update(entry)
                .eq('id', entry.id);
            }
          } else {
            await supabase
              .from('stock_count_entries')
              .insert([entry]);
          }
        }
      }

      if (totalConflicts > 0) {
        return {
          success: false,
          conflicts: {
            totalConflicts,
            conflicts,
            backupMetadata: backupData.metadata,
          },
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error restoring backup:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Get backup history from database
  async getBackupHistory(companyId: string, limit: number = 20): Promise<{
    data?: Array<{
      id: string;
      created_at: string;
      metadata: InventoryBackupData['metadata'];
    }>;
    error?: string;
  }> {
    try {
      const isTrial = isTrialMode();
      if (isTrial) {
        return { data: [] };
      }

      const { data, error } = await supabase
        .from('inventory_backup_history')
        .select('id, created_at, metadata')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (error) {
      console.error('Error getting backup history:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Delete backup from database
  async deleteBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const isTrial = isTrialMode();
      if (isTrial) {
        return { success: true };
      }

      const { error } = await supabase
        .from('inventory_backup_history')
        .delete()
        .eq('id', backupId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting backup:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

export default inventoryBackupService;
