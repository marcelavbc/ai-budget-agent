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

describe("BudgetListItemActions - orphan contact dialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    refresh.mockClear();
  });

  it("keeps orphan-contact dialog open after deleting the budget", async () => {
    mockFetchSequence([
      {
        ok: true,
        json: { contactStatus: "pending_confirmation", contactId: "contact-1" },
      },
    ]);

    renderActions();

    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar pressupost" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => {
      expect(
        screen.getByText("Eliminar contacte sense dades?")
      ).toBeInTheDocument();
    });

    expect(refresh).not.toHaveBeenCalled();
  });

  it("refreshes list after confirming orphan contact deletion", async () => {
    mockFetchSequence([
      {
        ok: true,
        json: { contactStatus: "pending_confirmation", contactId: "contact-1" },
      },
      { ok: true, json: {} },
    ]);

    renderActions();

    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar pressupost" })
    );
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

  it("refreshes list after choosing to keep orphan contact", async () => {
    mockFetchSequence([
      {
        ok: true,
        json: { contactStatus: "pending_confirmation", contactId: "contact-1" },
      },
    ]);

    renderActions();

    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar pressupost" })
    );
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

  it("refreshes immediately when orphan contact is auto-deleted", async () => {
    mockFetchSequence([
      {
        ok: true,
        json: { contactStatus: "deleted_orphan", contactId: "contact-1" },
      },
    ]);

    renderActions();

    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar pressupost" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.queryByText("Eliminar contacte sense dades?")
    ).not.toBeInTheDocument();
  });
});
