import type { BudgetClientDetails } from "@/features/budgets/types/budget";

export function buildPdfFilename(client: BudgetClientDetails): string {
  const slug = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

  const prefix = client.lang === "es" ? "Presupuesto" : "Pressupost";
  const name = slug(client.nameOrCompany.trim());
  const quote = slug(client.quoteNumber.trim());

  if (name && quote) return `${prefix}-${name}-${quote}.pdf`;
  if (name) return `${prefix}-${name}.pdf`;
  if (quote) return `${prefix}-${quote}.pdf`;
  return `${prefix}.pdf`;
}
