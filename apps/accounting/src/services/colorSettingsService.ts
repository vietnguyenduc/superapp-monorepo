import { BaseService } from "@superapp/shared-utils";
import { supabase } from "./supabase";
import { trialGet } from "./trialMockStore";



export class ColorSettingsService extends BaseService {
  static getDefaultTransactionTypeColors() {
    return {
      payment: { label: "Điều chỉnh giảm", bg_color: "bg-green-100", text_color: "text-green-800", dark_bg_color: "dark:bg-green-900", dark_text_color: "dark:text-green-200", amount_color: "text-green-600", dark_amount_color: "dark:text-green-400" },
      charge: { label: "Điều chỉnh tăng", bg_color: "bg-red-100", text_color: "text-red-800", dark_bg_color: "dark:bg-red-900", dark_text_color: "dark:text-red-200", amount_color: "text-red-600", dark_amount_color: "dark:text-red-400" },
      adjustment: { label: "Điều chỉnh", bg_color: "bg-blue-100", text_color: "text-blue-800", dark_bg_color: "dark:bg-blue-900", dark_text_color: "dark:text-blue-200", amount_color: "text-blue-600", dark_amount_color: "dark:text-blue-400" },
      refund: { label: "Hoàn tiền", bg_color: "bg-green-100", text_color: "text-green-800", dark_bg_color: "dark:bg-green-900", dark_text_color: "dark:text-green-200", amount_color: "text-green-600", dark_amount_color: "dark:text-green-400" },
    };
  }

  static getDefaultCustomerBalanceColors() {
    return {
      customer_list: { positive_balance_color: "text-black dark:text-white", zero_or_negative_color: "text-green-600 dark:text-green-400" },
      customer_detail: { positive_balance_color: "text-red-600 dark:text-red-400", zero_or_negative_color: "text-green-600 dark:text-green-400" },
    };
  }

  static async getTransactionTypeColors() {
    return this.execute(
      async () => {
        const { data, error } = await supabase.from("color_settings").select("*").eq("setting_key", "transaction_type_colors").single();
        if (data?.setting_value) return { data: data.setting_value, error: null };
        return { data: this.getDefaultTransactionTypeColors(), error: null };
      },
      async () => {
        const data = trialGet("color_settings") || [];
        const setting = data.find((s: any) => s.setting_key === "transaction_type_colors");
        if (setting?.setting_value) return { data: setting.setting_value, error: null };
        return { data: this.getDefaultTransactionTypeColors(), error: null };
      }
    );
  }

  static async getCustomerBalanceColors() {
    return this.execute(
      async () => {
        const { data, error } = await supabase.from("color_settings").select("*").eq("setting_key", "customer_balance_colors").single();
        if (data?.setting_value) return { data: data.setting_value, error: null };
        return { data: this.getDefaultCustomerBalanceColors(), error: null };
      },
      async () => {
        const data = trialGet("color_settings") || [];
        const setting = data.find((s: any) => s.setting_key === "customer_balance_colors");
        if (setting?.setting_value) return { data: setting.setting_value, error: null };
        return { data: this.getDefaultCustomerBalanceColors(), error: null };
      }
    );
  }

  static async updateTransactionTypeColors(colors: any) {
    return this.execute(
      async () => {
        const { data, error } = await supabase.from("color_settings").upsert({
          setting_key: "transaction_type_colors",
          setting_value: colors,
          description: "Màu sắc cho các loại giao dịch (payment, charge, adjustment, refund)",
          updated_at: new Date().toISOString(),
        }).select().single();
        return { data, error };
      }
      // UI doesn't usually update settings in trial mode, so no fallback needed
    );
  }

  static async updateCustomerBalanceColors(colors: any) {
    return this.execute(
      async () => {
        const { data, error } = await supabase.from("color_settings").upsert({
          setting_key: "customer_balance_colors",
          setting_value: colors,
          description: "Màu sắc cho số dư khách hàng (danh sách và chi tiết)",
          updated_at: new Date().toISOString(),
        }).select().single();
        return { data, error };
      }
    );
  }
}

export const colorSettingsService = {
  getTransactionTypeColors: ColorSettingsService.getTransactionTypeColors.bind(ColorSettingsService),
  getCustomerBalanceColors: ColorSettingsService.getCustomerBalanceColors.bind(ColorSettingsService),
  updateTransactionTypeColors: ColorSettingsService.updateTransactionTypeColors.bind(ColorSettingsService),
  updateCustomerBalanceColors: ColorSettingsService.updateCustomerBalanceColors.bind(ColorSettingsService),
  getDefaultTransactionTypeColors: ColorSettingsService.getDefaultTransactionTypeColors.bind(ColorSettingsService),
  getDefaultCustomerBalanceColors: ColorSettingsService.getDefaultCustomerBalanceColors.bind(ColorSettingsService),
};
