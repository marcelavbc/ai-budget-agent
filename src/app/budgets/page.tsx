import Link from "next/link";
import { getBudgets } from "@/lib/budgets";
import { formatEUR } from "@/lib/formatCurrency";
import styles from "./page.module.css";

function formatDate(value: string | null) {
  const v = (value ?? "").trim();
  if (!v) return null;
  // Supabase date usually comes as YYYY-MM-DD; keep it calm and readable.
  return v;
}

function formatStatus(value: string | null) {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return { label: "—", key: "unknown" as const };
  if (v === "draft") return { label: "Esborrany", key: "draft" as const };
  return { label: v, key: "other" as const };
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
            <Link className={styles.linkQuiet} href="/">
              ← Nou pressupost
            </Link>
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
              const { label: statusLabel, key: statusKey } = formatStatus(
                b.status
              );
              const total = formatEUR(b.total ?? 0);

              return (
                <li key={b.id}>
                  <Link className={styles.card} href={`/budgets/${b.id}`}>
                    <div className={styles.cardTop}>
                      <h3 className={styles.cardTitle}>{title}</h3>
                      <span className={styles.total}>{total}</span>
                    </div>

                    <div className={styles.meta}>
                      <span className={styles.pill}>
                        <span
                          className={`${styles.dot} ${
                            statusKey === "draft" ? styles.dotDraft : ""
                          }`}
                          aria-hidden="true"
                        />
                        {statusLabel}
                      </span>

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
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
