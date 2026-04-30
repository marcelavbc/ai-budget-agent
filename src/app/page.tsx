import Link from "next/link";
import { getBudgets } from "@/lib/budgets";
import { getInvoiceDashboardStats } from "@/lib/invoices";
import { formatEUR } from "@/lib/formatCurrency";
import { budgetStatusLabel, normalizeBudgetStatus } from "@/lib/budgetStatus";
import { parseDateFilter, type DateFilter } from "@/lib/dateFilter";

import styles from "./page.module.css";
import { FilterBar } from "@/components/FilterBar";

type SearchParams = Record<string, string | string[] | undefined>;

function formatFilterLabel(filter: DateFilter): string {
  if (!filter) return "Tots els temps";
  const months = filter.months ?? [];
  if (months.length === 0) return String(filter.year);
  if (months.length === 1) {
    const dt = new Date(Date.UTC(filter.year, months[0] - 1, 1));
    const month = new Intl.DateTimeFormat("ca-ES", { month: "long" }).format(dt);
    const titleMonth = month.charAt(0).toUpperCase() + month.slice(1);
    return `${titleMonth} ${filter.year}`;
  }
  const labels = months
    .slice(0, 4)
    .map((m) =>
      new Intl.DateTimeFormat("ca-ES", { month: "short" }).format(
        new Date(Date.UTC(filter.year, m - 1, 1))
      )
    )
    .map((s) => s.replace(".", ""));
  const extra = months.length > 4 ? ` +${months.length - 4}` : "";
  return `${filter.year} · ${labels.join(", ")}${extra}`;
}

export default async function HomePage(props: { searchParams?: SearchParams }) {
  const filter = parseDateFilter({
    month: props.searchParams?.month,
    year: props.searchParams?.year,
  });

  const [budgets, invoiceStats] = await Promise.all([
    getBudgets(filter),
    getInvoiceDashboardStats(filter),
  ]);

  const totals = {
    all: budgets.length,
    draft: 0,
    sent: 0,
    approved: 0,
    sentValue: 0,
    approvedValue: 0,
  };

  for (const b of budgets) {
    const status = normalizeBudgetStatus(b.status);
    const total = b.total ?? 0;
    if (status === "draft") totals.draft += 1;
    if (status === "sent") {
      totals.sent += 1;
      totals.sentValue += total;
    }
    if (status === "approved") {
      totals.approved += 1;
      totals.approvedValue += total;
    }
  }

  return (
    <main className={styles.wrap}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>Tauler</h1>
            <span className={styles.filterLabel}>{formatFilterLabel(filter)}</span>
          </div>
          <FilterBar />
        </header>

        <div className={styles.twoCol}>
          {/* Pressupostos */}
          <section className={styles.panel} aria-labelledby="section-budgets">
            <div className={styles.panelTop}>
              <h2 className={styles.panelTitle} id="section-budgets">
                Pressupostos
              </h2>
              <Link className={styles.panelLink} href="/budgets">
                Veure tots
              </Link>
            </div>

            <div className={styles.statGrid}>
              <div className={styles.stat}>
                <p className={styles.statKicker}>Total</p>
                <p className={styles.statValue}>{totals.all}</p>
                <p className={styles.statHint}>Tots els temps</p>
              </div>

              <div className={styles.stat}>
                <p className={styles.statKicker}>Per estat</p>
                <div className={styles.badges}>
                  <span className={`${styles.badge} ${styles.badgeDraft}`}>
                    {budgetStatusLabel("draft")}
                    <span className={styles.badgeCount}>{totals.draft}</span>
                  </span>
                  <span className={`${styles.badge} ${styles.badgeSent}`}>
                    {budgetStatusLabel("sent")}
                    <span className={styles.badgeCount}>{totals.sent}</span>
                  </span>
                  <span className={`${styles.badge} ${styles.badgeApproved}`}>
                    {budgetStatusLabel("approved")}
                    <span className={styles.badgeCount}>{totals.approved}</span>
                  </span>
                </div>
              </div>

              <div className={styles.stat}>
                <p className={styles.statKicker}>Valor aprovat</p>
                <p
                  className={`${styles.statValue} ${
                    totals.approvedValue > 0 ? styles.statValueAccent : ""
                  }`}
                >
                  {formatEUR(totals.approvedValue)}
                </p>
                <p className={styles.statHint}>Suma de pressupostos aprovats</p>
              </div>

              <div className={styles.stat}>
                <p className={styles.statKicker}>Pendent d&apos;aprovació</p>
                <p className={styles.statValue}>
                  {formatEUR(totals.sentValue)}
                </p>
                <p className={styles.statHint}>Suma de pressupostos enviats</p>
              </div>
            </div>
          </section>

          {/* Factures */}
          <section className={styles.panel} aria-labelledby="section-invoices">
            <div className={styles.panelTop}>
              <h2 className={styles.panelTitle} id="section-invoices">
                Factures
              </h2>
              <Link className={styles.panelLink} href="/invoices">
                Veure totes
              </Link>
            </div>

            <div className={styles.statGrid}>
              {/* Combined IVA card */}
              <div className={styles.stat}>
                <p className={styles.statKicker}>Tipus IVA</p>
                <div className={styles.statSplit}>
                  <div className={styles.statSplitItem}>
                    <span className={styles.statSplitValue}>
                      {invoiceStats.countWithoutIva}
                    </span>
                    <span className={styles.statSplitLabel}>Sense IVA</span>
                    <span className={styles.statSplitHint}>
                      {formatEUR(invoiceStats.totalWithoutIva)}
                    </span>
                  </div>
                  <div className={styles.statSplitDivider} aria-hidden="true" />
                  <div className={styles.statSplitItem}>
                    <span className={styles.statSplitValue}>
                      {invoiceStats.countWithIva}
                    </span>
                    <span className={styles.statSplitLabel}>Amb IVA</span>
                    <span className={styles.statSplitHint}>
                      {formatEUR(invoiceStats.totalWithIva)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status placeholder */}
              <div className={styles.stat}>
                <p className={styles.statKicker}>Per estat</p>
                <div className={styles.badges}>
                  <span className={`${styles.badge} ${styles.badgeSent}`}>
                    Enviada <span className={styles.badgeCount}>—</span>
                  </span>
                  <span className={`${styles.badge} ${styles.badgeApproved}`}>
                    Pagada <span className={styles.badgeCount}>—</span>
                  </span>
                </div>
                <p className={styles.statHint}>Aviat disponible</p>
              </div>

              <div className={styles.stat}>
                <p className={styles.statKicker}>Total facturat</p>
                <p className={`${styles.statValue} ${styles.statValueAccent}`}>
                  {formatEUR(
                    invoiceStats.totalWithoutIva + invoiceStats.totalWithIva
                  )}
                </p>
                <p className={styles.statHint}>
                  Suma de totes les factures pagadas
                </p>
              </div>

              <div className={styles.stat}>
                <p className={styles.statKicker}>Total factures</p>
                <p className={styles.statValue}>
                  {invoiceStats.countWithoutIva + invoiceStats.countWithIva}
                </p>
                <p className={styles.statHint}>Totes les factures emeses</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
