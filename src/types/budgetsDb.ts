import type { Tables } from "@/types/supabase";

export type BudgetRow = Tables<"budgets">;
export type BudgetLineRow = Tables<"budget_lines">;
export type ClientRow = Tables<"clients">;

export type BudgetListRow = Pick<
  BudgetRow,
  | "id"
  | "title"
  | "job_address"
  | "status"
  | "document_date"
  | "quote_number"
  | "created_at"
>;

export type RecentBudgetActivityRow = {
  id: string;
  status: string | null;
  created_at: string | null;
  client: { name: string | null } | { name: string | null }[] | null;
};

