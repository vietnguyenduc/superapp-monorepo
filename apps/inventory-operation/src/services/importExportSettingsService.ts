import { apiClient, getCurrentCompanyId } from '../lib/supabase';
import { isTrialMode } from '@superapp/shared-utils';

export type MatchField = 'business_code' | 'name' | 'both';
export type SupplierMatchField = 'customer_code' | 'full_name';

export interface ExportColumns {
  products: string[];
  inventory: string[];
  sales: string[];
}

export interface ImportExportConfig {
  productMatchField: MatchField;
  inventoryMatchField: MatchField;
  salesMatchField: MatchField;
  supplierMatchField: SupplierMatchField;
  exportColumns: ExportColumns;
}

const DEFAULT_CONFIG: ImportExportConfig = {
  productMatchField: 'business_code',
  inventoryMatchField: 'business_code',
  salesMatchField: 'business_code',
  supplierMatchField: 'customer_code',
  exportColumns: {
    products: ['business_code', 'name', 'category', 'input_unit', 'output_unit', 'status'],
    inventory: ['date', 'product_code', 'product_name', 'input_quantity', 'raw_material_stock', 'processed_stock', 'finished_product_stock'],
    sales: ['date', 'product_code', 'product_name', 'quantity', 'unit_price', 'total_amount'],
  },
};

// In-memory cache — loaded once per session, refreshed on save
let cachedConfig: ImportExportConfig | null = null;
const TRIAL_CONFIG_KEY = 'inventory_trial_import_export_config';

class ImportExportSettingsService {
  /**
   * Load import/export config from Supabase (inventory_settings.import_export_config).
   * Falls back to DEFAULT_CONFIG if not configured or on error.
   * Cached in-memory after first load.
   */
  async load(): Promise<ImportExportConfig> {
    if (cachedConfig) return cachedConfig;

    if (isTrialMode()) {
      try {
        cachedConfig = { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem(TRIAL_CONFIG_KEY) || '{}') };
        return cachedConfig;
      } catch {
        return DEFAULT_CONFIG;
      }
    }

    try {
      const companyId = await getCurrentCompanyId();
      if (!companyId) return DEFAULT_CONFIG;

      const res = await apiClient
        .from('inventory_settings')
        .select('import_export_config')
        .eq('company_id', companyId)
        .maybeSingle();

      if (res.data?.import_export_config) {
        cachedConfig = { ...DEFAULT_CONFIG, ...res.data.import_export_config } as ImportExportConfig;
        return cachedConfig;
      }
    } catch (err) {
      console.warn('Failed to load import_export_config:', err);
    }

    return DEFAULT_CONFIG;
  }

  /**
   * Save import/export config to Supabase.
   * Upserts the inventory_settings row for this company.
   */
  async save(config: Partial<ImportExportConfig>): Promise<ImportExportConfig> {
    const current = await this.load();
    const merged = { ...current, ...config };
    cachedConfig = merged;

    if (isTrialMode()) {
      localStorage.setItem(TRIAL_CONFIG_KEY, JSON.stringify(merged));
      return merged;
    }

    try {
      const companyId = await getCurrentCompanyId();
      if (!companyId) return merged;

      await apiClient
        .from('inventory_settings')
        .upsert(
          { company_id: companyId, import_export_config: merged as any },
          { onConflict: 'company_id' }
        );
    } catch (err) {
      console.error('Failed to save import_export_config:', err);
    }

    return merged;
  }

  /** Sync version — returns cached config or default (call load() first) */
  get(): ImportExportConfig {
    return cachedConfig || DEFAULT_CONFIG;
  }

  /** Clear cache — forces reload on next load() */
  invalidate() {
    cachedConfig = null;
  }
}

export const importExportSettingsService = new ImportExportSettingsService();
