"use client";

import { useMemo, useRef, useState, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";
import type {
  BudgetRow,
  ClientRow,
  BudgetLineRow,
  BudgetStatus,
} from "@/lib/budgets";
import { buildAutoQuoteNumber } from "@/lib/generateQuoteNumber";
import { BudgetDraftView } from "@/components/BudgetDraftView";
import { BudgetAIInput } from "@/components/BudgetAIInput";
import { updateBudgetWithLines } from "@/lib/budgets";
import { useGenerateBudgetDraft } from "@/hooks/useGenerateBudgetDraft";
import { budgetLinesToClientItems } from "@/lib/budgetLineToClientItem";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function normalizeBudgetStatus(value: string | null | undefined): BudgetStatus {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "sent") return "sent";
  if (v === "approved") return "approved";
  return "draft";
}

function normalizeUnitLabel(
  value: string | null | undefined
): BudgetClientItem["unitLabel"] {
  const v = (value ?? "").trim();
  if (v === "m²" || v === "unitat" || v === "partida") return v;
  return "partida";
}

export function BudgetEditView({
  budget,
  client,
  lines,
}: {
  budget: BudgetRow;
  client: ClientRow;
  lines: BudgetLineRow[];
}) {
  const router = useRouter();
  const { submit, loading, formError } = useGenerateBudgetDraft();

  const initialClient: BudgetClientDetails = useMemo(
    () => ({
      nameOrCompany: (client.name ?? "").trim(),
      email: (client.email ?? "").trim(),
      address: (budget.job_address ?? client.address ?? "").trim(),
      quoteNumber: (budget.quote_number ?? "").trim(),
      date: (budget.document_date ?? "").trim(),
      estimatedTime: (budget.estimated_time ?? "").trim(),
    }),
    [
      budget.document_date,
      budget.estimated_time,
      budget.job_address,
      budget.quote_number,
      client.address,
      client.email,
      client.name,
    ]
  );

  const initialItems: BudgetClientItem[] = useMemo(
    () =>
      lines.map((l) => ({
        id: l.id,
        title: (l.title ?? "").trim() || "Partida",
        description: (l.description ?? "").trim(),
        quantity: l.quantity ?? 1,
        unitLabel: normalizeUnitLabel(l.unit),
        unitPrice: l.unit_price ?? 0,
        total: l.line_total ?? round2((l.quantity ?? 1) * (l.unit_price ?? 0)),
      })),
    [lines]
  );

  const [clientDetails, setClientDetails] =
    useState<BudgetClientDetails>(initialClient);
  const [items, setItems] = useState<BudgetClientItem[]>(initialItems);

  // In edit mode, avoid auto-overwriting quote numbers unless the user explicitly resets.
  const [quoteManuallyEdited, setQuoteManuallyEdited] = useState(true);
  const quoteManuallyEditedRef = useRef(true);

  function setClientWithAutoQuote(action: SetStateAction<BudgetClientDetails>) {
    setClientDetails((prev) => {
      const next =
        typeof action === "function"
          ? (action as (p: BudgetClientDetails) => BudgetClientDetails)(prev)
          : action;
      const nameOrDateChanged =
        next.nameOrCompany !== prev.nameOrCompany || next.date !== prev.date;
      if (!quoteManuallyEditedRef.current && nameOrDateChanged) {
        return {
          ...next,
          quoteNumber: buildAutoQuoteNumber(next.nameOrCompany, next.date),
        };
      }
      return next;
    });
  }

  function handleQuoteNumberChange(value: string) {
    setQuoteManuallyEdited(true);
    quoteManuallyEditedRef.current = true;
    setClientDetails((prev) => ({ ...prev, quoteNumber: value }));
  }

  function handleResetQuoteAutomation() {
    setQuoteManuallyEdited(false);
    quoteManuallyEditedRef.current = false;
    setClientDetails((prev) => ({
      ...prev,
      quoteNumber: buildAutoQuoteNumber(prev.nameOrCompany, prev.date),
    }));
  }

  async function handleSave({
    client,
    items,
  }: {
    client: BudgetClientDetails;
    items: BudgetClientItem[];
    subtotal: number;
  }) {
    await updateBudgetWithLines({
      budgetId: budget.id,
      clientId: budget.client_id,
      client,
      items,
      taxRate: budget.tax_rate ?? 0,
      status: normalizeBudgetStatus(budget.status),
    });
    router.push(`/budgets/${budget.id}`);
  }

  return (
    <BudgetDraftView
      mode="edit"
      items={items}
      clientDetails={clientDetails}
      onClientDetailsChange={setClientWithAutoQuote}
      onItemChange={(id, patch) => {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
        );
      }}
      onItemRemove={(id) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }}
      itemsFooter={
        <BudgetAIInput
          loading={loading}
          formError={formError}
          submitLabel="Afegir"
          placeholder="Escriu el que vols afegir… (p. ex. Pintar passadís 8 m² + reparar esquerdes)"
          onSubmit={async (description) => {
            const lines = await submit(description);
            if (!lines) return false;
            setItems((prev) => [...prev, ...budgetLinesToClientItems(lines)]);
            return true;
          }}
        />
      }
      quoteManuallyEdited={quoteManuallyEdited}
      onQuoteNumberChange={handleQuoteNumberChange}
      onResetQuoteAutomation={handleResetQuoteAutomation}
      onBack={() => router.push(`/budgets/${budget.id}`)}
      onSave={handleSave}
    />
  );
}
