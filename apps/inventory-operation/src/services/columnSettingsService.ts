import { supabase } from '../lib/supabase';

export interface ColumnConfig {
  id?: string;
  column_key: string;
  column_label: string;
  column_type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  width: string;
  required: boolean;
  visible: boolean;
  order_index: number;
  select_options?: string[];
  business_relevance?: string;
  role_visibility?: string[];
}

export interface ColumnPreset {
  id: string;
  name: string;
  industry_type: string;
  description: string;
  is_system: boolean;
}

class ColumnSettingsService {
  // Get column settings for a company
  async getColumnSettings(companyId: string): Promise<ColumnConfig[]> {
    const { data, error } = await supabase
      .from('product_column_settings')
      .select('*')
      .eq('company_id', companyId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching column settings:', error);
      return this.getDefaultColumns();
    }

    if (!data || data.length === 0) {
      // If no settings exist, create from system preset
      await this.initializeCompanySettings(companyId);
      return this.getColumnSettings(companyId);
    }

    return data.map(this.mapToColumnConfig);
  }

  // Get system default columns (company_id is NULL)
  async getDefaultColumns(): Promise<ColumnConfig[]> {
    const { data, error } = await supabase
      .from('product_column_settings')
      .select('*')
      .is('company_id', null)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching default columns:', error);
      return this.getFallbackDefaultColumns();
    }

    return data.map(this.mapToColumnConfig);
  }

  // Get industry presets
  async getIndustryPresets(): Promise<ColumnPreset[]> {
    const { data, error } = await supabase
      .from('product_column_presets')
      .select('*')
      .eq('is_system', true);

    if (error) {
      console.error('Error fetching industry presets:', error);
      return [];
    }

    return data || [];
  }

  // Apply preset to company
  async applyPresetToCompany(companyId: string, industryType: string): Promise<void> {
    // Get system columns for the preset
    const { data: systemColumns, error } = await supabase
      .from('product_column_settings')
      .select('*')
      .is('company_id', null);

    if (error) {
      console.error('Error fetching system columns for preset:', error);
      throw new Error('Failed to apply preset');
    }

    // Delete existing company settings
    await supabase
      .from('product_column_settings')
      .delete()
      .eq('company_id', companyId);

    // Insert new settings based on system columns
    const newSettings = systemColumns?.map(col => ({
      company_id: companyId,
      column_key: col.column_key,
      column_label: col.column_label,
      column_type: col.column_type,
      width: col.width,
      required: col.required,
      visible: col.visible,
      order_index: col.order_index,
      select_options: col.select_options,
      business_relevance: col.business_relevance,
      role_visibility: col.role_visibility,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })) || [];

    const { error: insertError } = await supabase
      .from('product_column_settings')
      .insert(newSettings);

    if (insertError) {
      console.error('Error inserting preset columns:', insertError);
      throw new Error('Failed to apply preset');
    }
  }

  // Update column settings
  async updateColumnSettings(companyId: string, columns: ColumnConfig[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    for (const column of columns) {
      const { error } = await supabase
        .from('product_column_settings')
        .upsert({
          company_id: companyId,
          column_key: column.column_key,
          column_label: column.column_label,
          column_type: column.column_type,
          width: column.width,
          required: column.required,
          visible: column.visible,
          order_index: column.order_index,
          select_options: column.select_options,
          business_relevance: column.business_relevance,
          role_visibility: column.role_visibility,
          updated_by: user?.id,
        }, {
          onConflict: 'company_id,column_key'
        });

      if (error) {
        console.error('Error updating column settings:', error);
        throw new Error(`Failed to update column ${column.column_key}`);
      }
    }
  }

  // Toggle column visibility
  async toggleColumnVisibility(companyId: string, columnKey: string, visible: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('product_column_settings')
      .update({ 
        visible, 
        updated_by: user?.id 
      })
      .eq('company_id', companyId)
      .eq('column_key', columnKey);

    if (error) {
      console.error('Error toggling column visibility:', error);
      throw new Error('Failed to toggle column visibility');
    }
  }

  // Initialize company settings from system defaults
  private async initializeCompanySettings(companyId: string): Promise<void> {
    const systemColumns = await this.getDefaultColumns();
    const { data: { user } } = await supabase.auth.getUser();

    const newSettings = systemColumns.map(col => ({
      company_id: companyId,
      column_key: col.column_key,
      column_label: col.column_label,
      column_type: col.column_type,
      width: col.width,
      required: col.required,
      visible: col.visible,
      order_index: col.order_index,
      select_options: col.select_options,
      business_relevance: col.business_relevance,
      role_visibility: col.role_visibility,
      created_by: user?.id,
      updated_by: user?.id,
    }));

    const { error } = await supabase
      .from('product_column_settings')
      .insert(newSettings);

    if (error) {
      console.error('Error initializing company settings:', error);
    }
  }

  // Map database row to ColumnConfig
  private mapToColumnConfig(row: any): ColumnConfig {
    return {
      id: row.id,
      column_key: row.column_key,
      column_label: row.column_label,
      column_type: row.column_type,
      width: row.width,
      required: row.required,
      visible: row.visible,
      order_index: row.order_index,
      select_options: row.select_options,
      business_relevance: row.business_relevance,
      role_visibility: row.role_visibility,
    };
  }

  // Fallback default columns if database is unavailable
  private getFallbackDefaultColumns(): ColumnConfig[] {
    return [
      { column_key: 'ngay_cap_nhat', column_label: 'Ngày cập nhật', column_type: 'date', width: '120px', required: true, visible: true, order_index: 1 },
      { column_key: 'loai', column_label: 'Loại', column_type: 'select', width: '100px', required: true, visible: true, order_index: 2, select_options: ['Đĩa trái cây', 'Nước ép', 'Smoothie'] },
      { column_key: 'ma_nguyen_vat_lieu', column_label: 'Mã Nguyên vật liệu', column_type: 'text', width: '150px', required: true, visible: true, order_index: 3 },
      { column_key: 'ten_nguyen_vat_lieu', column_label: 'Tên Nguyên vật liệu', column_type: 'text', width: '200px', required: true, visible: true, order_index: 4 },
      { column_key: 'thanh_pham', column_label: 'Thành phẩm?', column_type: 'boolean', width: '100px', required: false, visible: true, order_index: 5 },
      { column_key: 'dinh_luong_xuat', column_label: 'Định lượng Xuất', column_type: 'number', width: '120px', required: false, visible: true, order_index: 6 },
      { column_key: 'dinh_luong_nhap', column_label: 'Định lượng Nhập', column_type: 'number', width: '120px', required: false, visible: true, order_index: 7 },
      { column_key: 'ma_sp_kd', column_label: 'Mã SP KD', column_type: 'text', width: '100px', required: false, visible: true, order_index: 8 },
      { column_key: 'ten_thanh_pham', column_label: 'Tên Thành phẩm', column_type: 'text', width: '200px', required: true, visible: true, order_index: 9 },
      { column_key: 'dvt_nhap', column_label: 'ĐVT Nhập', column_type: 'select', width: '80px', required: false, visible: true, order_index: 10, select_options: ['đĩa', 'ly', 'kg', 'gram', 'trái'] },
      { column_key: 'dvt_xuat', column_label: 'ĐVT Xuất', column_type: 'select', width: '80px', required: false, visible: true, order_index: 11, select_options: ['đĩa', 'ly', 'kg', 'gram', 'trái'] },
      { column_key: 'tinh_trang', column_label: 'Tình trạng', column_type: 'select', width: '100px', required: true, visible: true, order_index: 12, select_options: ['Đang bán', 'Ngưng bán', 'Hết hàng'] },
    ];
  }
}

export const columnSettingsService = new ColumnSettingsService();
