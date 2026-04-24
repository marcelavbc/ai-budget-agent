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
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return v;
  const [, yyyy, mm, dd] = m;
  return `${dd}-${mm}-${yyyy.slice(2)}`;
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
          <>
            {/* Mobile: keep existing cards */}
            <ul className={`${styles.list} ${styles.listMobile}`}>
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

            {/* Desktop: clean table */}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Núm. pressupost</th>
                    <th className={styles.th}>Client</th>
                    <th className={styles.th}>Data</th>
                    <th className={`${styles.th} ${styles.colAmount}`}>Import</th>
                    <th className={`${styles.th} ${styles.colStatus}`}>Estat</th>
                    <th className={`${styles.th} ${styles.colActions}`}>Accions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((b) => {
                    const quote = (b.quote_number ?? "").trim() || "—";
                    const client = (b.title ?? "").trim() || "—";
                    const docDate = formatDate(b.document_date) ?? "—";
                    const total = formatEUR(b.total ?? 0);

                    return (
                      <tr key={b.id} className={styles.tr}>
                        <td className={`${styles.td} ${styles.colQuote}`}>
                          {quote}
                        </td>
                        <td className={`${styles.td} ${styles.colClient}`}>
                          {client}
                        </td>
                        <td className={`${styles.td} ${styles.colDate}`}>
                          {docDate}
                        </td>
                        <td
                          className={`${styles.td} ${styles.colAmount} ${styles.amountValue}`}
                        >
                          {total}
                        </td>
                        <td className={`${styles.td} ${styles.colStatus}`}>
                          <StatusPill budgetId={b.id} initialStatus={b.status} />
                        </td>
                        <td className={`${styles.td} ${styles.colActions}`}>
                          <div className={styles.rowActions}>
                            <BudgetListItemActions
                              budgetId={b.id}
                              variant="icons"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
