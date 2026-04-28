"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { BudgetListRow, BudgetStatus } from "@/lib/budgets";
import { formatEUR } from "@/lib/formatCurrency";
import { BudgetListItemActions } from "@/components/BudgetListItemActions";
import { StatusPill } from "./StatusPill";
import styles from "./page.module.css";

function formatDate(value: string | null) {
  const v = (value ?? "").trim();
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return v;
  const [, yyyy, mm, dd] = m;
  return `${dd}-${mm}-${yyyy.slice(2)}`;
}

function toComparableDate(value: string | null): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  // Expect YYYY-MM-DD; keep lexicographic compare possible.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function normalizeStatus(
  value: string | null | undefined
): BudgetStatus | "all" {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "draft") return "draft";
  if (v === "sent") return "sent";
  if (v === "approved") return "approved";
  return "all";
}

function statusLabel(value: BudgetStatus | "all") {
  if (value === "all") return "Tots";
  if (value === "draft") return "Esborrany";
  if (value === "sent") return "Enviat";
  return "Aprovat";
}

type PeriodKey = "thisMonth" | "last3Months" | "thisYear" | "all" | "custom";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

function periodLabel(key: PeriodKey) {
  if (key === "thisMonth") return "Aquest mes";
  if (key === "last3Months") return "Últims 3 mesos";
  if (key === "thisYear") return "Aquest any";
  if (key === "all") return "Tot el període";
  return "Personalitzat";
}

export function BudgetsView({ budgets }: { budgets: BudgetListRow[] }) {
  const [items, setItems] = useState<BudgetListRow[]>(() => budgets);
  const [query, setQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<Set<BudgetStatus>>(
    () => new Set()
  );
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [openMenu, setOpenMenu] = useState<"status" | "period" | null>(null);
  const menusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(budgets);
  }, [budgets]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent | PointerEvent) {
      const el = menusRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setOpenMenu(null);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    const now = new Date();
    if (period === "thisMonth") {
      setDateFrom(toYMD(startOfMonth(now)));
      setDateTo(toYMD(now));
      return;
    }
    if (period === "last3Months") {
      setDateFrom(toYMD(addMonths(now, -3)));
      setDateTo(toYMD(now));
      return;
    }
    if (period === "thisYear") {
      setDateFrom(toYMD(startOfYear(now)));
      setDateTo(toYMD(now));
      return;
    }
    if (period === "all") {
      setDateFrom("");
      setDateTo("");
      return;
    }
    // custom: preserve typed values
  }, [period]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = dateFrom.trim();
    const to = dateTo.trim();

    return items.filter((b) => {
      if (selectedStatuses.size > 0) {
        const s = normalizeStatus(b.status);
        if (s === "all") return false;
        if (!selectedStatuses.has(s)) return false;
      }

      if (q) {
        const haystack = [
          b.title ?? "",
          b.quote_number ?? "",
          b.job_address ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      const d = toComparableDate(b.document_date);
      if ((from || to) && !d) return false;
      if (from && d && d < from) return false;
      if (to && d && d > to) return false;

      return true;
    });
  }, [items, query, selectedStatuses, dateFrom, dateTo]);

  const customHasDates =
    period === "custom" && (dateFrom.trim() !== "" || dateTo.trim() !== "");
  const hasPeriodFilter =
    period !== "all" && (period !== "custom" || customHasDates);
  const hasFilters =
    query.trim() !== "" || selectedStatuses.size > 0 || hasPeriodFilter;

  function reset() {
    setQuery("");
    setSelectedStatuses(new Set());
    setPeriod("all");
    setDateFrom("");
    setDateTo("");
  }

  const resultsLabel = `${filtered.length} de ${items.length}`;

  function setBudgetStatus(budgetId: string, next: BudgetStatus) {
    setItems((prev) =>
      prev.map((b) => (b.id === budgetId ? { ...b, status: next } : b))
    );
  }

  const statusIsActive = selectedStatuses.size > 0;
  const periodIsActive = period !== "all";

  function toggleStatus(value: BudgetStatus) {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  return (
    <>
      <section className={styles.filters} aria-label="Filtres">
        <div className={styles.filterRow} ref={menusRef}>
          <div className={styles.search}>
            <span className={styles.searchIcon} aria-hidden="true">
              <Search size={14} />
            </span>
            <input
              className={`${styles.input} ${styles.searchInput}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca per nom, número o adreça..."
              inputMode="search"
              autoComplete="off"
              aria-label="Cerca per nom, número o adreça"
            />
          </div>

          <div className={styles.dropdownWrap}>
            <button
              type="button"
              className={`${styles.dropdownBtn} ${statusIsActive ? styles.dropdownActive : ""}`}
              onClick={() =>
                setOpenMenu((v) => (v === "status" ? null : "status"))
              }
              aria-haspopup="menu"
              aria-expanded={openMenu === "status"}
            >
              <span className={styles.dropdownLabel}>Estat</span>
              {statusIsActive ? (
                <span className={styles.goldDot} aria-hidden="true" />
              ) : null}
              <span className={styles.chevron} aria-hidden="true">
                ▾
              </span>
            </button>

            <div
              className={`${styles.menu} ${openMenu === "status" ? styles.menuOpen : ""}`}
              role="menu"
              aria-label="Seleccionar estats"
            >
              {(["draft", "sent", "approved"] as const).map((s) => {
                const checked = selectedStatuses.has(s);
                return (
                  <label key={s} className={styles.menuRow}>
                    <input
                      className={styles.checkbox}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStatus(s)}
                    />
                    <span>{statusLabel(s)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className={styles.dropdownWrap}>
            <button
              type="button"
              className={`${styles.dropdownBtn} ${styles.dropdownBtnWide} ${periodIsActive ? styles.dropdownActive : ""}`}
              onClick={() =>
                setOpenMenu((v) => (v === "period" ? null : "period"))
              }
              aria-haspopup="menu"
              aria-expanded={openMenu === "period"}
            >
              <span className={styles.dropdownLabel}>
                {periodLabel(period)}
              </span>
              <span className={styles.chevron} aria-hidden="true">
                ▾
              </span>
            </button>

            <div
              className={`${styles.menu} ${styles.menuWide} ${openMenu === "period" ? styles.menuOpen : ""}`}
              role="menu"
              aria-label="Seleccionar període"
            >
              {(["thisMonth", "last3Months", "thisYear", "all"] as const).map(
                (k) => {
                  const checked = period === k;
                  return (
                    <label key={k} className={styles.menuRow}>
                      <input
                        className={styles.radio}
                        type="radio"
                        name="period"
                        checked={checked}
                        onChange={() => setPeriod(k)}
                      />
                      <span>{periodLabel(k)}</span>
                    </label>
                  );
                }
              )}

              <div className={styles.menuDivider} role="separator" />

              <label className={styles.menuRow}>
                <input
                  className={styles.radio}
                  type="radio"
                  name="period"
                  checked={period === "custom"}
                  onChange={() => setPeriod("custom")}
                />
                <span>{periodLabel("custom")}</span>
              </label>

              {period === "custom" ? (
                <div className={styles.customDates}>
                  <label className={styles.customField}>
                    <span className={styles.customLabel}>Des de</span>
                    <input
                      className={`${styles.input} ${styles.customInput}`}
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </label>
                  <label className={styles.customField}>
                    <span className={styles.customLabel}>Fins a</span>
                    <input
                      className={`${styles.input} ${styles.customInput}`}
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </label>
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.filterMeta}>
            <span className={styles.results}>{resultsLabel}</span>
            <button
              type="button"
              className={styles.resetLink}
              onClick={reset}
              disabled={!hasFilters}
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <section className={styles.emptyResults} aria-live="polite">
          <h2 className={styles.emptyTitle}>
            Cap resultat amb aquests filtres.
          </h2>
          <p className={styles.emptyText}>
            Prova a canviar la cerca, l’estat o la data.
          </p>
          <div className={styles.emptyCtas}>
            <button type="button" className={styles.actionBtn} onClick={reset}>
              Netejar filtres
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className={`${styles.list} ${styles.listMobile}`}>
            {filtered.map((b) => {
              const title = (b.title ?? "").trim() || "Pressupost sense títol";
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
                      <span className={styles.total}>{total}</span>
                    </div>

                    <div className={styles.cardFooter}>
                      <div className={styles.meta}>
                        <StatusPill
                          budgetId={b.id}
                          initialStatus={b.status}
                          onStatusChange={(next) => setBudgetStatus(b.id, next)}
                        />

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

                      <div className={styles.cardActions}>
                        <BudgetListItemActions budgetId={b.id} variant="icons" />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop: table */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Núm. pressupost</th>
                  <th className={styles.th}>Client</th>
                  <th className={styles.th}>Data</th>
                  <th className={`${styles.th} ${styles.colAmount}`}>Import</th>
                  <th className={`${styles.th} ${styles.colStatus}`}>Estat</th>
                  <th className={`${styles.th} ${styles.colActions}`}>
                    Accions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
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
                        <StatusPill
                          budgetId={b.id}
                          initialStatus={b.status}
                          onStatusChange={(next) => setBudgetStatus(b.id, next)}
                        />
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
    </>
  );
}
