import { getCurrentCompanyId, getCurrentUserId, apiClient } from "../lib/supabase";
import { SalesRecord } from '../types';
import { fallbackService } from './fallbackService';
import { BaseService, ServiceResponse } from './baseService';
import { SalesMapper } from './mappers/salesMapper';

export class SalesService extends BaseService {
  static async getSalesRecords(filters?: {
    dateFrom?: string;
    dateTo?: string;
    productId?: string;
  }): Promise<ServiceResponse<SalesRecord[]>> {
    return this.execute(
      async () => {
        const companyId = await getCurrentCompanyId();
        let query = apiClient.from('sales_records').select(`
          *,
          product:products(id, name, business_code, category, input_unit, output_unit)
        `).order('date', { ascending: false });

        if (companyId) query = query.eq('company_id', companyId);
        if (filters?.dateFrom) query = query.gte('date', filters.dateFrom);
        if (filters?.dateTo) query = query.lte('date', filters.dateTo);
        if (filters?.productId) query = query.eq('product_id', filters.productId);

        const res = await query;
        if (res.data) res.data = res.data.map(item => SalesMapper.mapDbToSales(item));
        return res;
      },
      () => fallbackService.getSalesRecords({
        dateFrom: filters?.dateFrom ? new Date(filters.dateFrom) : undefined,
        dateTo: filters?.dateTo ? new Date(filters.dateTo) : undefined,
        productCode: filters?.productId
      })
    );
  }

  static async createSalesRecord(record: Omit<SalesRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<SalesRecord>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const companyId = await getCurrentCompanyId();
        const row = SalesMapper.mapSalesToDb({ ...record, createdBy: userId, updatedBy: userId });
        if (companyId) row.company_id = companyId;
        const res = await apiClient.from('sales_records').insert([row]).select(`
          *,
          product:products(id, name, business_code, category, input_unit, output_unit)
        `).single();
        if (res.data) res.data = SalesMapper.mapDbToSales(res.data);
        return res;
      },
      () => fallbackService.createSalesRecord(record)
    );
  }

  static async updateSalesRecord(id: string, updates: Partial<SalesRecord>): Promise<ServiceResponse<SalesRecord>> {
    return this.execute(
      async () => {
        const userId = await getCurrentUserId();
        const companyId = await getCurrentCompanyId();
        const row = SalesMapper.mapSalesToDb({ ...updates, updatedBy: userId, updatedAt: new Date() });
        let query = apiClient.from('sales_records').update(row).eq('id', id);
        if (companyId) query = query.eq('company_id', companyId);
        const res = await query.select(`
          *,
          product:products(id, name, business_code, category, input_unit, output_unit)
        `).single();
        if (res.data) res.data = SalesMapper.mapDbToSales(res.data);
        return res;
      },
      () => fallbackService.updateSalesRecord(id, updates)
    );
  }

  static async deleteSalesRecord(id: string): Promise<ServiceResponse<boolean>> {
    return this.execute(
      async () => {
        const companyId = await getCurrentCompanyId();
        let query = apiClient.from('sales_records').delete().eq('id', id);
        if (companyId) query = query.eq('company_id', companyId);
        const { error } = await query;
        return { data: !error, error };
      },
      () => fallbackService.deleteSalesRecord(id)
    );
  }

  static async getSalesStatistics(startDate?: string, endDate?: string): Promise<ServiceResponse<any>> {
    return this.execute(
      async () => {
        const companyId = await getCurrentCompanyId();
        let query = apiClient.from('sales_records').select(`
          date, sales_quantity, promotion_quantity, product:products(name, category)
        `);
        if (companyId) query = query.eq('company_id', companyId);
        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        const { data, error } = await query;
        if (error) return { error };

        const stats = data?.reduce((acc: any, record: any) => {
          acc.totalSales += record.sales_quantity;
          acc.totalPromotion += record.promotion_quantity;
          acc.totalRecords += 1;
          const category = record.product?.category || 'Khác';
          if (!acc.byCategory[category]) acc.byCategory[category] = { sales: 0, promotion: 0, total: 0 };
          acc.byCategory[category].sales += record.sales_quantity;
          acc.byCategory[category].promotion += record.promotion_quantity;
          acc.byCategory[category].total += record.sales_quantity + record.promotion_quantity;
          return acc;
        }, { totalSales: 0, totalPromotion: 0, totalRecords: 0, byCategory: {} });

        return { data: stats };
      },
      () => fallbackService.getSalesStatistics(startDate, endDate)
    );
  }
}

export const salesService = SalesService;
