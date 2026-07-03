// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BudgetDraftView } from "@/features/budgets/components/BudgetDraftView";
import {
  type BudgetClientDetails,
  type BudgetClientItem,
} from "@/features/budgets/types/budget";
import type { ContactSuggestion } from "@/features/budgets/components/BudgetClientForm";
import { useState, type ComponentProps } from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/budgets",
}));

const mockContactSuggestions: ContactSuggestion[] = [
  {
    id: "1",
    name: "John Doe",
    fiscal_address_street: "123 Main St",
    fiscal_address_postal_code: "12345",
    fiscal_address_city: "Anytown",
    addresses: [
      {
        id: "1",
        street: "123 Main St",
        postal_code: "12345",
        city: "Anytown",
        label: null,
      },
    ],
  },
  {
    id: "2",
    name: "Jane Doe",
    fiscal_address_street: "456 Secondary St",
    fiscal_address_postal_code: "67890",
    fiscal_address_city: "Othertown",
    addresses: [
      {
        id: "2",
        street: "456 Secondary St",
        postal_code: "67890",
        city: "Othertown",
        label: null,
      },
    ],
  },
  {
    id: "3",
    name: "Mary Jones",
    fiscal_address_street: "789 Third St",
    fiscal_address_postal_code: "101112",
    fiscal_address_city: "Thirdtown",
    addresses: [],
  },
];

const emptyClientDetails: BudgetClientDetails = {
  nameOrCompany: "",
  quoteNumber: "",
  date: "",
  estimatedTime: "",
  taxRate: 0,
  lang: "ca",
};

function BudgetDraftViewWrapper({
  overrides,
  initialClientDetails = emptyClientDetails,
}: {
  overrides?: Partial<ComponentProps<typeof BudgetDraftView>>;
  initialClientDetails?: BudgetClientDetails;
}) {
  const [details, setDetails] = useState(initialClientDetails);
  return (
    <BudgetDraftView
      items={[]}
      clientDetails={details}
      onClientDetailsChange={setDetails}
      onItemChange={() => {}}
      onQuoteNumberChange={() => {}}
      onResetQuoteAutomation={() => {}}
      quoteManuallyEdited={false}
      {...overrides}
    />
  );
}

function stubContactSearchFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockContactSuggestions,
    })
  );
}

function stubContactFlowFetch(args: {
  contactDetails: Record<string, unknown>;
}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("/api/contacts/search")) {
        return {
          ok: true,
          json: async () => [
            {
              ...mockContactSuggestions[0],
              name: "Luciana",
              fiscal_address_street: "Fiscal 9",
              fiscal_address_postal_code: "17001",
              fiscal_address_city: "Girona",
            },
          ],
        } as Response;
      }

      if (url === "/api/contacts/1") {
        return {
          ok: true,
          json: async () => args.contactDetails,
        } as Response;
      }

      return {
        ok: false,
        json: async () => null,
      } as Response;
    })
  );
}

function renderBudgetDraftViewWithState(
  overrides?: Partial<ComponentProps<typeof BudgetDraftView>>
) {
  render(<BudgetDraftViewWrapper overrides={overrides} />);
}

function renderBudgetDraftView(
  nameOrCompany: string,
  items: BudgetClientItem[],
  overrides?: Partial<ComponentProps<typeof BudgetDraftView>>
) {
  render(
    <BudgetDraftView
      items={items}
      clientDetails={{
        nameOrCompany,
        quoteNumber: "",
        date: "",
        estimatedTime: "",
        taxRate: 0,
        lang: "ca",
      }}
      onClientDetailsChange={() => {}}
      onItemChange={() => {}}
      onQuoteNumberChange={() => {}}
      onResetQuoteAutomation={() => {}}
      quoteManuallyEdited={false}
      {...overrides}
    />
  );
}

describe("Create budget", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("shows contact suggestions when user types a name", async () => {
    stubContactSearchFetch();
    renderBudgetDraftViewWithState();
    fireEvent.click(screen.getByRole("button", { name: "Editar dades" }));
    fireEvent.change(
      screen.getByPlaceholderText("Ex: Maria Vila / Pintures Puig"),
      { target: { value: "John" } }
    );

    await waitFor(
      () => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });
  it("fills the form when user selects a contact", async () => {
    stubContactSearchFetch();
    const onContactSelect = vi.fn();
    renderBudgetDraftViewWithState({ onContactSelect });
    fireEvent.click(screen.getByRole("button", { name: "Editar dades" }));
    fireEvent.change(
      screen.getByPlaceholderText("Ex: Maria Vila / Pintures Puig"),
      { target: { value: "John" } }
    );

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("John Doe"));
    expect(onContactSelect).toHaveBeenCalledWith("1");
    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("123 Main St").length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByDisplayValue("12345").length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue("Anytown").length).toBeGreaterThan(0);
  });
  it("save button is disabled when name/company is empty", () => {
    renderBudgetDraftView("", []);
    expect(
      screen.getByRole("button", { name: "Guardar pressupost" })
    ).toBeDisabled();
  });

  it("save button is enabled when name/company is filled", () => {
    renderBudgetDraftView("Test Name", []);
    expect(
      screen.getByRole("button", { name: "Guardar pressupost" })
    ).toBeEnabled();
  });
  it("user can remove a line item", () => {
    const onItemRemove = vi.fn();
    const item = {
      id: "1",
      title: "Test Item",
      description: "Test Description",
      total: 100,
    };

    renderBudgetDraftView("Test Name", [item], { onItemRemove });
    fireEvent.click(screen.getByRole("button", { name: "Eliminar Test Item" }));
    expect(onItemRemove).toHaveBeenCalledWith("1");
  });

  it("mirrors job address for new contacts with no fiscal data until the checkbox is touched", async () => {
    render(
      <BudgetDraftViewWrapper
        initialClientDetails={{
          nameOrCompany: "Luciana",
          quoteNumber: "",
          date: "",
          estimatedTime: "",
          taxRate: 0,
          lang: "ca",
          jobAddressStreet: "Obra 1",
          jobAddressPostalCode: "08001",
          jobAddressCity: "Barcelona",
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Editar dades" }));

    expect(screen.getByLabelText("Carrer i número")).toHaveValue("Obra 1");
    expect(
      screen.getByLabelText("Adreça fiscal (carrer i número)")
    ).toHaveValue("Obra 1");
    expect(screen.getByLabelText("Codi postal")).toHaveValue("08001");
    expect(screen.getByLabelText("Codi postal fiscal")).toHaveValue("08001");
    expect(screen.getByLabelText("Població")).toHaveValue("Barcelona");
    expect(screen.getByLabelText("Població fiscal")).toHaveValue("Barcelona");
    expect(
      screen.getByRole("checkbox", {
        name: "La direcció fiscal és diferent de l'adreça de l'obra",
      })
    ).not.toBeChecked();

    fireEvent.change(screen.getByLabelText("Carrer i número"), {
      target: { value: "Obra 2" },
    });
    fireEvent.change(screen.getByLabelText("Codi postal"), {
      target: { value: "08002" },
    });
    fireEvent.change(screen.getByLabelText("Població"), {
      target: { value: "Girona" },
    });

    expect(
      screen.getByLabelText("Adreça fiscal (carrer i número)")
    ).toHaveValue("Obra 2");
    expect(screen.getByLabelText("Codi postal fiscal")).toHaveValue("08002");
    expect(screen.getByLabelText("Població fiscal")).toHaveValue("Girona");

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "La direcció fiscal és diferent de l'adreça de l'obra",
      })
    );
    expect(
      screen.getByRole("checkbox", {
        name: "La direcció fiscal és diferent de l'adreça de l'obra",
      })
    ).toBeChecked();

    fireEvent.change(screen.getByLabelText("Carrer i número"), {
      target: { value: "Obra 3" },
    });

    expect(
      screen.getByLabelText("Adreça fiscal (carrer i número)")
    ).toHaveValue("Obra 2");
  });

  it("loads contact fiscal data, starts checked, and does not react to later job edits", async () => {
    stubContactFlowFetch({
      contactDetails: {
        id: "1",
        name: "Luciana",
        phone: null,
        email: null,
        tax_id: "L12345678",
        fiscal_address_street: "Fiscal 9",
        fiscal_address_postal_code: "17001",
        fiscal_address_city: "Girona",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });

    render(
      <BudgetDraftViewWrapper
        initialClientDetails={{
          nameOrCompany: "",
          quoteNumber: "",
          date: "",
          estimatedTime: "",
          taxRate: 0,
          lang: "ca",
          jobAddressStreet: "Obra 1",
          jobAddressPostalCode: "08001",
          jobAddressCity: "Barcelona",
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Editar dades" }));
    fireEvent.change(
      screen.getByPlaceholderText("Ex: Maria Vila / Pintures Puig"),
      { target: { value: "Luciana" } }
    );

    await waitFor(() => {
      expect(screen.getByText("Luciana")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Luciana"));

    const checkbox = screen.getByRole("checkbox", {
      name: "La direcció fiscal és diferent de l'adreça de l'obra",
    });

    await waitFor(() => {
      expect(screen.getByLabelText("NIF/NIE")).toHaveValue("L12345678");
      expect(
        screen.getByLabelText("Adreça fiscal (carrer i número)")
      ).toHaveValue("Fiscal 9");
      expect(screen.getByLabelText("Codi postal fiscal")).toHaveValue("17001");
      expect(screen.getByLabelText("Població fiscal")).toHaveValue("Girona");
      expect(checkbox).toBeChecked();
    });

    fireEvent.change(screen.getByLabelText("Carrer i número"), {
      target: { value: "Obra 2" },
    });

    expect(
      screen.getByLabelText("Adreça fiscal (carrer i número)")
    ).toHaveValue("Fiscal 9");
    expect(screen.getByLabelText("Codi postal fiscal")).toHaveValue("17001");
    expect(screen.getByLabelText("Població fiscal")).toHaveValue("Girona");
  });

  it("only copies job address into fiscal fields when unchecking", async () => {
    stubContactFlowFetch({
      contactDetails: {
        id: "1",
        name: "Luciana",
        phone: null,
        email: null,
        tax_id: "L12345678",
        fiscal_address_street: "Fiscal 9",
        fiscal_address_postal_code: "17001",
        fiscal_address_city: "Girona",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });

    render(
      <BudgetDraftViewWrapper
        initialClientDetails={{
          nameOrCompany: "",
          quoteNumber: "",
          date: "",
          estimatedTime: "",
          taxRate: 0,
          lang: "ca",
          jobAddressStreet: "Obra 1",
          jobAddressPostalCode: "08001",
          jobAddressCity: "Barcelona",
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Editar dades" }));
    fireEvent.change(
      screen.getByPlaceholderText("Ex: Maria Vila / Pintures Puig"),
      { target: { value: "Luciana" } }
    );

    await waitFor(() => {
      expect(screen.getByText("Luciana")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Luciana"));

    const checkbox = screen.getByRole("checkbox", {
      name: "La direcció fiscal és diferent de l'adreça de l'obra",
    });
    await waitFor(() => expect(checkbox).toBeChecked());

    fireEvent.change(screen.getByLabelText("Carrer i número"), {
      target: { value: "Obra 2" },
    });
    expect(
      screen.getByLabelText("Adreça fiscal (carrer i número)")
    ).toHaveValue("Fiscal 9");

    fireEvent.click(checkbox);
    await waitFor(() => expect(checkbox).not.toBeChecked());
    expect(
      screen.getByLabelText("Adreça fiscal (carrer i número)")
    ).toHaveValue("Obra 2");

    fireEvent.click(checkbox);
    await waitFor(() => expect(checkbox).toBeChecked());
    expect(
      screen.getByLabelText("Adreça fiscal (carrer i número)")
    ).toHaveValue("Obra 2");
  });
});
