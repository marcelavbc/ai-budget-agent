// @vitest-environment jsdom

import { BudgetListRow } from "@/features/budgets/types/budgetsDb";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BudgetsView } from "@/features/budgets/components/BudgetsView";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/budgets",
}));
const mockBudgets: BudgetListRow[] = [
  {
    id: "1",
    title: "Budget 1",
    job_address: "123 Main St",
    status: "draft",
    document_date: "2021-01-01",
    quote_number: "1234567890",
    created_at: "2021-01-01",
    lang: "ca",
  },
  {
    id: "2",
    title: "Budget 2",
    job_address: "456 Secondary St",
    status: "sent",
    document_date: "2024-04-01",
    quote_number: "0987654321",
    created_at: "2024-04-01",
    lang: "es",
  },
];
describe("Budget list", () => {
  it("displays all budgets", () => {
    render(<BudgetsView budgets={mockBudgets} />);
    expect(screen.getAllByText("Budget 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Budget 2").length).toBeGreaterThan(0);
  });
  it("shows empty state when no budgets match filters", () => {
    render(<BudgetsView budgets={[]} />);
    expect(
      screen.getByText("Cap resultat amb aquests filtres.")
    ).toBeInTheDocument();
  });
});

describe("Create budget", () => {
  it("generates line items from AI when user submits a description");
  it("shows contact suggestions when user types a name");
  it("fills the form when user selects a contact");
  it("save button is disabled when name/company is empty");
  it("switches to edit mode after first save");
  it("user can remove a line item");
});

describe("Edit budget", () => {
  it("loads existing budget data correctly");
  it("user can add line items with AI");
  it("user can change budget status");
  it("saves changes correctly");
});
