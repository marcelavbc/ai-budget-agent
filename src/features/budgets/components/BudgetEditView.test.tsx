// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BudgetEditView } from "@/features/budgets/components/BudgetEditView";
import {
  mockBudgetLineRow,
  mockBudgetRow,
  mockContactRow,
} from "@/features/budgets/test/fixtures/budgetEditRows";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/budgets/1",
}));
describe("Edit budget", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("loads existing budget data correctly", () => {
    render(
      <BudgetEditView
        budget={mockBudgetRow}
        contact={mockContactRow}
        lines={[mockBudgetLineRow]}
      />
    );
    expect(
      screen.getByRole("heading", { name: "Editar pressupost" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Editar dades" }));
    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("123 Main St").length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByDisplayValue("12345").length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue("Anytown").length).toBeGreaterThan(0);
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
        budget={mockBudgetRow}
        contact={mockContactRow}
        lines={[mockBudgetLineRow]}
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
  it("shows read-only budget status", () => {
    render(
      <BudgetEditView
        budget={mockBudgetRow}
        contact={mockContactRow}
        lines={[mockBudgetLineRow]}
      />
    );
    expect(screen.getByText("Pressupost")).toBeInTheDocument();
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
        budget={mockBudgetRow}
        contact={mockContactRow}
        lines={[mockBudgetLineRow]}
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
