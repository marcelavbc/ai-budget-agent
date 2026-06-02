// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BudgetEditView } from "@/features/budgets/components/BudgetEditView";
import type {
  BudgetLineRow,
  BudgetRow,
  ContactRow,
} from "@/features/budgets/types/budgetsDb";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/budgets/1",
}));

const mockBudget: BudgetRow = {
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
};

const mockContact: ContactRow = {
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
};

const mockLine: BudgetLineRow = {
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
};
describe("Edit budget", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("loads existing budget data correctly", () => {
    render(
      <BudgetEditView
        budget={mockBudget}
        contact={mockContact}
        lines={[mockLine]}
      />
    );
    expect(
      screen.getByRole("heading", { name: "Editar pressupost" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Editar dades" }));
    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("123 Main St")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12345")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Anytown")).toBeInTheDocument();
  });
  it("user can add line items with AI", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          lines: [
            {
              id: "new-1",
              type: "custom",
              label: "Pintar passadís 20 m²",
              quantity: 1,
              unitLabel: "partida",
              unitPrice: 0,
              subtotal: 0,
              pricingMode: "input",
            },
          ],
        }),
      })
    );
    render(
      <BudgetEditView
        budget={mockBudget}
        contact={mockContact}
        lines={[mockLine]}
      />
    );
    const input = screen.getByPlaceholderText(
      "Escriu el que vols afegir… (p. ex. Pintar passadís 8 m² + reparar esquerdes)"
    );
    fireEvent.change(input, {
      target: { value: "Pintar passadís 20 m²" },
    });
    const button = screen.getByRole("button", { name: "Afegir" });
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText("Pintar passadís 20 m²")).toBeInTheDocument();
    });
  });
  it("user can change budget status", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })
    );
    render(
      <BudgetEditView
        budget={mockBudget}
        contact={mockContact}
        lines={[mockLine]}
      />
    );
    const statusPill = screen.getByRole("button", {
      name: "Canviar estat del pressupost",
    });
    fireEvent.click(statusPill);
    expect(statusPill).toHaveTextContent("Enviat");
  });
  it("saves changes correctly", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })
    );
    render(
      <BudgetEditView
        budget={mockBudget}
        contact={mockContact}
        lines={[mockLine]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Editar dades" }));

    fireEvent.change(
      screen.getByPlaceholderText("Ex: Maria Vila / Pintures Puig"),
      { target: { value: "John" } }
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar canvis" }));
    expect(fetch).toHaveBeenCalledWith(
      "/api/budgets/1",
      expect.objectContaining({ method: "PUT" })
    );
  });
});
