import { fallbackService } from './fallbackService';

export interface Supplier {
  customer_code: string;
  full_name: string;
  type: string;
  contact_phone?: string;
  address?: string;
}

export const cashflowIntegrationService = {
  // Simulate fetching suppliers from the Cashflow app's database
  async getSuppliers(): Promise<Supplier[]> {
    // In a real monorepo with Supabase, this would query the cashflow 'partners' table
    // For now, we mock the data and use localStorage to persist ad-hoc additions
    return new Promise((resolve) => {
      setTimeout(() => {
        const stored = localStorage.getItem('cashflow_suppliers');
        if (stored) {
          resolve(JSON.parse(stored));
        } else {
          const defaultSuppliers = [
            { customer_code: 'NCC01', full_name: 'Hộ kinh doanh Trái cây', type: 'supplier' },
            { customer_code: 'NCC02', full_name: 'Công ty Thực phẩm Sạch', type: 'supplier' },
            { customer_code: 'NCC03', full_name: 'Chợ đầu mối', type: 'supplier' }
          ];
          localStorage.setItem('cashflow_suppliers', JSON.stringify(defaultSuppliers));
          resolve(defaultSuppliers);
        }
      }, 300);
    });
  },

  // Simulate creating an ad-hoc supplier in the Cashflow app
  async createAdhocSupplier(supplierData: Partial<Supplier>): Promise<Supplier> {
    return new Promise(async (resolve) => {
      const current = await this.getSuppliers();
      const newSupplier: Supplier = {
        customer_code: supplierData.customer_code || `NCC${current.length + 1}`.padStart(5, '0'),
        full_name: supplierData.full_name || 'Nhà cung cấp mới',
        type: 'supplier',
        ...supplierData
      };
      const updated = [...current, newSupplier];
      localStorage.setItem('cashflow_suppliers', JSON.stringify(updated));
      setTimeout(() => resolve(newSupplier), 500);
    });
  }
};
