"use client";

import type { ChangeEvent, RefObject } from "react";
import { Search } from "lucide-react";
import type { CssModuleStyles } from "@/features/budgets/types/styles";
import type { BudgetsListPeriodKey } from "@/features/budgets/lib/budgetsListPeriod";
import type { BudgetStatus } from "@/features/budgets/lib/budgetStatus";

export function BudgetsFiltersSection({
  styles,
  menusRef,
  filtersOpen,
  setFiltersOpen,
  openMenu,
  setOpenMenu,
  activeFilterCount,
  statusIsActive,
  periodIsActive,
  selectedStatuses,
  statusLabel,
  toggleStatus,
  period,
  setPeriod,
  periodLabel,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  searchInputProps,
  resultsLabel,
  hasFilters,
  onReset,
}: {
  styles: CssModuleStyles;
  menusRef: RefObject<HTMLDivElement | null>;
  filtersOpen: boolean;
  setFiltersOpen: (next: boolean | ((v: boolean) => boolean)) => void;
  openMenu: "status" | "period" | null;
  setOpenMenu: (next: "status" | "period" | null | ((v: "status" | "period" | null) => "status" | "period" | null)) => void;
  activeFilterCount: number;
  statusIsActive: boolean;
  periodIsActive: boolean;
  selectedStatuses: Set<BudgetStatus>;
  statusLabel: (s: BudgetStatus) => string;
  toggleStatus: (s: BudgetStatus) => void;
  period: BudgetsListPeriodKey;
  setPeriod: (k: BudgetsListPeriodKey) => void;
  periodLabel: (k: BudgetsListPeriodKey) => string;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  searchInputProps: {
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    inputMode: "search";
    autoComplete: "off";
    "aria-label": string;
  };
  resultsLabel: string;
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <section className={styles.filters} aria-label="Filtres" ref={menusRef}>
      <div
        className={`${styles.filterCompactBar} ${filtersOpen ? styles.filterCompactBarOpen : ""}`}
      >
        <div className={`${styles.search} ${styles.mobileSearch}`}>
          <span className={styles.searchIcon} aria-hidden="true">
            <Search size={14} />
          </span>
          <input className={`${styles.input} ${styles.searchInput}`} {...searchInputProps} />
        </div>
        <button
          type="button"
          className={`${styles.filterExpandedToggleBtn} ${activeFilterCount > 0 ? styles.filterExpandedToggleActive : ""}`}
          aria-expanded={filtersOpen}
          aria-controls="budgets-filter-expanded"
          aria-label={
            activeFilterCount > 0 ? `Filtres, ${activeFilterCount} actius` : "Filtres"
          }
          onClick={() => {
            setFiltersOpen((v) => !v);
            setOpenMenu(null);
          }}
        >
          <span className={styles.filterExpandedToggleLabel}>Filtres</span>
          {activeFilterCount > 0 ? (
            <span className={styles.filterBadge} aria-hidden="true">
              {activeFilterCount}
            </span>
          ) : null}
          <span className={styles.chevron} aria-hidden="true">
            {filtersOpen ? "▲" : "▾"}
          </span>
        </button>
      </div>

      <div
        id="budgets-filter-expanded"
        className={`${styles.filterExpanded} ${filtersOpen ? styles.filterExpandedOpen : ""}`}
      >
        <div className={styles.filterRow}>
          <div className={`${styles.search} ${styles.desktopSearch}`}>
            <span className={styles.searchIcon} aria-hidden="true">
              <Search size={14} />
            </span>
            <input className={`${styles.input} ${styles.searchInput}`} {...searchInputProps} />
          </div>

          <div className={styles.dropdownWrap}>
            <button
              type="button"
              className={`${styles.dropdownBtn} ${statusIsActive ? styles.dropdownActive : ""}`}
              onClick={() => setOpenMenu((v) => (v === "status" ? null : "status"))}
              aria-haspopup="menu"
              aria-expanded={openMenu === "status"}
            >
              <span className={styles.dropdownLabel}>Estat</span>
              {statusIsActive ? <span className={styles.goldDot} aria-hidden="true" /> : null}
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
              onClick={() => setOpenMenu((v) => (v === "period" ? null : "period"))}
              aria-haspopup="menu"
              aria-expanded={openMenu === "period"}
            >
              <span className={styles.dropdownLabel}>{periodLabel(period)}</span>
              <span className={styles.chevron} aria-hidden="true">
                ▾
              </span>
            </button>

            <div
              className={`${styles.menu} ${styles.menuWide} ${openMenu === "period" ? styles.menuOpen : ""}`}
              role="menu"
              aria-label="Seleccionar període"
            >
              {(["thisMonth", "last3Months", "thisYear", "all"] as const).map((k) => {
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
              })}

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
              onClick={onReset}
              disabled={!hasFilters}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

