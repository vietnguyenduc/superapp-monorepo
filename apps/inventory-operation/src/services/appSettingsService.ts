export type IntermediateConversionMode = 'single' | 'multiple';
export type BusinessModel = 'commercial' | 'fnb' | 'manufacturing';

export interface Branch {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
}

export interface TransactionType {
  id: string;
  name: string;
  code: string;
  impact: 'increase' | 'decrease' | 'adjust';
  targetStock: ('raw' | 'processed' | 'finished')[];
  owner: string;
}

export interface AppSettings {
  intermediateConversionMode: IntermediateConversionMode;
  businessModel: BusinessModel;
  industryType?: string;
  branches: Branch[];
  transactionTypes: TransactionType[];
  priceVarianceConfig: {
    allowFreePriceInput: boolean;
    tolerancePercentage: number;
  };
}

const STORAGE_KEY = 'inventory_app_settings';

const DEFAULT_BRANCHES: Branch[] = [
  { id: 'br-001', name: 'Văn phòng trung tâm', role: 'Điều phối', status: 'active' },
  { id: 'br-002', name: 'Chi nhánh Quận 1', role: 'Kho + Bán hàng', status: 'active' },
];

const DEFAULT_TRANSACTION_TYPES: TransactionType[] = [
  { id: 'tt-001', name: 'Nhập mua hàng', code: 'IMPORT_PURCHASE', impact: 'increase', targetStock: ['raw'], owner: 'Kế toán kho' },
  { id: 'tt-002', name: 'Xuất bán hàng', code: 'EXPORT_SALE', impact: 'decrease', targetStock: ['finished'], owner: 'Kế toán kho' },
  { id: 'tt-003', name: 'Điều chỉnh kiểm kho', code: 'ADJUST_AUDIT', impact: 'adjust', targetStock: ['raw', 'processed', 'finished'], owner: 'Thủ kho' },
  { id: 'tt-004', name: 'Xuất sơ chế', code: 'EXPORT_PROCESS', impact: 'decrease', targetStock: ['raw'], owner: 'Thủ kho' },
  { id: 'tt-005', name: 'Nhập sơ chế', code: 'IMPORT_PROCESS', impact: 'increase', targetStock: ['processed'], owner: 'Thủ kho' },
];

const DEFAULT_SETTINGS: AppSettings = {
  intermediateConversionMode: 'single',
  businessModel: 'fnb',
  branches: DEFAULT_BRANCHES,
  transactionTypes: DEFAULT_TRANSACTION_TYPES,
  priceVarianceConfig: {
    allowFreePriceInput: true,
    tolerancePercentage: 5,
  },
};

class AppSettingsService {
  getSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
    }
    return DEFAULT_SETTINGS;
  }

  saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving app settings:', error);
    }
    return updated;
  }

  getIntermediateConversionMode(): IntermediateConversionMode {
    return this.getSettings().intermediateConversionMode;
  }

  getBusinessModel(): BusinessModel {
    return this.getSettings().businessModel;
  }

  isCommercial(): boolean {
    return this.getBusinessModel() === 'commercial';
  }
}

export const appSettingsService = new AppSettingsService();
export default appSettingsService;
