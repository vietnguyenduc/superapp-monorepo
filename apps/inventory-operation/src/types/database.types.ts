export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

type PublicSchema = {
    Tables: {
        users: {
            Row: {
                id: string
                email: string
                full_name: string | null
                role: string
                company_id: string | null
                branch_id: string | null
                staff_permissions: Json | null
                app_permissions: Json | null
                is_active: boolean | null
                created_at: string | null
                updated_at: string | null
            }
            Insert: {
                id?: string
                email: string
                full_name?: string | null
                role?: string
                company_id?: string | null
                branch_id?: string | null
                staff_permissions?: Json | null
                app_permissions?: Json | null
                is_active?: boolean | null
                created_at?: string | null
                updated_at?: string | null
            }
            Update: {
                id?: string
                email?: string
                full_name?: string | null
                role?: string
                company_id?: string | null
                branch_id?: string | null
                staff_permissions?: Json | null
                app_permissions?: Json | null
                is_active?: boolean | null
                created_at?: string | null
                updated_at?: string | null
            }
            Relationships: []
        }
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
        branches: {
            Row: {
                id: string
                name: string
                code: string
                company_id: string | null
                is_active: boolean | null
                created_at: string | null
                updated_at: string | null
            }
            Insert: {
                id?: string
                name: string
                code: string
                company_id?: string | null
                is_active?: boolean | null
                created_at?: string | null
                updated_at?: string | null
            }
            Update: {
                id?: string
                name?: string
                code?: string
                company_id?: string | null
                is_active?: boolean | null
                created_at?: string | null
                updated_at?: string | null
            }
            Relationships: [
                {
                    foreignKeyName: "branches_company_id_fkey"
                    columns: ["company_id"]
                    isOneToOne: false
                    referencedRelation: "companies"
                    referencedColumns: ["id"]
                }
            ]
        }
        products: {
            Row: {
                id: string
                category: string
                business_code: string
                promotion_code: string | null
                name: string
                is_finished_product: boolean | null
                output_quantity: number | null
                input_quantity: number | null
                finished_product_code: string | null
                input_unit: string
                output_unit: string
                status: string | null
                business_status: string | null
                company_id: string | null
                branch_id: string | null
                created_at: string | null
                updated_at: string | null
                created_by: string | null
                updated_by: string | null
            }
            Insert: {
                id?: string
                category: string
                business_code: string
                promotion_code?: string | null
                name: string
                is_finished_product?: boolean | null
                output_quantity?: number | null
                input_quantity?: number | null
                finished_product_code?: string | null
                input_unit: string
                output_unit: string
                status?: string | null
                business_status?: string | null
                company_id?: string | null
                branch_id?: string | null
                created_at?: string | null
                updated_at?: string | null
                created_by?: string | null
                updated_by?: string | null
            }
            Update: {
                id?: string
                category?: string
                business_code?: string
                promotion_code?: string | null
                name?: string
                is_finished_product?: boolean | null
                output_quantity?: number | null
                input_quantity?: number | null
                finished_product_code?: string | null
                input_unit?: string
                output_unit?: string
                status?: string | null
                business_status?: string | null
                company_id?: string | null
                branch_id?: string | null
                created_at?: string | null
                updated_at?: string | null
                created_by?: string | null
                updated_by?: string | null
            }
            Relationships: []
        }
        product_conversions: {
            Row: {
                id: string
                product_id: string
                from_unit: string
                to_unit: string
                conversion_rate: number
                description: string | null
                created_at: string | null
                updated_at: string | null
            }
            Insert: {
                id?: string
                product_id: string
                from_unit: string
                to_unit: string
                conversion_rate: number
                description?: string | null
                created_at?: string | null
                updated_at?: string | null
            }
            Update: {
                id?: string
                product_id?: string
                from_unit?: string
                to_unit?: string
                conversion_rate?: number
                description?: string | null
                created_at?: string | null
                updated_at?: string | null
            }
            Relationships: [
                {
                    foreignKeyName: "product_conversions_product_id_fkey"
                    columns: ["product_id"]
                    isOneToOne: false
                    referencedRelation: "products"
                    referencedColumns: ["id"]
                }
            ]
        }
        inventory_records: {
            Row: {
                id: string
                date: string
                product_id: string
                input_quantity: number | null
                actual_quantity: number | null
                unit: string
                unit_price: number | null
                total_amount: number | null
                supplier_id: string | null
                status: string | null
                company_id: string | null
                branch_id: string | null
                created_at: string | null
                updated_at: string | null
                created_by: string | null
                updated_by: string | null
            }
            Insert: {
                id?: string
                date: string
                product_id: string
                input_quantity?: number | null
                actual_quantity?: number | null
                unit: string
                unit_price?: number | null
                total_amount?: number | null
                supplier_id?: string | null
                status?: string | null
                company_id?: string | null
                branch_id?: string | null
                created_at?: string | null
                updated_at?: string | null
                created_by?: string | null
                updated_by?: string | null
            }
            Update: {
                id?: string
                date?: string
                product_id?: string
                input_quantity?: number | null
                actual_quantity?: number | null
                unit?: string
                unit_price?: number | null
                total_amount?: number | null
                supplier_id?: string | null
                status?: string | null
                company_id?: string | null
                branch_id?: string | null
                created_at?: string | null
                updated_at?: string | null
                created_by?: string | null
                updated_by?: string | null
            }
            Relationships: [
                {
                    foreignKeyName: "inventory_records_product_id_fkey"
                    columns: ["product_id"]
                    isOneToOne: false
                    referencedRelation: "products"
                    referencedColumns: ["id"]
                }
            ]
        }
        sales_records: {
            Row: {
                id: string
                date: string
                product_id: string
                sales_quantity: number | null
                promotion_quantity: number | null
                unit: string
                customer_id: string | null
                status: string | null
                company_id: string | null
                branch_id: string | null
                created_at: string | null
                updated_at: string | null
                created_by: string | null
                updated_by: string | null
            }
            Insert: {
                id?: string
                date: string
                product_id: string
                sales_quantity?: number | null
                promotion_quantity?: number | null
                unit: string
                customer_id?: string | null
                status?: string | null
                company_id?: string | null
                branch_id?: string | null
                created_at?: string | null
                updated_at?: string | null
                created_by?: string | null
                updated_by?: string | null
            }
            Update: {
                id?: string
                date?: string
                product_id?: string
                sales_quantity?: number | null
                promotion_quantity?: number | null
                unit?: string
                customer_id?: string | null
                status?: string | null
                company_id?: string | null
                branch_id?: string | null
                created_at?: string | null
                updated_at?: string | null
                created_by?: string | null
                updated_by?: string | null
            }
            Relationships: [
                {
                    foreignKeyName: "sales_records_product_id_fkey"
                    columns: ["product_id"]
                    isOneToOne: false
                    referencedRelation: "products"
                    referencedColumns: ["id"]
                }
            ]
        }
        special_outbound_records: {
            Row: {
                id: string
                date: string
                product_id: string
                quantity: number
                unit: string
                reason: string
                approval_status: string | null
                requested_by: string
                approved_by: string | null
                approved_at: string | null
                rejection_reason: string | null
                company_id: string | null
                branch_id: string | null
                created_at: string | null
                updated_at: string | null
            }
            Insert: {
                id?: string
                date: string
                product_id: string
                quantity: number
                unit: string
                reason: string
                approval_status?: string | null
                requested_by: string
                approved_by?: string | null
                approved_at?: string | null
                rejection_reason?: string | null
                company_id?: string | null
                branch_id?: string | null
                created_at?: string | null
                updated_at?: string | null
            }
            Update: {
                id?: string
                date?: string
                product_id?: string
                quantity?: number
                unit?: string
                reason?: string
                approval_status?: string | null
                requested_by?: string
                approved_by?: string | null
                approved_at?: string | null
                rejection_reason?: string | null
                company_id?: string | null
                branch_id?: string | null
                created_at?: string | null
                updated_at?: string | null
            }
            Relationships: [
                {
                    foreignKeyName: "special_outbound_records_product_id_fkey"
                    columns: ["product_id"]
                    isOneToOne: false
                    referencedRelation: "products"
                    referencedColumns: ["id"]
                }
            ]
        }
        inventory_reports: {
            Row: {
                id: string
                date: string
                product_id: string
                opening_balance: number | null
                input_quantity: number | null
                output_quantity: number | null
                closing_balance: number | null
                book_balance: number | null
                actual_balance: number | null
                variance: number | null
                unit: string
                company_id: string | null
                branch_id: string | null
                created_at: string | null
                updated_at: string | null
                created_by: string | null
            }
            Insert: {
                id?: string
                date: string
                product_id: string
                opening_balance?: number | null
                input_quantity?: number | null
                output_quantity?: number | null
                closing_balance?: number | null
                book_balance?: number | null
                actual_balance?: number | null
                variance?: number | null
                unit: string
                company_id?: string | null
                branch_id?: string | null
                created_at?: string | null
                updated_at?: string | null
                created_by?: string | null
            }
            Update: {
                id?: string
                date?: string
                product_id?: string
                opening_balance?: number | null
                input_quantity?: number | null
                output_quantity?: number | null
                closing_balance?: number | null
                book_balance?: number | null
                actual_balance?: number | null
                variance?: number | null
                unit?: string
                company_id?: string | null
                branch_id?: string | null
                created_at?: string | null
                updated_at?: string | null
                created_by?: string | null
            }
            Relationships: [
                {
                    foreignKeyName: "inventory_reports_product_id_fkey"
                    columns: ["product_id"]
                    isOneToOne: false
                    referencedRelation: "products"
                    referencedColumns: ["id"]
                }
            ]
        }
        stock_check_prints: {
            Row: {
                id: string
                check_date: string
                title: string
                company_id: string | null
                branch_id: string | null
                created_at: string | null
                created_by: string
                printed_at: string | null
                printed_by: string | null
            }
            Insert: {
                id?: string
                check_date: string
                title: string
                company_id?: string | null
                branch_id?: string | null
                created_at?: string | null
                created_by: string
                printed_at?: string | null
                printed_by?: string | null
            }
            Update: {
                id?: string
                check_date?: string
                title?: string
                company_id?: string | null
                branch_id?: string | null
                created_at?: string | null
                created_by?: string
                printed_at?: string | null
                printed_by?: string | null
            }
            Relationships: []
        }
        stock_check_items: {
            Row: {
                id: string
                stock_check_id: string
                product_id: string
                book_quantity: number | null
                actual_quantity: number | null
                variance: number | null
                unit: string
                notes: string | null
                created_at: string | null
            }
            Insert: {
                id?: string
                stock_check_id: string
                product_id: string
                book_quantity?: number | null
                actual_quantity?: number | null
                variance?: number | null
                unit: string
                notes?: string | null
                created_at?: string | null
            }
            Update: {
                id?: string
                stock_check_id?: string
                product_id?: string
                book_quantity?: number | null
                actual_quantity?: number | null
                variance?: number | null
                unit?: string
                notes?: string | null
                created_at?: string | null
            }
            Relationships: [
                {
                    foreignKeyName: "stock_check_items_stock_check_id_fkey"
                    columns: ["stock_check_id"]
                    isOneToOne: false
                    referencedRelation: "stock_check_prints"
                    referencedColumns: ["id"]
                },
                {
                    foreignKeyName: "stock_check_items_product_id_fkey"
                    columns: ["product_id"]
                    isOneToOne: false
                    referencedRelation: "products"
                    referencedColumns: ["id"]
                }
            ]
        }
        approval_logs: {
            Row: {
                id: string
                record_type: string
                record_id: string
                action: string
                status: string
                comment: string | null
                user_id: string
                user_name: string
                user_role: string
                created_at: string | null
            }
            Insert: {
                id?: string
                record_type: string
                record_id: string
                action: string
                status: string
                comment?: string | null
                user_id: string
                user_name: string
                user_role: string
                created_at?: string | null
            }
            Update: {
                id?: string
                record_type?: string
                record_id?: string
                action?: string
                status?: string
                comment?: string | null
                user_id?: string
                user_name?: string
                user_role?: string
                created_at?: string | null
            }
            Relationships: []
        }
    }
    Views: {}
    Functions: {}
    Enums: {
        product_category: "fruit" | "dry_goods" | "processed" | "finished"
        product_status: "active" | "inactive"
        business_status: "active" | "inactive"
        approval_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {}
}

export type Tables<T extends keyof PublicSchema["Tables"]> =
    PublicSchema["Tables"][T] extends { Row: infer R } ? R : never
export type Inserts<T extends keyof PublicSchema["Tables"]> =
    PublicSchema["Tables"][T] extends { Insert: infer I } ? I : never
export type Updates<T extends keyof PublicSchema["Tables"]> =
    PublicSchema["Tables"][T] extends { Update: infer U } ? U : never

export type Product = Tables<"products">
export type InventoryRecord = Tables<"inventory_records">
export type SalesRecord = Tables<"sales_records">
export type SpecialOutboundRecord = Tables<"special_outbound_records">
export type InventoryReport = Tables<"inventory_reports">
export type StockCheckPrint = Tables<"stock_check_prints">
export type StockCheckItem = Tables<"stock_check_items">
export type ProductConversion = Tables<"product_conversions">
export type ApprovalLog = Tables<"approval_logs">
export type UserRow = Tables<"users">
export type Company = Tables<"companies">
export type Branch = Tables<"branches">
