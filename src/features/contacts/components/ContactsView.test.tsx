// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ContactsView } from "@/features/contacts/components/ContactsView";
import type { ContactWithFlags } from "@/features/contacts/lib/contacts";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh,
    replace: vi.fn(),
  }),
}));

vi.mock("@/features/contacts/lib/contactsClient", () => ({
  deleteContact: vi.fn(),
}));

import { deleteContact } from "@/features/contacts/lib/contactsClient";

const deletableContact: ContactWithFlags = {
  id: "contact-1",
  name: "Anna Test",
  phone: null,
  email: null,
  tax_id: null,
  fiscal_address_street: null,
  fiscal_address_postal_code: null,
  fiscal_address_city: null,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  hasNoBudgetsOrInvoices: true,
};

const protectedContact: ContactWithFlags = {
  ...deletableContact,
  id: "contact-2",
  name: "Credeos",
  hasNoBudgetsOrInvoices: false,
};

const secondContact: ContactWithFlags = {
  ...deletableContact,
  id: "contact-3",
  name: "Berta Test",
};

const mockContacts: ContactWithFlags[] = [deletableContact, secondContact];

function renderView(contacts: ContactWithFlags[] = mockContacts) {
  return render(<ContactsView contacts={contacts} />);
}

describe("ContactsView", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders Nom and Accions columns with a selection column", () => {
    renderView();

    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveTextContent("Seleccionar");
    expect(headers[1]).toHaveTextContent("Nom");
    expect(headers[2]).toHaveTextContent("Accions");
    expect(screen.queryByText("Ciutat")).not.toBeInTheDocument();
    expect(screen.queryByText("NIF")).not.toBeInTheDocument();
  });

  it("shows selected count when two checkboxes are checked", () => {
    renderView();

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Seleccionar Anna Test" })
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Seleccionar Berta Test" })
    );

    expect(screen.getByText("2 seleccionats")).toBeInTheDocument();
  });

  it("opens the confirmation dialog when delete is clicked", async () => {
    renderView([deletableContact]);

    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar contacte" })
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Eliminar contacte?")).toBeInTheDocument();
    });
  });

  it("disables delete button when contact has budgets or invoices", () => {
    renderView([protectedContact]);

    const deleteBtn = screen.getByRole("button", { name: "Eliminar contacte" });
    expect(deleteBtn).toBeDisabled();
    expect(deleteBtn.parentElement).toHaveAttribute(
      "title",
      "No es pot eliminar: té pressupostos o factures associades"
    );
  });

  it("enables delete button without title when contact has no budgets or invoices", () => {
    renderView([deletableContact]);

    const deleteBtn = screen.getByRole("button", { name: "Eliminar contacte" });
    expect(deleteBtn).toBeEnabled();
    expect(deleteBtn.parentElement).not.toHaveAttribute("title");
  });

  it("shows delete error from deleteContact in an alert", async () => {
    vi.mocked(deleteContact).mockRejectedValue(
      new Error(
        "No es pot eliminar: el contacte té pressupostos o factures associades."
      )
    );

    renderView([deletableContact]);

    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar contacte" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "No es pot eliminar: el contacte té pressupostos o factures associades."
      );
    });

    expect(refresh).not.toHaveBeenCalled();
  });
});
