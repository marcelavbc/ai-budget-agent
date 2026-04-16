import { useState } from "react";
import type { BudgetLine, BudgetDraftResponse } from "@/types/budget";

interface SubmitResult {
  lines: BudgetLine[];
  response: BudgetDraftResponse;
}

export function useGenerateBudgetDraft() {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<BudgetDraftResponse | null>(
    null
  );

  async function submit(description: string): Promise<SubmitResult | null> {
    setFormError(null);
    setLastResponse(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate-budget-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const data = (await res.json()) as BudgetDraftResponse & {
        error?: string;
      };

      if (!res.ok) {
        setFormError(
          data.error ??
            "No s'ha pogut generar el pressupost. Torna-ho a provar."
        );
        return null;
      }

      setLastResponse(data);
      return { lines: data.lines, response: data };
    } catch {
      setFormError(
        "No s'ha pogut connectar. Comprova la connexió i torna-ho a provar."
      );
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { submit, loading, formError, lastResponse };
}
