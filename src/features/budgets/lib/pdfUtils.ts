import type { BudgetClientDetails, BudgetClientItem } from "@/features/budgets/types/budget";

export function buildPdfFilename(
  client: BudgetClientDetails,
  lang: "ca" | "es"
): string {
  const slug = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

  const prefix = lang === "es" ? "Presupuesto" : "Pressupost";
  const name = slug(client.nameOrCompany.trim());
  const quote = slug(client.quoteNumber.trim());

  if (name && quote) return `${prefix}-${name}-${quote}.pdf`;
  if (name) return `${prefix}-${name}.pdf`;
  if (quote) return `${prefix}-${quote}.pdf`;
  return `${prefix}.pdf`;
}

export async function translateItemsForPdf(
  items: BudgetClientItem[],
  lang: "ca" | "es"
): Promise<BudgetClientItem[]> {
  if (items.length === 0) return items;
  try {
    const res = await fetch("/api/translate-budget-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, targetLang: lang }),
    });
    if (!res.ok) return items;
    const data = (await res.json()) as unknown;
    if (typeof data !== "object" || data === null) return items;
    const maybeItems = (data as { items?: unknown }).items;
    return Array.isArray(maybeItems) ? (maybeItems as BudgetClientItem[]) : items;
  } catch {
    return items;
  }
}
