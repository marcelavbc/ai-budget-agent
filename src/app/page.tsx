"use client";

import { useState } from "react";
import type { BudgetResponse } from "@/types/budget";
import styles from "./page.module.css";

const EUR = new Intl.NumberFormat("ca-ES", {
  style: "currency",
  currency: "EUR",
});

export default function Home() {
  const [description, setDescription] = useState("");
  const [pricePerSqm, setPricePerSqm] = useState(12);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BudgetResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setResult(null);

    const trimmed = description.trim();

    if (!trimmed) {
      setFormError("Escriu una descripció del treball.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/generate-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: trimmed }),
      });

      const data = (await res.json()) as BudgetResponse & {
        error?: string;
      };

      if (!res.ok) {
        setFormError(
          data.error ??
            "No s’ha pogut generar el pressupost. Torna-ho a provar."
        );
        return;
      }

      setResult(data);
    } catch {
      setFormError(
        "No s’ha pogut connectar. Comprova la connexió i torna-ho a provar."
      );
    } finally {
      setLoading(false);
    }
  }

  const paintableSurfaceM2 = result?.breakdown?.paintableSurfaceM2 ?? null;
  const baseAreaM2 = result?.parsedJob.areaM2 ?? null;

  const adjustedLines =
    result?.lines.map((line) =>
      line.unitLabel === "m²"
        ? {
            ...line,
            unitPrice: pricePerSqm,
            subtotal: line.quantity * pricePerSqm,
          }
        : line
    ) ?? [];

  const adjustedTotal =
    adjustedLines.length > 0
      ? adjustedLines.reduce((sum, line) => sum + line.subtotal, 0)
      : null;

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>Pressupost de pintura</h1>
          <p className={styles.subtitle}>
            Descriu el treball i rep un pressupost orientatiu.
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
            placeholder="Ex: Pintar menjador de 20m2 en blanc"
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
              Pots ajustar-lo si cal abans de generar el pressupost.
            </p>
          </div>

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? "Generant…" : "Generar pressupost"}
          </button>

          {formError ? <p className={styles.formError}>{formError}</p> : null}
        </form>

        {result ? (
          <section className={styles.result} aria-live="polite">
            <div className={styles.totalBlock}>
              {adjustedTotal != null ? (
                <>
                  <span className={styles.totalLabel}>Total estimat</span>
                  <span className={styles.totalValue}>
                    {EUR.format(adjustedTotal)}
                  </span>
                </>
              ) : (
                <p className={styles.totalUnavailable}>
                  No s’ha pogut calcular un total amb les dades indicades.
                </p>
              )}
            </div>

            {paintableSurfaceM2 != null ? (
              <div className={styles.calculationBlock}>
                <h2 className={styles.calculationLabel}>Base del càlcul</h2>

                <dl className={styles.calculationList}>
                  <div className={styles.calculationRow}>
                    <dt>Superfície base</dt>
                    <dd>{baseAreaM2 != null ? `${baseAreaM2} m²` : "-"}</dd>
                  </div>

                  <div className={styles.calculationRow}>
                    <dt>Superfície a pintar</dt>
                    <dd>{paintableSurfaceM2} m²</dd>
                  </div>

                  <div className={styles.calculationRow}>
                    <dt>Preu aplicat</dt>
                    <dd>{pricePerSqm} €/m²</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {adjustedLines.length > 0 ? (
              <div className={styles.linesBlock}>
                <h2 className={styles.linesLabel}>Desglossament</h2>

                <div className={styles.linesList}>
                  {adjustedLines.map((line) => (
                    <div key={line.id} className={styles.lineItem}>
                      <div className={styles.lineMain}>
                        <p className={styles.lineTitle}>{line.label}</p>
                        <p className={styles.lineMeta}>
                          {line.quantity} {line.unitLabel} × {line.unitPrice} €/
                          {line.unitLabel}
                        </p>
                      </div>

                      <p className={styles.lineSubtotal}>
                        {EUR.format(line.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {result.errors?.length ? (
              <div className={styles.warnings}>
                <p className={styles.warningsTitle}>Avís</p>
                <ul className={styles.warningsList}>
                  {result.errors.map((msg) => (
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
