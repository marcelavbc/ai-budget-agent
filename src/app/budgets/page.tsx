import Link from "next/link";
import { getBudgets } from "@/lib/budgets";
import { BudgetsView } from "./BudgetsView";
import styles from "./page.module.css";

export default async function BudgetsPage() {
  const budgets = await getBudgets();

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <header className={styles.header}>
            <h1 className={styles.title}>Pressupostos</h1>
            <p className={styles.subtitle}>
              Tots els pressupostos guardats, ordenats del més recent al més
              antic.
            </p>
          </header>

          <div className={styles.actions}>
            <Link className={styles.cta} href="/budgets/nou">
              Nou pressupost
            </Link>
          </div>
        </div>

        {budgets.length === 0 ? (
          <section className={styles.empty}>
            <h2 className={styles.emptyTitle}>
              Encara no hi ha pressupostos. Crea el primer!
            </h2>
            <div className={styles.emptyCtas}>
              <Link className={styles.cta} href="/budgets/nou">
                Nou pressupost
              </Link>
            </div>
          </section>
        ) : (
          <BudgetsView budgets={budgets} />
        )}
      </div>
    </div>
  );
}
