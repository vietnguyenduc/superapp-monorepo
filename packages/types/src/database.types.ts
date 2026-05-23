export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      approval_logs: {
        Row: {
          action: string
          comment: string | null
          created_at: string | null
          id: string
          record_id: string
          record_type: string
          status: Database["public"]["Enums"]["approval_status"]
          user_id: string
          user_name: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          action: string
          comment?: string | null
          created_at?: string | null
          id?: string
          record_id: string
          record_type: string
          status: Database["public"]["Enums"]["approval_status"]
          user_id: string
          user_name: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          action?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          record_id?: string
          record_type?: string
          status?: Database["public"]["Enums"]["approval_status"]
          user_id?: string
          user_name?: string
          user_role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      backup_history: {
        Row: {
          backup_data: Json | null
          backup_format: string
          backup_name: string
          backup_size: number | null
          backup_timestamp: string
          backup_version: string
          branch_id: string | null
          company_id: string
          compression_algorithm: string | null
          created_at: string | null
          created_by: string
          id: string
          included_tables: string[] | null
          is_compressed: boolean | null
          is_restorable: boolean | null
          last_restored_at: string | null
          last_restored_by: string | null
          notes: string | null
          restore_allowed_by: string[] | null
          restore_count: number | null
          total_bank_accounts: number | null
          total_branches: number | null
          total_customers: number | null
          total_transactions: number | null
          updated_at: string | null
        }
        Insert: {
          backup_data?: Json | null
          backup_format: string
          backup_name: string
          backup_size?: number | null
          backup_timestamp: string
          backup_version?: string
          branch_id?: string | null
          company_id: string
          compression_algorithm?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          included_tables?: string[] | null
          is_compressed?: boolean | null
          is_restorable?: boolean | null
          last_restored_at?: string | null
          last_restored_by?: string | null
          notes?: string | null
          restore_allowed_by?: string[] | null
          restore_count?: number | null
          total_bank_accounts?: number | null
          total_branches?: number | null
          total_customers?: number | null
          total_transactions?: number | null
          updated_at?: string | null
        }
        Update: {
          backup_data?: Json | null
          backup_format?: string
          backup_name?: string
          backup_size?: number | null
          backup_timestamp?: string
          backup_version?: string
          branch_id?: string | null
          company_id?: string
          compression_algorithm?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          included_tables?: string[] | null
          is_compressed?: boolean | null
          is_restorable?: boolean | null
          last_restored_at?: string | null
          last_restored_by?: string | null
          notes?: string | null
          restore_allowed_by?: string[] | null
          restore_count?: number | null
          total_bank_accounts?: number | null
          total_branches?: number | null
          total_customers?: number | null
          total_transactions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_history_last_restored_by_fkey"
            columns: ["last_restored_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string | null
          balance: number | null
          bank_name: string
          branch_id: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          opening_balance: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          account_type?: string | null
          balance?: number | null
          bank_name: string
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string | null
          balance?: number | null
          bank_name?: string
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          code: string
          company_id: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          name: string
          phone: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          code: string
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          phone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          phone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_branches_manager"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      color_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      commission_settings: {
        Row: {
          applies_to: string | null
          applies_to_value: string | null
          calculation_method: string
          company_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          max_amount: number | null
          min_amount: number | null
          name: string
          rate: number | null
          tiers: Json | null
          updated_at: string | null
        }
        Insert: {
          applies_to?: string | null
          applies_to_value?: string | null
          calculation_method?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          name: string
          rate?: number | null
          tiers?: Json | null
          updated_at?: string | null
        }
        Update: {
          applies_to?: string | null
          applies_to_value?: string | null
          calculation_method?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          name?: string
          rate?: number | null
          tiers?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_fields: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          field_type: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          is_required: boolean | null
          name: string
          sort_order: number | null
          type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_required?: boolean | null
          name: string
          sort_order?: number | null
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_required?: boolean | null
          name?: string
          sort_order?: number | null
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_fields_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_fields_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_fields_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          acquisition_channel: string | null
          acquisition_cost: number | null
          address: string | null
          branch_id: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          current_balance: number | null
          customer_code: string
          email: string | null
          first_order_date: string | null
          full_name: string
          id: string
          is_active: boolean | null
          last_transaction_date: string | null
          notes: string | null
          opening_balance: number | null
          opening_balance_updated_at: string | null
          partner_type: string | null
          phone: string | null
          segment: string | null
          total_balance: number | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          updated_by: string | null
          working_method: string | null
        }
        Insert: {
          acquisition_channel?: string | null
          acquisition_cost?: number | null
          address?: string | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_balance?: number | null
          customer_code: string
          email?: string | null
          first_order_date?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          last_transaction_date?: string | null
          notes?: string | null
          opening_balance?: number | null
          opening_balance_updated_at?: string | null
          partner_type?: string | null
          phone?: string | null
          segment?: string | null
          total_balance?: number | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          working_method?: string | null
        }
        Update: {
          acquisition_channel?: string | null
          acquisition_cost?: number | null
          address?: string | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_balance?: number | null
          customer_code?: string
          email?: string | null
          first_order_date?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_transaction_date?: string | null
          notes?: string | null
          opening_balance?: number | null
          opening_balance_updated_at?: string | null
          partner_type?: string | null
          phone?: string | null
          segment?: string | null
          total_balance?: number | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          working_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      export_logs: {
        Row: {
          branch_id: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          error_message: string | null
          export_format: string
          export_type: string
          file_size_bytes: number | null
          file_url: string | null
          filters: Json | null
          id: string
          ip_address: unknown
          parameters: Json | null
          record_count: number | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          branch_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          export_format: string
          export_type: string
          file_size_bytes?: number | null
          file_url?: string | null
          filters?: Json | null
          id?: string
          ip_address?: unknown
          parameters?: Json | null
          record_count?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          branch_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          export_format?: string
          export_type?: string
          file_size_bytes?: number | null
          file_url?: string | null
          filters?: Json | null
          id?: string
          ip_address?: unknown
          parameters?: Json | null
          record_count?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "export_logs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_balance_snapshots: {
        Row: {
          book_quantity: number | null
          branch_id: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          period_end_date: string | null
          period_start_date: string | null
          physical_quantity: number | null
          product_id: string
          quantity: number
          snapshot_date: string
          snapshot_type: string
          total_value: number | null
          unit: string
          unit_cost: number | null
          updated_at: string | null
          updated_by: string | null
          variance: number | null
          variance_percentage: number | null
          warehouse_id: string | null
        }
        Insert: {
          book_quantity?: number | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          period_end_date?: string | null
          period_start_date?: string | null
          physical_quantity?: number | null
          product_id: string
          quantity: number
          snapshot_date: string
          snapshot_type?: string
          total_value?: number | null
          unit: string
          unit_cost?: number | null
          updated_at?: string | null
          updated_by?: string | null
          variance?: number | null
          variance_percentage?: number | null
          warehouse_id?: string | null
        }
        Update: {
          book_quantity?: number | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          period_end_date?: string | null
          period_start_date?: string | null
          physical_quantity?: number | null
          product_id?: string
          quantity?: number
          snapshot_date?: string
          snapshot_type?: string
          total_value?: number | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string | null
          updated_by?: string | null
          variance?: number | null
          variance_percentage?: number | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_balance_snapshots_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_balance_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_balance_snapshots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_balance_snapshots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_balance_snapshots_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          branch_id: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          movement_category: string | null
          movement_date: string
          movement_time: string | null
          movement_type: string
          notes: string | null
          product_id: string
          quantity: number
          reference_movement_id: string | null
          running_balance: number | null
          running_value: number | null
          source_id: string | null
          source_type: string
          total_value: number | null
          unit: string
          unit_cost: number | null
          updated_at: string | null
          updated_by: string | null
          warehouse_id: string | null
        }
        Insert: {
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          movement_category?: string | null
          movement_date: string
          movement_time?: string | null
          movement_type: string
          notes?: string | null
          product_id: string
          quantity: number
          reference_movement_id?: string | null
          running_balance?: number | null
          running_value?: number | null
          source_id?: string | null
          source_type: string
          total_value?: number | null
          unit: string
          unit_cost?: number | null
          updated_at?: string | null
          updated_by?: string | null
          warehouse_id?: string | null
        }
        Update: {
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          movement_category?: string | null
          movement_date?: string
          movement_time?: string | null
          movement_type?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_movement_id?: string | null
          running_balance?: number | null
          running_value?: number | null
          source_id?: string | null
          source_type?: string
          total_value?: number | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string | null
          updated_by?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_reference_movement_id_fkey"
            columns: ["reference_movement_id"]
            isOneToOne: false
            referencedRelation: "inventory_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_records: {
        Row: {
          actual_quantity: number | null
          branch_id: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          input_quantity: number | null
          product_id: string
          status: string | null
          supplier_id: string | null
          total_amount: number | null
          unit: string
          unit_price: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          actual_quantity?: number | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          input_quantity?: number | null
          product_id: string
          status?: string | null
          supplier_id?: string | null
          total_amount?: number | null
          unit: string
          unit_price?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          actual_quantity?: number | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          input_quantity?: number | null
          product_id?: string
          status?: string | null
          supplier_id?: string | null
          total_amount?: number | null
          unit?: string
          unit_price?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_records_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reports: {
        Row: {
          actual_balance: number | null
          book_balance: number | null
          branch_id: string | null
          closing_balance: number | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          input_quantity: number | null
          opening_balance: number | null
          output_quantity: number | null
          product_id: string
          unit: string
          updated_at: string | null
          variance: number | null
        }
        Insert: {
          actual_balance?: number | null
          book_balance?: number | null
          branch_id?: string | null
          closing_balance?: number | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          input_quantity?: number | null
          opening_balance?: number | null
          output_quantity?: number | null
          product_id: string
          unit: string
          updated_at?: string | null
          variance?: number | null
        }
        Update: {
          actual_balance?: number | null
          book_balance?: number | null
          branch_id?: string | null
          closing_balance?: number | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          input_quantity?: number | null
          opening_balance?: number | null
          output_quantity?: number | null
          product_id?: string
          unit?: string
          updated_at?: string | null
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reports_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reports_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_variance_reports: {
        Row: {
          actual_inventory: number | null
          beginning_inventory: number | null
          book_inventory: number | null
          branch_id: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          inbound_quantity: number | null
          notes: string | null
          product_id: string
          promotion_quantity: number | null
          sales_quantity: number | null
          special_outbound_quantity: number | null
          unit: string
          updated_at: string | null
          updated_by: string | null
          variance: number | null
          variance_percentage: number | null
        }
        Insert: {
          actual_inventory?: number | null
          beginning_inventory?: number | null
          book_inventory?: number | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          inbound_quantity?: number | null
          notes?: string | null
          product_id: string
          promotion_quantity?: number | null
          sales_quantity?: number | null
          special_outbound_quantity?: number | null
          unit: string
          updated_at?: string | null
          updated_by?: string | null
          variance?: number | null
          variance_percentage?: number | null
        }
        Update: {
          actual_inventory?: number | null
          beginning_inventory?: number | null
          book_inventory?: number | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          inbound_quantity?: number | null
          notes?: string | null
          product_id?: string
          promotion_quantity?: number | null
          sales_quantity?: number | null
          special_outbound_quantity?: number | null
          unit?: string
          updated_at?: string | null
          updated_by?: string | null
          variance?: number | null
          variance_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_variance_reports_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_variance_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_variance_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_variance_reports_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_variance_reports_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_costs: {
        Row: {
          amount: number
          branch_id: string | null
          campaign_name: string | null
          channel: string | null
          company_id: string | null
          cost_date: string | null
          cost_type: string
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          id: string
          notes: string | null
        }
        Insert: {
          amount?: number
          branch_id?: string | null
          campaign_name?: string | null
          channel?: string | null
          company_id?: string | null
          cost_date?: string | null
          cost_type?: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          amount?: number
          branch_id?: string | null
          campaign_name?: string | null
          channel?: string | null
          company_id?: string | null
          cost_date?: string | null
          cost_type?: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_costs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_costs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_costs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_column_presets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          industry_type: string
          is_system: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          industry_type: string
          is_system?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          industry_type?: string
          is_system?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_column_settings: {
        Row: {
          business_relevance: string | null
          column_key: string
          column_label: string
          column_type: string
          company_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          order_index: number
          required: boolean | null
          role_visibility: Json | null
          select_options: Json | null
          updated_at: string | null
          updated_by: string | null
          visible: boolean | null
          width: string | null
        }
        Insert: {
          business_relevance?: string | null
          column_key: string
          column_label: string
          column_type: string
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          order_index: number
          required?: boolean | null
          role_visibility?: Json | null
          select_options?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          visible?: boolean | null
          width?: string | null
        }
        Update: {
          business_relevance?: string | null
          column_key?: string
          column_label?: string
          column_type?: string
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          order_index?: number
          required?: boolean | null
          role_visibility?: Json | null
          select_options?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          visible?: boolean | null
          width?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_column_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_column_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_column_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_conversions: {
        Row: {
          conversion_rate: number
          created_at: string | null
          description: string | null
          from_unit: string
          id: string
          product_id: string
          to_unit: string
          updated_at: string | null
        }
        Insert: {
          conversion_rate: number
          created_at?: string | null
          description?: string | null
          from_unit: string
          id?: string
          product_id: string
          to_unit: string
          updated_at?: string | null
        }
        Update: {
          conversion_rate?: number
          created_at?: string | null
          description?: string | null
          from_unit?: string
          id?: string
          product_id?: string
          to_unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_conversions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allowed_forms: string[] | null
          branch_id: string | null
          business_code: string
          business_status: Database["public"]["Enums"]["business_status"] | null
          can_be_purchased: boolean | null
          can_be_sold: boolean | null
          category: Database["public"]["Enums"]["product_category"]
          company_id: string | null
          conversions: Json | null
          created_at: string | null
          created_by: string | null
          finished_product_code: string | null
          id: string
          input_quantity: number | null
          input_unit: string
          intermediate_units: string[] | null
          is_finished_product: boolean | null
          linked_finished_product_codes: string[] | null
          name: string
          output_quantity: number | null
          output_unit: string
          processed_to_finished_ratio: number | null
          promotion_code: string | null
          raw_to_processed_ratio: number | null
          recipe: Json | null
          status: Database["public"]["Enums"]["product_status"] | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          allowed_forms?: string[] | null
          branch_id?: string | null
          business_code: string
          business_status?:
            | Database["public"]["Enums"]["business_status"]
            | null
          can_be_purchased?: boolean | null
          can_be_sold?: boolean | null
          category: Database["public"]["Enums"]["product_category"]
          company_id?: string | null
          conversions?: Json | null
          created_at?: string | null
          created_by?: string | null
          finished_product_code?: string | null
          id?: string
          input_quantity?: number | null
          input_unit: string
          intermediate_units?: string[] | null
          is_finished_product?: boolean | null
          linked_finished_product_codes?: string[] | null
          name: string
          output_quantity?: number | null
          output_unit: string
          processed_to_finished_ratio?: number | null
          promotion_code?: string | null
          raw_to_processed_ratio?: number | null
          recipe?: Json | null
          status?: Database["public"]["Enums"]["product_status"] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          allowed_forms?: string[] | null
          branch_id?: string | null
          business_code?: string
          business_status?:
            | Database["public"]["Enums"]["business_status"]
            | null
          can_be_purchased?: boolean | null
          can_be_sold?: boolean | null
          category?: Database["public"]["Enums"]["product_category"]
          company_id?: string | null
          conversions?: Json | null
          created_at?: string | null
          created_by?: string | null
          finished_product_code?: string | null
          id?: string
          input_quantity?: number | null
          input_unit?: string
          intermediate_units?: string[] | null
          is_finished_product?: boolean | null
          linked_finished_product_codes?: string[] | null
          name?: string
          output_quantity?: number | null
          output_unit?: string
          processed_to_finished_ratio?: number | null
          promotion_code?: string | null
          raw_to_processed_ratio?: number | null
          recipe?: Json | null
          status?: Database["public"]["Enums"]["product_status"] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_channels: {
        Row: {
          code: string
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_channels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_items: {
        Row: {
          created_at: string | null
          discount: number | null
          id: string
          notes: string | null
          order_id: string
          product_code: string | null
          product_id: string | null
          product_name: string
          quantity: number
          total: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          order_id: string
          product_code?: string | null
          product_id?: string | null
          product_name: string
          quantity: number
          total: number
          unit?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          order_id?: string
          product_code?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          total?: number
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          branch_id: string | null
          channel_code: string | null
          channel_id: string | null
          commission_amount: number | null
          commission_rate: number | null
          commission_setting_id: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          debt_amount: number | null
          delivery_date: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          order_code: string
          order_date: string | null
          paid_amount: number | null
          payment_status: string | null
          salesperson_id: string | null
          shipping_fee: number | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          channel_code?: string | null
          channel_id?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          commission_setting_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          debt_amount?: number | null
          delivery_date?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_code: string
          order_date?: string | null
          paid_amount?: number | null
          payment_status?: string | null
          salesperson_id?: string | null
          shipping_fee?: number | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          channel_code?: string | null
          channel_id?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          commission_setting_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          debt_amount?: number | null
          delivery_date?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_code?: string
          order_date?: string | null
          paid_amount?: number | null
          payment_status?: string | null
          salesperson_id?: string | null
          shipping_fee?: number | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "sales_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_commission_setting_id_fkey"
            columns: ["commission_setting_id"]
            isOneToOne: false
            referencedRelation: "commission_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_records: {
        Row: {
          branch_id: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          date: string
          id: string
          product_id: string
          promotion_quantity: number | null
          sales_quantity: number | null
          status: string | null
          total_amount: number | null
          unit: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          date: string
          id?: string
          product_id: string
          promotion_quantity?: number | null
          sales_quantity?: number | null
          status?: string | null
          total_amount?: number | null
          unit: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          date?: string
          id?: string
          product_id?: string
          promotion_quantity?: number | null
          sales_quantity?: number | null
          status?: string | null
          total_amount?: number | null
          unit?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_records_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_targets: {
        Row: {
          achievement_rate: number | null
          actual_new_customers: number | null
          actual_orders: number | null
          actual_revenue: number | null
          branch_id: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          period_key: string
          period_type: string
          target_new_customers: number | null
          target_orders: number | null
          target_revenue: number
          target_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          achievement_rate?: number | null
          actual_new_customers?: number | null
          actual_orders?: number | null
          actual_revenue?: number | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          period_key: string
          period_type?: string
          target_new_customers?: number | null
          target_orders?: number | null
          target_revenue?: number
          target_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievement_rate?: number | null
          actual_new_customers?: number | null
          actual_orders?: number | null
          actual_revenue?: number | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          period_key?: string
          period_type?: string
          target_new_customers?: number | null
          target_orders?: number | null
          target_revenue?: number
          target_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_targets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_targets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      special_outbound_records: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approved_at: string | null
          approved_by: string | null
          branch_id: string | null
          company_id: string | null
          created_at: string | null
          date: string
          id: string
          product_id: string
          quantity: number
          reason: string
          rejection_reason: string | null
          requested_by: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          product_id: string
          quantity: number
          reason: string
          rejection_reason?: string | null
          requested_by: string
          unit: string
          updated_at?: string | null
        }
        Update: {
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          product_id?: string
          quantity?: number
          reason?: string
          rejection_reason?: string | null
          requested_by?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_outbound_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_outbound_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_outbound_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_check_items: {
        Row: {
          actual_quantity: number | null
          book_quantity: number | null
          created_at: string | null
          id: string
          notes: string | null
          product_id: string
          stock_check_id: string
          unit: string
          variance: number | null
        }
        Insert: {
          actual_quantity?: number | null
          book_quantity?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id: string
          stock_check_id: string
          unit: string
          variance?: number | null
        }
        Update: {
          actual_quantity?: number | null
          book_quantity?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          stock_check_id?: string
          unit?: string
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_check_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_check_items_stock_check_id_fkey"
            columns: ["stock_check_id"]
            isOneToOne: false
            referencedRelation: "stock_check_prints"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_check_prints: {
        Row: {
          branch_id: string | null
          check_date: string
          company_id: string | null
          created_at: string | null
          created_by: string
          id: string
          printed_at: string | null
          printed_by: string | null
          title: string
        }
        Insert: {
          branch_id?: string | null
          check_date: string
          company_id?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          printed_at?: string | null
          printed_by?: string | null
          title: string
        }
        Update: {
          branch_id?: string | null
          check_date?: string
          company_id?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          printed_at?: string | null
          printed_by?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_check_prints_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_check_prints_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_count_entries: {
        Row: {
          book_quantity: number
          branch_id: string | null
          company_id: string | null
          count_date: string
          count_type: string
          counted_quantity: number
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          product_id: string
          reconciled_at: string | null
          reconciled_by: string | null
          reconciliation_notes: string | null
          reconciliation_status: string | null
          unit: string
          updated_at: string | null
          updated_by: string | null
          variance: number | null
          variance_percentage: number | null
          warehouse_id: string | null
        }
        Insert: {
          book_quantity: number
          branch_id?: string | null
          company_id?: string | null
          count_date: string
          count_type?: string
          counted_quantity: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_notes?: string | null
          reconciliation_status?: string | null
          unit: string
          updated_at?: string | null
          updated_by?: string | null
          variance?: number | null
          variance_percentage?: number | null
          warehouse_id?: string | null
        }
        Update: {
          book_quantity?: number
          branch_id?: string | null
          company_id?: string | null
          count_date?: string
          count_type?: string
          counted_quantity?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_notes?: string | null
          reconciliation_status?: string | null
          unit?: string
          updated_at?: string | null
          updated_by?: string | null
          variance?: number | null
          variance_percentage?: number | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_count_entries_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_entries_reconciled_by_fkey"
            columns: ["reconciled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_entries_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_types: {
        Row: {
          color: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          impact_type: string | null
          is_active: boolean | null
          math_factor: number | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id: string
          impact_type?: string | null
          is_active?: boolean | null
          math_factor?: number | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          impact_type?: string | null
          is_active?: boolean | null
          math_factor?: number | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_types_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          bank_account_id: string | null
          branch_id: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          description: string | null
          id: string
          reference_number: string | null
          status: string | null
          transaction_code: string
          transaction_date: string
          transaction_type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          reference_number?: string | null
          status?: string | null
          transaction_code: string
          transaction_date?: string
          transaction_type: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          reference_number?: string | null
          status?: string | null
          transaction_code?: string
          transaction_date?: string
          transaction_type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          preferences: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          preferences?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          preferences?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          app_permissions: Json | null
          branch_id: string | null
          can_delete: boolean | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          position: string | null
          role: string
          staff_permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          app_permissions?: Json | null
          branch_id?: string | null
          can_delete?: boolean | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          position?: string | null
          role?: string
          staff_permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          app_permissions?: Json | null
          branch_id?: string | null
          can_delete?: boolean | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          position?: string | null
          role?: string
          staff_permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_role: {
        Args: { role_name: string; user_id: string }
        Returns: boolean
      }
      get_my_branch_id: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
      get_user_company_id: { Args: { user_id: string }; Returns: string }
      has_app_access: {
        Args: { app_name: string; user_id: string }
        Returns: boolean
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_admin_master: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected"
      business_status: "active" | "inactive"
      product_category: "fruit" | "dry_goods" | "processed" | "finished"
      product_status: "active" | "inactive"
      user_role:
        | "admin"
        | "branch_manager"
        | "staff"
        | "admin_master"
        | "admin_company"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      approval_status: ["pending", "approved", "rejected"],
      business_status: ["active", "inactive"],
      product_category: ["fruit", "dry_goods", "processed", "finished"],
      product_status: ["active", "inactive"],
      user_role: [
        "admin",
        "branch_manager",
        "staff",
        "admin_master",
        "admin_company",
      ],
    },
  },
} as const
