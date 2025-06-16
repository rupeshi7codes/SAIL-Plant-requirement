import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export { supabase }

export type Database = {
  public: {
    Tables: {
      purchase_orders: {
        Row: {
          id: string
          user_id: string
          po_number: string
          po_date: string
          area_of_application: string
          items: any[]
          pdf_file_url: string | null
          pdf_file_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          po_number: string
          po_date: string
          area_of_application: string
          items: any[]
          pdf_file_url?: string | null
          pdf_file_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          po_number?: string
          po_date?: string
          area_of_application?: string
          items?: any[]
          pdf_file_url?: string | null
          pdf_file_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      requirements: {
        Row: {
          id: string
          user_id: string
          po_number: string
          area_of_application: string
          delivery_date: string
          priority: string
          status: string
          notes: string | null
          selected_items: any[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          po_number: string
          area_of_application: string
          delivery_date: string
          priority: string
          status: string
          notes?: string | null
          selected_items: any[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          po_number?: string
          area_of_application?: string
          delivery_date?: string
          priority?: string
          status?: string
          notes?: string | null
          selected_items?: any[]
          created_at?: string
          updated_at?: string
        }
      }
      supply_history: {
        Row: {
          id: string
          user_id: string
          req_id: string
          po_number: string
          material_name: string
          quantity: number
          date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          req_id: string
          po_number: string
          material_name: string
          quantity: number
          date: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          req_id?: string
          po_number?: string
          material_name?: string
          quantity?: number
          date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
