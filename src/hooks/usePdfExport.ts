import { useCallback, useState } from "react";
import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";

async function translateItemsIfNeeded(
  items: BudgetClientItem[],
  lang: "ca" | "es"
): Promise<BudgetClientItem[]> {
  if (lang === "ca") return items;
  try {
    const res = await fetch("/api/translate-budget-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, targetLang: "es" }),
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
      total: number;
      lang: "ca" | "es";
    }) => {
      if (generating) return;
      setGenerating(true);
      setPdfError(null);
      try {
        const finalItems = await translateItemsIfNeeded(args.items, args.lang);
        const { generateBudgetPdf } = await import("@/lib/generateBudgetPdf");
        const blob = await generateBudgetPdf({
          client: args.client,
          items: finalItems,
          total: args.total,
          lang: args.lang,
        });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
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

