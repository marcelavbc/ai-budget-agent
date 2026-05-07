export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          tax_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          tax_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          tax_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          client_id: string | null;
          title: string | null;
          job_address: string | null;
          status: string | null;
          issue_date: string | null;
          document_date: string | null;
          notes: string | null;
          subtotal: number | null;
          tax_rate: number | null;
          tax_amount: number | null;
          created_at: string | null;
          updated_at: string | null;
          quote_number: string | null;
          estimated_time: string | null;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          title?: string | null;
          job_address?: string | null;
          status?: string | null;
          issue_date?: string | null;
          document_date?: string | null;
          notes?: string | null;
          subtotal?: number | null;
          tax_rate?: number | null;
          tax_amount?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          quote_number?: string | null;
          estimated_time?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          title?: string | null;
          job_address?: string | null;
          status?: string | null;
          issue_date?: string | null;
          document_date?: string | null;
          notes?: string | null;
          subtotal?: number | null;
          tax_rate?: number | null;
          tax_amount?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          quote_number?: string | null;
          estimated_time?: string | null;
        };
        Relationships: [];
      };
      budget_lines: {
        Row: {
          id: string;
          budget_id: string;
          title: string | null;
          description: string | null;
          quantity: number | null;
          unit: string | null;
          unit_price: number | null;
          line_total: number | null;
          option_group_id: string | null;
          option_label: string | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          budget_id: string;
          title?: string | null;
          description?: string | null;
          quantity?: number | null;
          unit?: string | null;
          unit_price?: number | null;
          line_total?: number | null;
          option_group_id?: string | null;
          option_label?: string | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          budget_id?: string;
          title?: string | null;
          description?: string | null;
          quantity?: number | null;
          unit?: string | null;
          unit_price?: number | null;
          line_total?: number | null;
          option_group_id?: string | null;
          option_label?: string | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          budget_id: string | null;
          client_id: string | null;
          invoice_number: string | null;
          status: string;
          issue_date: string | null;
          due_date: string | null;
          notes: string | null;
          job_address: string | null;
          subtotal: number;
          tax_rate: number;
          tax_amount: number;
          total: number;
          pricing_mode: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          budget_id?: string | null;
          client_id?: string | null;
          invoice_number?: string | null;
          status?: string;
          issue_date?: string | null;
          due_date?: string | null;
          notes?: string | null;
          job_address?: string | null;
          subtotal?: number;
          tax_rate?: number;
          tax_amount?: number;
          total?: number;
          pricing_mode?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          budget_id?: string | null;
          client_id?: string | null;
          invoice_number?: string | null;
          status?: string;
          issue_date?: string | null;
          due_date?: string | null;
          notes?: string | null;
          job_address?: string | null;
          subtotal?: number;
          tax_rate?: number;
          tax_amount?: number;
          total?: number;
          pricing_mode?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          id: boolean;
          owner_name: string | null;
          owner_address: string | null;
          owner_postal_city: string | null;
          owner_nif: string | null;
          bank_iban: string | null;
          bank_name: string | null;
        };
        Insert: {
          id?: boolean;
          owner_name?: string | null;
          owner_address?: string | null;
          owner_postal_city?: string | null;
          owner_nif?: string | null;
          bank_iban?: string | null;
          bank_name?: string | null;
        };
        Update: {
          id?: boolean;
          owner_name?: string | null;
          owner_address?: string | null;
          owner_postal_city?: string | null;
          owner_nif?: string | null;
          bank_iban?: string | null;
          bank_name?: string | null;
        };
        Relationships: [];
      };
      invoice_lines: {
        Row: {
          id: string;
          invoice_id: string;
          description: string | null;
          quantity: number | null;
          unit_price: number | null;
          subtotal: number | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          description?: string | null;
          quantity?: number | null;
          unit_price?: number | null;
          subtotal?: number | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          description?: string | null;
          quantity?: number | null;
          unit_price?: number | null;
          subtotal?: number | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_invoice_from_budget: {
        Args: {
          p_budget_id: string;
          p_pricing_mode: string;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Row"];

export type TablesInsert<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Insert"];

export type TablesUpdate<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Update"];

