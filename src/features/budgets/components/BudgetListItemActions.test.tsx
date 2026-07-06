// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import type { ComponentProps } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BudgetListItemActions } from "@/features/budgets/components/BudgetListItemActions";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh,
    replace: vi.fn(),
  }),
}));

function renderActions(
  overrides: Partial<ComponentProps<typeof BudgetListItemActions>> = {}
) {
  return render(
    <BudgetListItemActions
      budgetId="budget-1"
      budgetStatus="draft"
      budgetLang="ca"
      invoiceId={null}
      clientName="Test Client"
      clientTaxId={null}
      clientAddressStreet={null}
      clientAddressPostalCode={null}
      clientAddressCity={null}
      taxRate={null}
      variant="icons"
      {...overrides}
    />
  );
}

function mockFetchSequence(responses: Array<{ ok: boolean; json: unknown }>) {
  let call = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(() => {
      const response = responses[call] ?? responses[responses.length - 1]!;
      call += 1;
      return Promise.resolve({
        ok: response.ok,
        json: async () => response.json,
      });
    })
  );
}

describe("BudgetListItemActions — orphan contact dialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    refresh.mockClear();
  });

  it("keeps the orphan-contact dialog open after deleting the budget, instead of unmounting with the row", async () => {
    // DELETE /api/budgets/budget-1 -> pending_confirmation
    mockFetchSequence([
      {
        ok: true,
        json: { contactStatus: "pending_confirmation", contactId: "contact-1" },
      },
    ]);

    renderActions();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar pressupost" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    // The second dialog must appear and stay visible.
    await waitFor(() => {
      expect(
        screen.getByText("Eliminar contacte sense dades?")
      ).toBeInTheDocument();
    });

    // Crucially: router.refresh() must NOT have been called yet — refreshing
    // here would unmount the row (and this dialog) before the user answers.
    expect(refresh).not.toHaveBeenCalled();
  });

  it("refreshes the list after confirming deletion of the orphan contact", async () => {
    mockFetchSequence([
      {
        ok: true,
        json: { contactStatus: "pending_confirmation", contactId: "contact-1" },
      },
      { ok: true, json: {} }, // DELETE /api/contacts/contact-1
    ]);

    renderActions();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar pressupost" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => {
      expect(
        screen.getByText("Eliminar contacte sense dades?")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Eliminar contacte" }));

    await waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1);
    });
  });

  it("refreshes the list after choosing to keep the orphan contact (the bug: this used to never refresh)", async () => {
    mockFetchSequence([
      {
        ok: true,
        json: { contactStatus: "pending_confirmation", contactId: "contact-1" },
      },
    ]);

    renderActions();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar pressupost" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => {
      expect(
        screen.getByText("Eliminar contacte sense dades?")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Mantenir" }));

    await waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1);
    });
  });

  it("refreshes immediately when the contact is auto-deleted (no second dialog)", async () => {
    mockFetchSequence([
      {
        ok: true,
        json: { contactStatus: "deleted_orphan", contactId: "contact-1" },
      },
    ]);

    renderActions();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar pressupost" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.queryByText("Eliminar contacte sense dades?")
    ).not.toBeInTheDocument();
  });

  it("shows missing invoice requirements when tax id, fiscal address or VAT are missing", () => {
    renderActions({ variant: "full" });

    expect(
      screen.getByText("Falta: NIF/NIE, adreca fiscal completa, IVA")
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Generar factura" })).toBeDisabled();
  });

  it("enables invoicing when fiscal data and VAT are present", () => {
    renderActions({
      variant: "full",
      clientTaxId: "B12345678",
      clientAddressStreet: "Carrer Major, 1",
      clientAddressPostalCode: "08001",
      clientAddressCity: "Barcelona",
      taxRate: 0,
    });

    expect(screen.queryByText(/^Falta:/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generar factura" })).toBeEnabled();
  });
});
