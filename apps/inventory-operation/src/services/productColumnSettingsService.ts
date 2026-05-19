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
  company_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ColumnPreset {
  id: string;
  name: string;
  industry_type: 'thuong_mai' | 'fandb' | 'san_xuat_so_che';
  description?: string;
  is_system: boolean;
  created_at?: string;
  updated_at?: string;
}

class ProductColumnSettingsService {
  // Get column settings for current company
  async getColumnSettings(companyId: string): Promise<{ data: ColumnConfig[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('product_column_settings')
        .select('*')
        .eq('company_id', companyId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching column settings:', error);
        return { data: null, error: 'Failed to fetch column settings' };
      }

      // If no company-specific settings, load system presets
      if (!data || data.length === 0) {
        return this.getSystemPresets();
      }

      return { data: data as ColumnConfig[], error: null };
    } catch (err) {
      console.error('Error in getColumnSettings:', err);
      return { data: null, error: 'Failed to fetch column settings' };
    }
  }

  // Get system presets (NULL company_id)
  async getSystemPresets(): Promise<{ data: ColumnConfig[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('product_column_settings')
        .select('*')
        .is('company_id', null)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching system presets:', error);
        return { data: null, error: 'Failed to fetch system presets' };
      }

      return { data: data as ColumnConfig[], error: null };
    } catch (err) {
      console.error('Error in getSystemPresets:', err);
      return { data: null, error: 'Failed to fetch system presets' };
    }
  }

  // Save column settings for company
  async saveColumnSettings(companyId: string, columns: ColumnConfig[], userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Delete existing settings for this company
      const { error: deleteError } = await supabase
        .from('product_column_settings')
        .delete()
        .eq('company_id', companyId);

      if (deleteError) {
        console.error('Error deleting existing settings:', deleteError);
        return { success: false, error: 'Failed to save column settings' };
      }

      // Insert new settings
      const settingsToInsert = columns.map((col, index) => ({
        company_id: companyId,
        column_key: col.column_key,
        column_label: col.column_label,
        column_type: col.column_type,
        width: col.width,
        required: col.required,
        visible: col.visible,
        order_index: index + 1,
        select_options: col.select_options || null,
        business_relevance: col.business_relevance || null,
        role_visibility: col.role_visibility || null,
        created_by: userId,
        updated_by: userId
      }));

      const { error: insertError } = await supabase
        .from('product_column_settings')
        .insert(settingsToInsert);

      if (insertError) {
        console.error('Error inserting column settings:', insertError);
        return { success: false, error: 'Failed to save column settings' };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('Error in saveColumnSettings:', err);
      return { success: false, error: 'Failed to save column settings' };
    }
  }

  // Get industry presets
  async getColumnPresets(): Promise<{ data: ColumnPreset[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('product_column_presets')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching column presets:', error);
        return { data: null, error: 'Failed to fetch column presets' };
      }

      return { data: data as ColumnPreset[], error: null };
    } catch (err) {
      console.error('Error in getColumnPresets:', err);
      return { data: null, error: 'Failed to fetch column presets' };
    }
  }

  // Apply preset to company
  async applyPresetToCompany(presetId: string, companyId: string, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Get preset columns (system settings for this preset type)
      const { data: presetData, error: presetError } = await supabase
        .from('product_column_presets')
        .select('industry_type')
        .eq('id', presetId)
        .single();

      if (presetError) {
        return { success: false, error: 'Preset not found' };
      }
      if (!presetData) {
        return { success: false, error: 'Preset data not found' };
      }

      // Get system columns for this industry type
      // For now, we'll use the default system presets
      const { data: systemColumns, error: systemError } = await this.getSystemPresets();

      if (systemError || !systemColumns) {
        return { success: false, error: 'Failed to load preset columns' };
      }

      // Save these columns to the company
      return this.saveColumnSettings(companyId, systemColumns, userId);
    } catch (err) {
      console.error('Error in applyPresetToCompany:', err);
      return { success: false, error: 'Failed to apply preset' };
    }
  }

  // Update single column visibility
  async updateColumnVisibility(companyId: string, columnKey: string, visible: boolean, userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('product_column_settings')
        .update({ visible, updated_by: userId })
        .eq('company_id', companyId)
        .eq('column_key', columnKey);

      if (error) {
        console.error('Error updating column visibility:', error);
        return { success: false, error: 'Failed to update column visibility' };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('Error in updateColumnVisibility:', err);
      return { success: false, error: 'Failed to update column visibility' };
    }
  }

  // Reset company settings to system defaults
  async resetToDefaults(companyId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Delete company-specific settings
      const { error: deleteError } = await supabase
        .from('product_column_settings')
        .delete()
        .eq('company_id', companyId);

      if (deleteError) {
        console.error('Error deleting company settings:', deleteError);
        return { success: false, error: 'Failed to reset to defaults' };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('Error in resetToDefaults:', err);
      return { success: false, error: 'Failed to reset to defaults' };
    }
  }
}

export const productColumnSettingsService = new ProductColumnSettingsService();
