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

const mockContacts: ContactWithFlags[] = [
  {
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
  },
];

function renderView() {
  return render(<ContactsView contacts={mockContacts} />);
}

describe("ContactsView", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders only Nom and Accions columns", () => {
    renderView();

    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(2);
    expect(headers[0]).toHaveTextContent("Nom");
    expect(headers[1]).toHaveTextContent("Accions");
    expect(screen.queryByText("Ciutat")).not.toBeInTheDocument();
    expect(screen.queryByText("NIF")).not.toBeInTheDocument();
  });

  it("opens the confirmation dialog when delete is clicked", async () => {
    renderView();

    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar contacte" })
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Eliminar contacte?")).toBeInTheDocument();
    });
  });

  it("shows delete error from deleteContact in an alert", async () => {
    vi.mocked(deleteContact).mockRejectedValue(
      new Error(
        "No es pot eliminar: el contacte té pressupostos o factures associades."
      )
    );

    renderView();

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
