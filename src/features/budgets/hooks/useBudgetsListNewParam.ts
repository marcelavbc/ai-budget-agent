"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { BudgetListRow } from "@/features/budgets/types/budgetsDb";
import { fetchBudgetById } from "@/features/budgets/lib/budgetsClient";

export function useBudgetsListNewParam(
  budgets: BudgetListRow[]
): BudgetListRow[] {
  const router = useRouter();
  const searchParams = useSearchParams();
  const newId = searchParams.get("new")?.trim() || null;
  const [prefetched, setPrefetched] = useState<BudgetListRow | null>(null);
  const cleanedRef = useRef(false);

  useEffect(() => {
    if (!newId) {
      setPrefetched(null);
      cleanedRef.current = false;
      return;
    }

    const clearNewParam = () => {
      if (cleanedRef.current) return;
      cleanedRef.current = true;
      router.replace("/budgets");
    };

    if (budgets.some((b) => b.id === newId)) {
      clearNewParam();
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const row = await fetchBudgetById(newId);
        if (!cancelled && row) {
          setPrefetched(row);
        }
      } catch {
        // Spot fetch failed: general list will show the budget when ready.
      } finally {
        if (!cancelled) {
          clearNewParam();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [newId, budgets, router]);

  return useMemo(() => {
    const ids = new Set(budgets.map((b) => b.id));
    const leading =
      prefetched && !ids.has(prefetched.id) ? [prefetched] : [];
    return [...leading, ...budgets];
  }, [budgets, prefetched]);
}
