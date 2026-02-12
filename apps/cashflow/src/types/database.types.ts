export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            companies: {
                Row: {
                    id: string
                    name: string
                    code: string
                    logo_url: string | null
                    is_active: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    code: string
                    logo_url?: string | null
                    is_active?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    code?: string
                    logo_url?: string | null
                    is_active?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            bank_accounts: {
                Row: {
                    account_name: string
                    account_number: string
                    balance: number | null
                    bank_name: string
                    branch_id: string | null
                    company_id: string | null
                    created_at: string | null
                    id: string
                    is_active: boolean | null
                    updated_at: string | null
                }
                Insert: {
                    account_name: string
                    account_number: string
                    balance?: number | null
                    bank_name: string
                    branch_id?: string | null
                    company_id?: string | null
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    updated_at?: string | null
                }
                Update: {
                    account_name?: string
                    account_number?: string
                    balance?: number | null
                    bank_name?: string
                    branch_id?: string | null
                    company_id?: string | null
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    updated_at?: string | null
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
                ]
            }
            branches: {
                Row: {
                    address: string | null
                    code: string
                    company_id: string | null
                    created_at: string | null
                    email: string | null
                    id: string
                    is_active: boolean | null
                    manager_id: string | null
                    name: string
                    phone: string | null
                    updated_at: string | null
                }
                Insert: {
                    address?: string | null
                    code: string
                    company_id?: string | null
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    is_active?: boolean | null
                    manager_id?: string | null
                    name: string
                    phone?: string | null
                    updated_at?: string | null
                }
                Update: {
                    address?: string | null
                    code?: string
                    company_id?: string | null
                    created_at?: string | null
                    email?: string | null
                    id?: string
                    is_active?: boolean | null
                    manager_id?: string | null
                    name?: string
                    phone?: string | null
                    updated_at?: string | null
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
                        foreignKeyName: "fk_branches_manager"
                        columns: ["manager_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            customers: {
                Row: {
                    address: string | null
                    branch_id: string | null
                    company_id: string | null
                    created_at: string | null
                    customer_code: string
                    email: string | null
                    full_name: string
                    id: string
                    is_active: boolean | null
                    last_transaction_date: string | null
                    phone: string | null
                    total_balance: number | null
                    updated_at: string | null
                }
                Insert: {
                    address?: string | null
                    branch_id?: string | null
                    company_id?: string | null
                    created_at?: string | null
                    customer_code: string
                    email?: string | null
                    full_name: string
                    id?: string
                    is_active?: boolean | null
                    last_transaction_date?: string | null
                    phone?: string | null
                    total_balance?: number | null
                    updated_at?: string | null
                }
                Update: {
                    address?: string | null
                    branch_id?: string | null
                    company_id?: string | null
                    created_at?: string | null
                    customer_code?: string
                    email?: string | null
                    full_name?: string
                    id?: string
                    is_active?: boolean | null
                    last_transaction_date?: string | null
                    phone?: string | null
                    total_balance?: number | null
                    updated_at?: string | null
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
                    transaction_code: string
                    transaction_date: string
                    transaction_type: string
                    updated_at: string | null
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
                    transaction_code: string
                    transaction_date?: string
                    transaction_type: string
                    updated_at?: string | null
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
                    transaction_code?: string
                    transaction_date?: string
                    transaction_type?: string
                    updated_at?: string | null
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
                ]
            }
            users: {
                Row: {
                    branch_id: string | null
                    created_at: string | null
                    email: string
                    full_name: string | null
                    id: string
                    phone: string | null
                    position: string | null
                    role: string
                    updated_at: string | null
                }
                Insert: {
                    branch_id?: string | null
                    created_at?: string | null
                    email: string
                    full_name?: string | null
                    id: string
                    phone?: string | null
                    position?: string | null
                    role?: string
                    updated_at?: string | null
                }
                Update: {
                    branch_id?: string | null
                    created_at?: string | null
                    email?: string
                    full_name?: string | null
                    id?: string
                    phone?: string | null
                    position?: string | null
                    role?: string
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
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience type aliases
export type Company = Tables<'companies'>
export type CompanyInsert = TablesInsert<'companies'>
export type CompanyUpdate = TablesUpdate<'companies'>

export type Branch = Tables<'branches'>
export type BranchInsert = TablesInsert<'branches'>
export type BranchUpdate = TablesUpdate<'branches'>

export type User = Tables<'users'>
export type UserInsert = TablesInsert<'users'>
export type UserUpdate = TablesUpdate<'users'>

export type BankAccount = Tables<'bank_accounts'>
export type BankAccountInsert = TablesInsert<'bank_accounts'>
export type BankAccountUpdate = TablesUpdate<'bank_accounts'>

export type Customer = Tables<'customers'>
export type CustomerInsert = TablesInsert<'customers'>
export type CustomerUpdate = TablesUpdate<'customers'>

export type Transaction = Tables<'transactions'>
export type TransactionInsert = TablesInsert<'transactions'>
export type TransactionUpdate = TablesUpdate<'transactions'>
