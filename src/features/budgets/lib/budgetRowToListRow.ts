import type { BudgetListRow, BudgetRow } from "@/features/budgets/types/budgetsDb";

export function budgetRowToListRow(row: BudgetRow): BudgetListRow {
  return {
    id: row.id,
    title: row.title,
    job_address: row.job_address,
    job_address_street: row.job_address_street,
    job_address_postal_code: row.job_address_postal_code,
    job_address_city: row.job_address_city,
    client_tax_id: row.client_tax_id,
    client_address_street: row.client_address_street,
    client_address_postal_code: row.client_address_postal_code,
    client_address_city: row.client_address_city,
    tax_rate: row.tax_rate,
    status: row.status,
    document_date: row.document_date,
    quote_number: row.quote_number,
    created_at: row.created_at,
    lang: row.lang,
    invoice_id: null,
  };
}
