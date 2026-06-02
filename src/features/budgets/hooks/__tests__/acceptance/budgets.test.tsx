// @vitest-environment jsdom

import { BudgetListRow } from "@/features/budgets/types/budgetsDb";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BudgetsView } from "@/features/budgets/components/BudgetsView";
import { BudgetDraftView } from "@/features/budgets/components/BudgetDraftView";
import {
  type BudgetClientDetails,
  type BudgetClientItem,
} from "@/features/budgets/types/budget";
import type { ContactSuggestion } from "@/features/budgets/components/BudgetClientForm";
import { useState } from "react";

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
      screen.getByRole("heading", {
        name: "Cap resultat amb aquests filtres.",
      })
    ).toBeInTheDocument();
  });
});

const emptyClientDetails: BudgetClientDetails = {
  nameOrCompany: "",
  quoteNumber: "",
  date: "",
  estimatedTime: "",
  lang: "ca",
};

function BudgetDraftViewWrapper({
  overrides,
}: {
  overrides?: Partial<React.ComponentProps<typeof BudgetDraftView>>;
}) {
  const [details, setDetails] = useState(emptyClientDetails);
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

function renderBudgetDraftViewWithState(
  overrides?: Partial<React.ComponentProps<typeof BudgetDraftView>>
) {
  render(<BudgetDraftViewWrapper overrides={overrides} />);
}

function renderBudgetDraftView(
  nameOrCompany: string,
  items: BudgetClientItem[],
  overrides?: Partial<React.ComponentProps<typeof BudgetDraftView>>
) {
  render(
    <BudgetDraftView
      items={items}
      clientDetails={{
        nameOrCompany,
        quoteNumber: "",
        date: "",
        estimatedTime: "",
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
    expect(screen.getByDisplayValue("123 Main St")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12345")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Anytown")).toBeInTheDocument();
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
});

describe("Edit budget", () => {
  it("loads existing budget data correctly");
  it("user can add line items with AI");
  it("user can change budget status");
  it("saves changes correctly");
});
