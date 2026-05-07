"use client";

import { Search } from "lucide-react";
import type { CssModuleStyles } from "@/features/budgets/types/styles";
import type { BudgetsListFilters } from "@/features/budgets/hooks/useBudgetsListFilters";

export function BudgetsFiltersSection({
  styles,
  filters,
}: {
  styles: CssModuleStyles;
  filters: BudgetsListFilters;
}) {
  return (
    <section className={styles.filters} aria-label="Filtres" ref={filters.menusRef}>
      <div
        className={`${styles.filterCompactBar} ${filters.filtersOpen ? styles.filterCompactBarOpen : ""}`}
      >
        <div className={`${styles.search} ${styles.mobileSearch}`}>
          <span className={styles.searchIcon} aria-hidden="true">
            <Search size={14} />
          </span>
          <input className={`${styles.input} ${styles.searchInput}`} {...filters.searchInputProps} />
        </div>
        <button
          type="button"
          className={`${styles.filterExpandedToggleBtn} ${filters.activeFilterCount > 0 ? styles.filterExpandedToggleActive : ""}`}
          aria-expanded={filters.filtersOpen}
          aria-controls="budgets-filter-expanded"
          aria-label={
            filters.activeFilterCount > 0 ? `Filtres, ${filters.activeFilterCount} actius` : "Filtres"
          }
          onClick={() => {
            filters.setFiltersOpen((v) => !v);
            filters.setOpenMenu(null);
          }}
        >
          <span className={styles.filterExpandedToggleLabel}>Filtres</span>
          {filters.activeFilterCount > 0 ? (
            <span className={styles.filterBadge} aria-hidden="true">
              {filters.activeFilterCount}
            </span>
          ) : null}
          <span className={styles.chevron} aria-hidden="true">
            {filters.filtersOpen ? "▲" : "▾"}
          </span>
        </button>
      </div>

      <div
        id="budgets-filter-expanded"
        className={`${styles.filterExpanded} ${filters.filtersOpen ? styles.filterExpandedOpen : ""}`}
      >
        <div className={styles.filterRow}>
          <div className={`${styles.search} ${styles.desktopSearch}`}>
            <span className={styles.searchIcon} aria-hidden="true">
              <Search size={14} />
            </span>
            <input className={`${styles.input} ${styles.searchInput}`} {...filters.searchInputProps} />
          </div>

          <div className={styles.dropdownWrap}>
            <button
              type="button"
              className={`${styles.dropdownBtn} ${filters.statusIsActive ? styles.dropdownActive : ""}`}
              onClick={() =>
                filters.setOpenMenu((v) => (v === "status" ? null : "status"))
              }
              aria-haspopup="menu"
              aria-expanded={filters.openMenu === "status"}
            >
              <span className={styles.dropdownLabel}>Estat</span>
              {filters.statusIsActive ? <span className={styles.goldDot} aria-hidden="true" /> : null}
              <span className={styles.chevron} aria-hidden="true">
                ▾
              </span>
            </button>

            <div
              className={`${styles.menu} ${filters.openMenu === "status" ? styles.menuOpen : ""}`}
              role="menu"
              aria-label="Seleccionar estats"
            >
              {(["draft", "sent", "approved"] as const).map((s) => {
                const checked = filters.selectedStatuses.has(s);
                return (
                  <label key={s} className={styles.menuRow}>
                    <input
                      className={styles.checkbox}
                      type="checkbox"
                      checked={checked}
                      onChange={() => filters.toggleStatus(s)}
                    />
                    <span>{filters.statusLabel(s)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className={styles.dropdownWrap}>
            <button
              type="button"
              className={`${styles.dropdownBtn} ${styles.dropdownBtnWide} ${filters.periodIsActive ? styles.dropdownActive : ""}`}
              onClick={() =>
                filters.setOpenMenu((v) => (v === "period" ? null : "period"))
              }
              aria-haspopup="menu"
              aria-expanded={filters.openMenu === "period"}
            >
              <span className={styles.dropdownLabel}>{filters.periodLabel(filters.period)}</span>
              <span className={styles.chevron} aria-hidden="true">
                ▾
              </span>
            </button>

            <div
              className={`${styles.menu} ${styles.menuWide} ${filters.openMenu === "period" ? styles.menuOpen : ""}`}
              role="menu"
              aria-label="Seleccionar període"
            >
              {(["thisMonth", "last3Months", "thisYear", "all"] as const).map((k) => {
                const checked = filters.period === k;
                return (
                  <label key={k} className={styles.menuRow}>
                    <input
                      className={styles.radio}
                      type="radio"
                      name="period"
                      checked={checked}
                      onChange={() => filters.setPeriod(k)}
                    />
                    <span>{filters.periodLabel(k)}</span>
                  </label>
                );
              })}

              <div className={styles.menuDivider} role="separator" />

              <label className={styles.menuRow}>
                <input
                  className={styles.radio}
                  type="radio"
                  name="period"
                  checked={filters.period === "custom"}
                  onChange={() => filters.setPeriod("custom")}
                />
                <span>{filters.periodLabel("custom")}</span>
              </label>

              {filters.period === "custom" ? (
                <div className={styles.customDates}>
                  <label className={styles.customField}>
                    <span className={styles.customLabel}>Des de</span>
                    <input
                      className={`${styles.input} ${styles.customInput}`}
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => filters.setDateFrom(e.target.value)}
                    />
                  </label>
                  <label className={styles.customField}>
                    <span className={styles.customLabel}>Fins a</span>
                    <input
                      className={`${styles.input} ${styles.customInput}`}
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => filters.setDateTo(e.target.value)}
                    />
                  </label>
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.filterMeta}>
            <span className={styles.results}>{filters.resultsLabel}</span>
            <button
              type="button"
              className={styles.resetLink}
              onClick={filters.reset}
              disabled={!filters.hasFilters}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

