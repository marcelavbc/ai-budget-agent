export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      budget_lines: {
        Row: {
          budget_id: string;
          created_at: string;
          description: string;
          id: string;
          line_total: number;
          option_group_id: string | null;
          option_label: string | null;
          quantity: number;
          sort_order: number;
          title: string;
          unit: string | null;
          unit_price: number;
        };
        Insert: {
          budget_id: string;
          created_at?: string;
          description?: string;
          id?: string;
          line_total?: number;
          option_group_id?: string | null;
          option_label?: string | null;
          quantity?: number;
          sort_order?: number;
          title?: string;
          unit?: string | null;
          unit_price?: number;
        };
        Update: {
          budget_id?: string;
          created_at?: string;
          description?: string;
          id?: string;
          line_total?: number;
          option_group_id?: string | null;
          option_label?: string | null;
          quantity?: number;
          sort_order?: number;
          title?: string;
          unit?: string | null;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "budget_lines_budget_id_fkey";
            columns: ["budget_id"];
            isOneToOne: false;
            referencedRelation: "budgets";
            referencedColumns: ["id"];
          },
        ];
      };
      budgets: {
        Row: {
          client_address_city: string | null;
          client_address_postal_code: string | null;
          client_address_street: string | null;
          client_name: string | null;
          client_tax_id: string | null;
          contact_id: string | null;
          created_at: string;
          document_date: string | null;
          estimated_time: string | null;
          id: string;
          job_address: string | null;
          job_address_city: string | null;
          job_address_postal_code: string | null;
          job_address_street: string | null;
          lang: string;
          notes: string | null;
          project_name: string | null;
          quote_number: string | null;
          status: string;
          subtotal: number;
          tax_amount: number;
          tax_rate: number | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          client_address_city?: string | null;
          client_address_postal_code?: string | null;
          client_address_street?: string | null;
          client_name?: string | null;
          client_tax_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          document_date?: string | null;
          estimated_time?: string | null;
          id?: string;
          job_address?: string | null;
          job_address_city?: string | null;
          job_address_postal_code?: string | null;
          job_address_street?: string | null;
          lang?: string;
          notes?: string | null;
          project_name?: string | null;
          quote_number?: string | null;
          status?: string;
          subtotal?: number;
          tax_amount?: number;
          tax_rate?: number | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          client_address_city?: string | null;
          client_address_postal_code?: string | null;
          client_address_street?: string | null;
          client_name?: string | null;
          client_tax_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          document_date?: string | null;
          estimated_time?: string | null;
          id?: string;
          job_address?: string | null;
          job_address_city?: string | null;
          job_address_postal_code?: string | null;
          job_address_street?: string | null;
          lang?: string;
          notes?: string | null;
          project_name?: string | null;
          quote_number?: string | null;
          status?: string;
          subtotal?: number;
          tax_amount?: number;
          tax_rate?: number | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_addresses: {
        Row: {
          city: string | null;
          contact_id: string;
          created_at: string;
          id: string;
          label: string | null;
          postal_code: string | null;
          street: string | null;
        };
        Insert: {
          city?: string | null;
          contact_id: string;
          created_at?: string;
          id?: string;
          label?: string | null;
          postal_code?: string | null;
          street?: string | null;
        };
        Update: {
          city?: string | null;
          contact_id?: string;
          created_at?: string;
          id?: string;
          label?: string | null;
          postal_code?: string | null;
          street?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contact_addresses_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          created_at: string;
          email: string | null;
          fiscal_address_city: string | null;
          fiscal_address_postal_code: string | null;
          fiscal_address_street: string | null;
          id: string;
          name: string;
          phone: string | null;
          tax_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          fiscal_address_city?: string | null;
          fiscal_address_postal_code?: string | null;
          fiscal_address_street?: string | null;
          id?: string;
          name: string;
          phone?: string | null;
          tax_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          fiscal_address_city?: string | null;
          fiscal_address_postal_code?: string | null;
          fiscal_address_street?: string | null;
          id?: string;
          name?: string;
          phone?: string | null;
          tax_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoice_lines: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          invoice_id: string;
          quantity: number;
          sort_order: number;
          subtotal: number;
          unit: string | null;
          unit_price: number;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          invoice_id: string;
          quantity?: number;
          sort_order?: number;
          subtotal?: number;
          unit?: string | null;
          unit_price?: number;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          invoice_id?: string;
          quantity?: number;
          sort_order?: number;
          subtotal?: number;
          unit?: string | null;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          budget_id: string | null;
          client_address_city: string | null;
          client_address_postal_code: string | null;
          client_address_street: string | null;
          client_name: string | null;
          client_tax_id: string | null;
          contact_id: string | null;
          created_at: string;
          due_date: string | null;
          id: string;
          invoice_number: string | null;
          issue_date: string;
          job_address: string | null;
          lang: string;
          notes: string | null;
          pricing_mode: string;
          project_name: string | null;
          status: string;
          subtotal: number;
          tax_amount: number;
          tax_rate: number;
          total: number;
          updated_at: string;
        };
        Insert: {
          budget_id?: string | null;
          client_address_city?: string | null;
          client_address_postal_code?: string | null;
          client_address_street?: string | null;
          client_name?: string | null;
          client_tax_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          invoice_number?: string | null;
          issue_date?: string;
          job_address?: string | null;
          lang?: string;
          notes?: string | null;
          pricing_mode?: string;
          project_name?: string | null;
          status?: string;
          subtotal?: number;
          tax_amount?: number;
          tax_rate?: number;
          total?: number;
          updated_at?: string;
        };
        Update: {
          budget_id?: string | null;
          client_address_city?: string | null;
          client_address_postal_code?: string | null;
          client_address_street?: string | null;
          client_name?: string | null;
          client_tax_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          invoice_number?: string | null;
          issue_date?: string;
          job_address?: string | null;
          lang?: string;
          notes?: string | null;
          pricing_mode?: string;
          project_name?: string | null;
          status?: string;
          subtotal?: number;
          tax_amount?: number;
          tax_rate?: number;
          total?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_budget_id_fkey";
            columns: ["budget_id"];
            isOneToOne: false;
            referencedRelation: "budgets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: {
          bank_iban: string | null;
          bank_name: string | null;
          default_tax_rate: number | null;
          id: boolean;
          owner_address: string | null;
          owner_city: string | null;
          owner_name: string | null;
          owner_nif: string | null;
          owner_postal_code: string | null;
        };
        Insert: {
          bank_iban?: string | null;
          bank_name?: string | null;
          default_tax_rate?: number | null;
          id?: boolean;
          owner_address?: string | null;
          owner_city?: string | null;
          owner_name?: string | null;
          owner_nif?: string | null;
          owner_postal_code?: string | null;
        };
        Update: {
          bank_iban?: string | null;
          bank_name?: string | null;
          default_tax_rate?: number | null;
          id?: boolean;
          owner_address?: string | null;
          owner_city?: string | null;
          owner_name?: string | null;
          owner_nif?: string | null;
          owner_postal_code?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_invoice_from_budget: {
        Args: {
          p_budget_id: string;
          p_due_date?: string;
          p_issue_date?: string;
          p_pricing_mode: string;
          p_tax_rate?: number;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
