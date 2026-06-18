import type { BudgetClientDetails, BudgetClientItem } from "@/features/budgets/types/budget";
import type { BudgetLineRow, BudgetRow } from "@/features/budgets/types/budgetsDb";
import type { ContactRow } from "@/features/contacts/lib/contacts";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function normalizeUnitLabel(
  value: string | null | undefined
): BudgetClientItem["unitLabel"] {
  const v = (value ?? "").trim();
  if (v === "m²" || v === "unitat" || v === "partida") return v;
  return "partida";
}

export function buildInitialBudgetEditClientDetails(args: {
  budget: BudgetRow;
  contact: ContactRow;
}): BudgetClientDetails {
  const { budget, contact } = args;
  const jobStreet = (budget.job_address_street ?? "").trim();
  const jobPostal = (budget.job_address_postal_code ?? "").trim();
  const jobCity = (budget.job_address_city ?? "").trim();
  const legacyJobAddress = (budget.job_address ?? "").trim();

  return {
    nameOrCompany: (contact.name ?? "").trim(),
    jobAddressStreet:
      jobStreet || (jobPostal || jobCity ? "" : legacyJobAddress),
    jobAddressPostalCode: jobPostal,
    jobAddressCity: jobCity,
    projectName: (budget.project_name ?? "").trim() || undefined,
    quoteNumber: (budget.quote_number ?? "").trim(),
    date: (budget.document_date ?? "").trim(),
    estimatedTime: (budget.estimated_time ?? "").trim(),
    lang: (budget.lang === "es" ? "es" : "ca") as "ca" | "es",
  };
}

export function buildInitialBudgetEditItems(args: {
  lines: BudgetLineRow[];
}): BudgetClientItem[] {
  const { lines } = args;
  return lines.map((l) => ({
    id: l.id,
    title: (l.title ?? "").trim() || "Partida",
    description: (l.description ?? "").trim(),
    quantity: l.quantity ?? 1,
    unitLabel: normalizeUnitLabel(l.unit),
    unitPrice: l.unit_price ?? 0,
    total: l.line_total ?? round2((l.quantity ?? 1) * (l.unit_price ?? 0)),
    optionGroupId: (l.option_group_id ?? undefined) || undefined,
    optionLabel: (l.option_label ?? undefined) || undefined,
  }));
}

