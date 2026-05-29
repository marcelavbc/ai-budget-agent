"use client";

import { useState } from "react";
import type {
  BudgetClientDetails,
  BudgetClientItem,
} from "@/features/budgets/types/budget";

export function useTranslation({
  items,
  onItemsReplace,
  onItemChange,
  setClient,
}: {
  items: BudgetClientItem[];
  onItemsReplace?: (items: BudgetClientItem[]) => void;
  onItemChange: (id: string, patch: Partial<BudgetClientItem>) => void;
  setClient: React.Dispatch<React.SetStateAction<BudgetClientDetails>>;
}) {
  const [itemsSnapshot, setItemsSnapshot] = useState<BudgetClientItem[] | null>(
    null
  );
  const [isTranslating, setIsTranslating] = useState(false);

  async function handleTranslate() {
    setItemsSnapshot(items);
    setIsTranslating(true);
    try {
      const res = await fetch("/api/translate-budget-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, targetLang: "es" }),
      });
      if (!res.ok) throw new Error("Translation failed");
      const data = (await res.json()) as { items: BudgetClientItem[] };
      if (onItemsReplace) {
        onItemsReplace(data.items);
      } else {
        for (const item of data.items) {
          onItemChange(item.id, {
            title: item.title,
            description: item.description,
          });
        }
      }
      setClient((prev) => ({ ...prev, lang: "es" }));
    } finally {
      setIsTranslating(false);
    }
  }

  function handleRevertTranslation() {
    if (!itemsSnapshot) return;
    if (onItemsReplace) {
      onItemsReplace(itemsSnapshot);
    } else {
      for (const item of itemsSnapshot) {
        onItemChange(item.id, {
          title: item.title,
          description: item.description,
        });
      }
    }
    setClient((prev) => ({ ...prev, lang: "ca" }));
    setItemsSnapshot(null);
  }

  return {
    isTranslating,
    handleTranslate,
    handleRevertTranslation,
    hasSnapshot: itemsSnapshot !== null,
  };
}
