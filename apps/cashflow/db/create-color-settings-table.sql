-- Create color settings table for transaction type colors
CREATE TABLE IF NOT EXISTS color_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on setting_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_color_settings_key ON color_settings(setting_key);

-- Enable RLS
ALTER TABLE color_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY color_settings_select_policy ON color_settings
FOR SELECT TO authenticated
USING (true);

CREATE POLICY color_settings_update_policy ON color_settings
FOR UPDATE TO authenticated
USING (true);

CREATE POLICY color_settings_insert_policy ON color_settings
FOR INSERT TO authenticated
WITH CHECK (true);

-- Insert default color settings
INSERT INTO color_settings (setting_key, setting_value, description) VALUES
(
  'transaction_type_colors',
  '{
    "payment": {
      "label": "Điều chỉnh giảm",
      "bg_color": "bg-green-100",
      "text_color": "text-green-800",
      "dark_bg_color": "dark:bg-green-900",
      "dark_text_color": "dark:text-green-200",
      "amount_color": "text-green-600",
      "dark_amount_color": "dark:text-green-400"
    },
    "charge": {
      "label": "Điều chỉnh tăng",
      "bg_color": "bg-red-100",
      "text_color": "text-red-800",
      "dark_bg_color": "dark:bg-red-900",
      "dark_text_color": "dark:text-red-200",
      "amount_color": "text-red-600",
      "dark_amount_color": "dark:text-red-400"
    },
    "adjustment": {
      "label": "Điều chỉnh",
      "bg_color": "bg-blue-100",
      "text_color": "text-blue-800",
      "dark_bg_color": "dark:bg-blue-900",
      "dark_text_color": "dark:text-blue-200",
      "amount_color": "text-blue-600",
      "dark_amount_color": "dark:text-blue-400"
    },
    "refund": {
      "label": "Hoàn tiền",
      "bg_color": "bg-green-100",
      "text_color": "text-green-800",
      "dark_bg_color": "dark:bg-green-900",
      "dark_text_color": "dark:text-green-200",
      "amount_color": "text-green-600",
      "dark_amount_color": "dark:text-green-400"
    }
  }'::jsonb,
  'Màu sắc cho các loại giao dịch (payment, charge, adjustment, refund)'
),
(
  'customer_balance_colors',
  '{
    "customer_list": {
      "positive_balance_color": "text-black dark:text-white",
      "zero_or_negative_color": "text-green-600 dark:text-green-400"
    },
    "customer_detail": {
      "positive_balance_color": "text-red-600 dark:text-red-400",
      "zero_or_negative_color": "text-green-600 dark:text-green-400"
    }
  }'::jsonb,
  'Màu sắc cho số dư khách hàng (danh sách và chi tiết)'
)
ON CONFLICT (setting_key) DO NOTHING;
