import Link from "next/link";
import { getBudgets } from "@/lib/budgets";
import { formatEUR } from "@/lib/formatCurrency";
import { BudgetListItemActions } from "@/components/BudgetListItemActions";
import { StatusPill } from "./StatusPill";
import styles from "./page.module.css";

function formatDate(value: string | null) {
  const v = (value ?? "").trim();
  if (!v) return null;
  // Supabase date usually comes as YYYY-MM-DD; keep it calm and readable.
  return v;
}

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
            <Link className={styles.cta} href="/">
              Crear pressupost
            </Link>
          </div>
        </div>

        {budgets.length === 0 ? (
          <section className={styles.empty}>
            <h2 className={styles.emptyTitle}>Encara no hi ha pressupostos</h2>
            <p className={styles.emptyText}>
              Quan guardis un pressupost, el veuràs aquí. És un espai pensat per
              tenir-ho tot ordenat i a mà.
            </p>
            <div className={styles.emptyCtas}>
              <Link className={styles.cta} href="/">
                Crear el primer pressupost
              </Link>
              <Link className={styles.linkQuiet} href="/">
                Tornar a l’inici
              </Link>
            </div>
          </section>
        ) : (
          <ul className={styles.list}>
            {budgets.map((b) => {
              const title = (b.title ?? "").trim() || "Pressupost sense títol";
              const address = (b.job_address ?? "").trim();
              const quote = (b.quote_number ?? "").trim();
              const docDate = formatDate(b.document_date);
              const total = formatEUR(b.total ?? 0);

              return (
                <li key={b.id}>
                  <div className={styles.card}>
                    <div className={styles.cardTop}>
                      <div className={styles.cardTopLeft}>
                        <Link
                          className={styles.cardTitleLink}
                          href={`/budgets/${b.id}/edit`}
                        >
                          <h3 className={styles.cardTitle}>{title}</h3>
                        </Link>
                      </div>

                      <div className={styles.cardActions}>
                        <span className={styles.total}>{total}</span>
                        <BudgetListItemActions budgetId={b.id} />
                      </div>
                    </div>

                    <div className={styles.meta}>
                      <StatusPill budgetId={b.id} initialStatus={b.status} />

                      {address ? (
                        <span>
                          <span className={styles.k}>Adreça</span>
                          {address}
                        </span>
                      ) : null}

                      {docDate ? (
                        <span>
                          <span className={styles.k}>Data</span>
                          {docDate}
                        </span>
                      ) : null}

                      {quote ? (
                        <span>
                          <span className={styles.k}>Núm.</span>
                          {quote}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
