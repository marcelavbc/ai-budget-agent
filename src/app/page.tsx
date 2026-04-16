"use client";

import { useState } from "react";
import type { BudgetLine, BudgetDraftResponse } from "@/types/budget";
import { normalizeLinesWithDraftContext } from "@/lib/normalizeLinesWithDraftContext";

import styles from "./page.module.css";
const EUR = new Intl.NumberFormat("ca-ES", {
  style: "currency",
  currency: "EUR",
});

export default function Home() {
  const [description, setDescription] = useState("");
  const [pricePerSqm, setPricePerSqm] = useState(12);
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<BudgetDraftResponse | null>(
    null
  );
  const [draftLines, setDraftLines] = useState<BudgetLine[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLastResponse(null);

    const trimmed = description.trim();

    if (!trimmed) {
      setFormError("Escriu una descripció del treball.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/generate-budget-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: trimmed }),
      });

      const data = (await res.json()) as BudgetDraftResponse & {
        error?: string;
      };

      if (!res.ok) {
        setFormError(
          data.error ??
            "No s’ha pogut generar el pressupost. Torna-ho a provar."
        );
        return;
      }

      setDraftLines((prev) => {
        const normalized = normalizeLinesWithDraftContext(data.lines, prev);
        return [...prev, ...normalized];
      });
      setLastResponse(data);
      setDescription("");
    } catch {
      setFormError(
        "No s’ha pogut connectar. Comprova la connexió i torna-ho a provar."
      );
    } finally {
      setLoading(false);
    }
  }

  const adjustedLines = draftLines.map((line) =>
    line.type === "walls_and_ceilings" && line.unitLabel === "m²"
      ? {
          ...line,
          unitPrice: pricePerSqm,
          subtotal: line.quantity * pricePerSqm,
        }
      : line
  );

  const hasPending = adjustedLines.some(
    (line) => line.type === "custom" && line.unitPrice === 0
  );

  const adjustedTotal =
    draftLines.length > 0
      ? adjustedLines.reduce((sum, line) => sum + line.subtotal, 0)
      : null;

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>Pressupost de pintura</h1>
          <p className={styles.subtitle}>
            Afegeix les partides una a una per construir el teu pressupost.
          </p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={styles.label} htmlFor="job-description">
            Descripció del treball
          </label>

          <textarea
            id="job-description"
            className={styles.textarea}
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Pintar menjador de 20m2 en blanc. Ex: Pintar 5 portes interiors."
            autoComplete="off"
            spellCheck
          />

          <div className={styles.sliderField}>
            <div className={styles.sliderHeader}>
              <label className={styles.sliderLabel} htmlFor="price-per-sqm">
                Preu orientatiu per m²
              </label>
              <span className={styles.sliderValue}>{pricePerSqm} €</span>
            </div>

            <input
              id="price-per-sqm"
              className={styles.slider}
              type="range"
              min={8}
              max={20}
              step={1}
              value={pricePerSqm}
              onChange={(e) => setPricePerSqm(Number(e.target.value))}
            />

            <p className={styles.sliderHint}>
              Valor aplicat a la pintura de parets i sostres.
            </p>
          </div>

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? "Afegint…" : "Afegir partida"}
          </button>

          {formError ? <p className={styles.formError}>{formError}</p> : null}
        </form>

        {draftLines.length === 0 ? (
          <p className={styles.emptyHint}>
            Comença per una partida i ves afegint-ne més si cal.{" "}
          </p>
        ) : null}

        {draftLines.length > 0 ? (
          <section className={styles.result} aria-live="polite">
            <div className={styles.totalBlock}>
              <span className={styles.totalLabel}>Total estimat</span>

              {hasPending ? (
                <span className={styles.totalPending}>Pendent</span>
              ) : adjustedTotal != null ? (
                <span className={styles.totalValue}>
                  {EUR.format(adjustedTotal)}
                </span>
              ) : (
                <p className={styles.totalUnavailable}>
                  No s’ha pogut calcular un total amb les dades indicades.
                </p>
              )}
            </div>

            {adjustedLines.length > 0 ? (
              <div className={styles.linesBlock}>
                <h2 className={styles.linesLabel}>Desglossament</h2>

                <div className={styles.linesList}>
                  {adjustedLines.map((line) => (
                    <div key={line.id} className={styles.lineItem}>
                      <div className={styles.lineMain}>
                        <p className={styles.lineTitle}>{line.label}</p>

                        {line.type === "custom" && line.unitPrice === 0 ? (
                          <p className={styles.lineMeta}>
                            {line.quantity} {line.unitLabel} · preu pendent
                          </p>
                        ) : (
                          <p className={styles.lineMeta}>
                            {line.quantity} {line.unitLabel} × {line.unitPrice}{" "}
                            €/
                            {line.unitLabel}
                          </p>
                        )}
                      </div>

                      {line.type === "custom" && line.unitPrice === 0 ? (
                        <p className={styles.lineSubtotalPending}>Pendent</p>
                      ) : (
                        <p className={styles.lineSubtotal}>
                          {EUR.format(line.subtotal)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {lastResponse?.errors?.length ? (
              <div className={styles.warnings}>
                <p className={styles.warningsTitle}>Avís</p>
                <ul className={styles.warningsList}>
                  {lastResponse.errors!.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
