import type {
  BudgetLineRow,
  BudgetRow,
  ContactRow,
} from "@/features/budgets/types/budgetsDb";

export function createMockBudgetRow(
  overrides: Partial<BudgetRow> = {}
): BudgetRow {
  return {
    id: "1",
    title: "Pressupost test",
    status: "draft",
    lang: "ca",
    subtotal: 100,
    tax_amount: 21,
    tax_rate: 21,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    client_id: "1",
    contact_id: "1",
    document_date: "2026-01-01",
    estimated_time: "1 hour",
    job_address: "123 Main St",
    job_address_street: "123 Main St",
    job_address_postal_code: "12345",
    job_address_city: "Anytown",
    notes: "Test notes",
    quote_number: "1234567890",
    ...overrides,
  };
}

export function createMockContactRow(
  overrides: Partial<ContactRow> = {}
): ContactRow {
  return {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "605678905",
    fiscal_address_street: null,
    fiscal_address_postal_code: null,
    fiscal_address_city: null,
    tax_id: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  };
}

export function createMockBudgetLineRow(
  overrides: Partial<BudgetLineRow> = {}
): BudgetLineRow {
  return {
    id: "line-1",
    budget_id: "1",
    title: "Test Item",
    description: "Test Description",
    quantity: 1,
    unit_price: 100,
    line_total: 100,
    created_at: "2026-01-01",
    option_group_id: null,
    option_label: null,
    sort_order: 1,
    unit: null,
    ...overrides,
  };
}

/** Default budget row for edit-view / controller tests. */
export const mockBudgetRow = createMockBudgetRow();

/** Default contact row paired with {@link mockBudgetRow}. */
export const mockContactRow = createMockContactRow();

/** Default line row paired with {@link mockBudgetRow}. */
export const mockBudgetLineRow = createMockBudgetLineRow();
