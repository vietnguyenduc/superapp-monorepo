// Column Configuration Service for Product Catalog
// Supports industry presets and user customizations

export interface ColumnConfig {
  key: string;
  label: string;
  enabled: boolean;
  order: number;
  required?: boolean;
}

export interface IndustryPreset {
  name: string;
  description: string;
  columns: ColumnConfig[];
}

// All available columns for Product Catalog
const ALL_COLUMNS: ColumnConfig[] = [
  { key: 'product', label: 'Sản phẩm', enabled: true, order: 1, required: true },
  { key: 'productType', label: 'Loại SP', enabled: true, order: 2 },
  { key: 'productCode', label: 'Mã SP', enabled: true, order: 3 },
  { key: 'inputUnit', label: 'ĐVT Nhập', enabled: true, order: 4 },
  { key: 'inputQuantity', label: 'Định lượng sơ chế', enabled: true, order: 5 },
  { key: 'outputUnit', label: 'Đơn vị tính (TP)', enabled: true, order: 6 },
  { key: 'status', label: 'Trạng thái', enabled: true, order: 7 },
  { key: 'actions', label: 'Thao tác', enabled: true, order: 8, required: true },
];

// Industry presets
const INDUSTRY_PRESETS: Record<string, IndustryPreset> = {
  'fnb': {
    name: 'F&B (Nhà hàng/Cafe)',
    description: 'Tối ưu cho ngành F&B - tập trung vào quy đổi nguyên liệu',
    columns: [
      { key: 'product', label: 'Sản phẩm', enabled: true, order: 1, required: true },
      { key: 'productType', label: 'Loại SP', enabled: true, order: 2 },
      { key: 'productCode', label: 'Mã SP', enabled: true, order: 3 },
      { key: 'inputUnit', label: 'ĐVT Nhập', enabled: true, order: 4 },
      { key: 'inputQuantity', label: 'Định lượng sơ chế', enabled: true, order: 5 },
      { key: 'outputUnit', label: 'Đơn vị tính (TP)', enabled: true, order: 6 },
      { key: 'status', label: 'Trạng thái', enabled: true, order: 7 },
      { key: 'actions', label: 'Thao tác', enabled: true, order: 8, required: true },
    ],
  },
  'retail': {
    name: 'Retail (Bán lẻ)',
    description: 'Tối ưu cho bán lẻ - tập trung vào mã SP và trạng thái',
    columns: [
      { key: 'product', label: 'Sản phẩm', enabled: true, order: 1, required: true },
      { key: 'productType', label: 'Loại SP', enabled: true, order: 2 },
      { key: 'productCode', label: 'Mã SP', enabled: true, order: 3 },
      { key: 'inputUnit', label: 'ĐVT Nhập', enabled: true, order: 4 },
      { key: 'inputQuantity', label: 'Định lượng sơ chế', enabled: false, order: 5 },
      { key: 'outputUnit', label: 'Đơn vị tính (TP)', enabled: true, order: 6 },
      { key: 'status', label: 'Trạng thái', enabled: true, order: 7 },
      { key: 'actions', label: 'Thao tác', enabled: true, order: 8, required: true },
    ],
  },
  'manufacturing': {
    name: 'Manufacturing (Sản xuất)',
    description: 'Tối ưu cho sản xuất - hiển thị đầy đủ thông tin quy đổi',
    columns: [
      { key: 'product', label: 'Sản phẩm', enabled: true, order: 1, required: true },
      { key: 'productType', label: 'Loại SP', enabled: true, order: 2 },
      { key: 'productCode', label: 'Mã SP', enabled: true, order: 3 },
      { key: 'inputUnit', label: 'ĐVT Nhập', enabled: true, order: 4 },
      { key: 'inputQuantity', label: 'Định lượng sơ chế', enabled: true, order: 5 },
      { key: 'outputUnit', label: 'Đơn vị tính (TP)', enabled: true, order: 6 },
      { key: 'status', label: 'Trạng thái', enabled: true, order: 7 },
      { key: 'actions', label: 'Thao tác', enabled: true, order: 8, required: true },
    ],
  },
  'default': {
    name: 'Mặc định',
    description: 'Cấu hình mặc định - hiển thị tất cả cột',
    columns: ALL_COLUMNS,
  },
};

const STORAGE_KEY = 'inventory_product_columns_config';

class ColumnConfigService {
  // Get current column configuration
  getColumnConfig(): ColumnConfig[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ColumnConfig[];
        
        // 1. Filter out columns that are no longer in ALL_COLUMNS
        const validKeys = ALL_COLUMNS.map(c => c.key);
        let updated = parsed.filter(col => validKeys.includes(col.key));

        // 2. Force update labels from ALL_COLUMNS (to fix stale labels like "Định lượng Nhập")
        updated = updated.map(col => {
          const masterCol = ALL_COLUMNS.find(c => c.key === col.key);
          return masterCol ? { ...col, label: masterCol.label } : col;
        });

        // 3. Add missing columns from ALL_COLUMNS
        const currentKeys = updated.map(c => c.key);
        const missingCols = ALL_COLUMNS.filter(c => !currentKeys.includes(c.key));
        
        if (missingCols.length > 0) {
          updated = [...updated, ...missingCols];
          this.saveColumnConfig(updated); // Sync back to storage
        }

        return updated.sort((a, b) => a.order - b.order);
      }
    } catch (error) {
      console.error('Error loading column config:', error);
    }
    return INDUSTRY_PRESETS.default.columns;
  }

  // Save column configuration
  saveColumnConfig(config: ColumnConfig[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving column config:', error);
    }
  }

  // Apply industry preset
  applyPreset(presetKey: string): ColumnConfig[] {
    const preset = INDUSTRY_PRESETS[presetKey] || INDUSTRY_PRESETS.default;
    const config = preset.columns;
    this.saveColumnConfig(config);
    return config;
  }

  // Get all available presets
  getPresets(): Record<string, IndustryPreset> {
    return INDUSTRY_PRESETS;
  }

  // Toggle column visibility
  toggleColumn(key: string, enabled: boolean): ColumnConfig[] {
    const config = this.getColumnConfig();
    const updated = config.map(col =>
      col.key === key ? { ...col, enabled } : col
    );
    this.saveColumnConfig(updated);
    return updated;
  }

  // Reset to default
  resetToDefault(): ColumnConfig[] {
    return this.applyPreset('default');
  }

  // Get enabled columns sorted by order
  getEnabledColumns(): ColumnConfig[] {
    const config = this.getColumnConfig();
    return config
      .filter(col => col.enabled)
      .sort((a, b) => a.order - b.order);
  }
}

export const columnConfigService = new ColumnConfigService();
export default columnConfigService;
