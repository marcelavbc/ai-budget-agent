import { connection } from "next/server";
import { Suspense } from "react";
import { getBudgets } from "@/features/budgets/lib/budgets";
import {
  BudgetsListCta,
  BudgetsListSection,
} from "@/features/budgets/components/BudgetsListSection";
import styles from "./page.module.css";

export default async function BudgetsPage() {
  await connection();

  const budgets = await getBudgets();

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <header className={styles.header}>
            <h1 className={styles.title}>Pressupostos</h1>
            <p className={styles.subtitle}>
              Tots els pressupostos guardats, ordenats per la data del
              pressupost del més recent al més antic.
            </p>
          </header>

          <BudgetsListCta />
        </div>

        <Suspense fallback={null}>
          <BudgetsListSection budgets={budgets} />
        </Suspense>
      </div>
    </div>
  );
}
