"use client";

import { Brush } from "lucide-react";
import type { CssModuleStyles } from "@/features/budgets/types/styles";

export function BudgetsEmptyResults({
  styles,
  onReset,
}: {
  styles: CssModuleStyles;
  onReset: () => void;
}) {
  return (
    <section className={styles.emptyResults} aria-live="polite">
      <Brush className={styles.emptyIcon} aria-hidden="true" />
      <h2 className={styles.emptyTitle}>Cap resultat amb aquests filtres.</h2>
      <p className={styles.emptyText}>Prova a canviar la cerca, l’estat o la data.</p>
      <div className={styles.emptyCtas}>
        <button type="button" className={styles.actionBtn} onClick={onReset}>
          Netejar filtres
        </button>
      </div>
    </section>
  );
}

