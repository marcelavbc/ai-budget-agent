import { describe, it, expect } from "vitest";
import { budgetRowToListRow } from "./budgetRowToListRow";
import { createMockBudgetRow } from "@/features/budgets/test/fixtures/budgetEditRows";

const mockRowData = {
  id: "123",
  title: "Test Budget",
  job_address: "123 Main St",
  job_address_street: "Main St",
  job_address_postal_code: "12345",
  job_address_city: "Anytown",
  status: "draft",
  document_date: "2021-01-01",
  quote_number: "1234567890",
  created_at: "2021-01-01",
  lang: "en",
};
describe("budgetRowToListRow", () => {
  it("converts a BudgetRow to a BudgetListRow", () => {
    const input = createMockBudgetRow(mockRowData);
    const result = budgetRowToListRow(input);
    expect(result).toEqual({
      ...mockRowData,
      client_tax_id: input.client_tax_id,
      client_address_street: input.client_address_street,
      client_address_postal_code: input.client_address_postal_code,
      client_address_city: input.client_address_city,
      tax_rate: input.tax_rate,
      invoice_id: null,
    });
  });
});
