import Link from "next/link";
import {
  getBudgets,
  getRecentBudgetActivity,
  type BudgetStatus,
} from "@/lib/budgets";
import { formatEUR } from "@/lib/formatCurrency";

import styles from "./page.module.css";

function normalizeStatus(value: string | null | undefined): BudgetStatus {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "sent") return "sent";
  if (v === "approved") return "approved";
  return "draft";
}

function statusLabel(value: BudgetStatus): string {
  if (value === "draft") return "Esborrany";
  if (value === "sent") return "Enviat";
  return "Aprovat";
}

function formatActivityDate(value: string | null): string {
  const v = (value ?? "").trim();
  if (!v) return "—";
  const dt = new Date(v);
  if (Number.isNaN(dt.getTime())) return "—";
  return new Intl.DateTimeFormat("ca-ES", { dateStyle: "medium" }).format(dt);
}

function badgeClass(value: BudgetStatus): string {
  if (value === "sent") return styles.badgeSent;
  if (value === "approved") return styles.badgeApproved;
  return styles.badgeDraft;
}

export default async function HomePage() {
  const [budgets, recent] = await Promise.all([
    getBudgets(),
    getRecentBudgetActivity(5),
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
    const status = normalizeStatus(b.status);
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
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Tauler</h1>
            <p className={styles.subtitle}>
              Una vista ràpida de l’activitat i l’estat dels pressupostos.
            </p>
          </div>
        </header>

        <section className={styles.grid} aria-label="Mètriques">
          <div className={styles.card}>
            <p className={styles.cardKicker}>Pressupostos creats</p>
            <p className={styles.cardValue}>{totals.all}</p>
            <p className={styles.cardHint}>Total (tots els temps)</p>
          </div>

          <div className={styles.card}>
            <p className={styles.cardKicker}>Per estat</p>
            <div className={styles.badges}>
              <span className={`${styles.badge} ${styles.badgeDraft}`}>
                Esborrany{" "}
                <span className={styles.badgeCount}>{totals.draft}</span>
              </span>
              <span className={`${styles.badge} ${styles.badgeSent}`}>
                Enviat <span className={styles.badgeCount}>{totals.sent}</span>
              </span>
              <span className={`${styles.badge} ${styles.badgeApproved}`}>
                Aprovat{" "}
                <span className={styles.badgeCount}>{totals.approved}</span>
              </span>
            </div>
            <p className={styles.cardHint}>Recompte actual</p>
          </div>

          <div className={styles.card}>
            <p className={styles.cardKicker}>Valor aprovat</p>
            <p
              className={`${styles.cardValue} ${
                totals.approvedValue > 0 ? styles.cardValueAccent : ""
              }`}
            >
              {formatEUR(totals.approvedValue)}
            </p>
            <p className={styles.cardHint}>Suma de pressupostos aprovats</p>
          </div>

          <div className={styles.card}>
            <p className={styles.cardKicker}>Pendent d’aprovació</p>
            <p className={styles.cardValue}>{formatEUR(totals.sentValue)}</p>
            <p className={styles.cardHint}>Suma de pressupostos enviats</p>
          </div>
        </section>

        <section className={styles.twoCol}>
          <div className={styles.panel}>
            <div className={`${styles.panelTop} ${styles.panelTopAccent}`}>
              <h2 className={styles.panelTitle}>Activitat recent</h2>
              <Link className={styles.panelLink} href="/budgets">
                Veure tots
              </Link>
            </div>

            {recent.length === 0 ? (
              <p className={styles.emptyText}>
                Encara no hi ha pressupostos. Quan en creïs un, apareixerà aquí.
              </p>
            ) : (
              <ul className={styles.activityList}>
                {recent.map((r) => {
                  const status = normalizeStatus(r.status);
                  const clientName = (() => {
                    const c = r.client;
                    if (Array.isArray(c))
                      return (c[0]?.name ?? "").trim() || "Client";
                    return (c?.name ?? "").trim() || "Client";
                  })();
                  const amount = formatEUR(r.total ?? 0);
                  const date = formatActivityDate(r.created_at);

                  return (
                    <li key={r.id} className={styles.activityItem}>
                      <Link
                        className={styles.activityRow}
                        href={`/budgets/${r.id}`}
                      >
                        <div className={styles.activityMain}>
                          <p className={styles.activityTitle}>{clientName}</p>
                          <p className={styles.activityMeta}>{date}</p>
                        </div>

                        <div className={styles.activityRight}>
                          <span className={styles.activityAmount}>
                            {amount}
                          </span>
                          <span
                            className={`${styles.badge} ${badgeClass(status)}`}
                          >
                            {statusLabel(status)}
                          </span>
                          <span className={styles.chevron} aria-hidden="true">
                            →
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className={`${styles.panel} ${styles.panelPlaceholder}`}>
            <div className={styles.panelTop}>
              <h2 className={styles.panelTitle}>Factures</h2>
              <span className={styles.soon}>Pròximament</span>
            </div>
            <p className={styles.emptyText}>
              Aquesta secció servirà per veure factures, imports pendents i
              conciliació. De moment, estem centrats en els pressupostos.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
