/**
 * Maps budget_line title/description/unit into invoice_line fields.
 * invoice_lines has a single `description` (no separate title), so title and
 * description are combined when both are present.
 */
export function mapBudgetLineToInvoiceLineContent(line: {
  title: string | null;
  description: string | null;
  unit: string | null;
}): { description: string; unit: string | null } {
  const title = (line.title ?? "").trim() || "Partida";
  const description = (line.description ?? "").trim();

  return {
    description: description ? `${title}\n\n${description}` : title,
    unit: line.unit,
  };
}
