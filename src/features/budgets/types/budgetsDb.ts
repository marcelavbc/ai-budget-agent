import type { Tables } from "@/core/types/supabase";

export type BudgetRow = Tables<"budgets">;
export type BudgetLineRow = Tables<"budget_lines">;
export type ClientRow = Tables<"clients">;
export type ContactRow = Tables<"contacts">;

export type BudgetListRow = Pick<
  BudgetRow,
  | "id"
  | "title"
  | "job_address"
  | "status"
  | "document_date"
  | "quote_number"
  | "created_at"
  | "lang"
> &
  Partial<
    Pick<
      BudgetRow,
      "job_address_street" | "job_address_postal_code" | "job_address_city"
    >
  > & {
    invoice_id?: string | null;
  };

