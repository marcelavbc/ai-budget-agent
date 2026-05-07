import { useCallback, useRef, useState } from "react";
import type { BudgetClientDetails, BudgetClientItem } from "@/features/budgets/types/budget";
import { buildPdfFilename, translateItemsForPdf } from "@/features/budgets/lib/pdfUtils";

export function usePdfExport() {
  const [generating, setGenerating] = useState(false);
  const generatingRef = useRef(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const exportPdf = useCallback(
    async (args: {
      client: BudgetClientDetails;
      items: BudgetClientItem[];
      lang: "ca" | "es";
    }) => {
      if (generatingRef.current) return;
      generatingRef.current = true;
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
        generatingRef.current = false;
        setGenerating(false);
      }
    },
    []
  );

  return { exportPdf, generating, pdfError, setPdfError };
}

