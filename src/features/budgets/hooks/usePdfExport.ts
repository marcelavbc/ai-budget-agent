import { useCallback, useState } from "react";
import type { BudgetClientDetails, BudgetClientItem } from "@/features/budgets/types/budget";

function buildPdfFilename(
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

async function translateItemsForPdf(
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

export function usePdfExport() {
  const [generating, setGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const exportPdf = useCallback(
    async (args: {
      client: BudgetClientDetails;
      items: BudgetClientItem[];
      lang: "ca" | "es";
    }) => {
      if (generating) return;
      setGenerating(true);
      setPdfError(null);
      try {
        const finalItems = await translateItemsForPdf(args.items, args.lang);
        const { generateBudgetPdf } = await import("@/features/budgets/lib/generateBudgetPdf");
        const blob = await generateBudgetPdf({
          client: args.client,
          items: finalItems,
          lang: args.lang,
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = buildPdfFilename(args.client, args.lang);
        a.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      } catch (e) {
        setPdfError(
          e instanceof Error
            ? e.message
            : "No s'ha pogut generar el PDF. Torna-ho a provar."
        );
      } finally {
        setGenerating(false);
      }
    },
    [generating]
  );

  return { exportPdf, generating, pdfError, setPdfError };
}

