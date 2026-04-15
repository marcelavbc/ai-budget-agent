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
          data.error ?? "No s’ha pogut generar el pressupost. Torna-ho a provar.",
        );
        return;
      }

      setResult(data);
    } catch {
      setFormError(
        "No s’ha pogut connectar. Comprova la connexió i torna-ho a provar.",
      );
    } finally {
      setLoading(false);
    }
  }

  const total = result?.breakdown?.total;

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
            placeholder="Ex: Pintar menjador de 20m2 en blanc, en bon estat"
            autoComplete="off"
            spellCheck
          />
          <button
            className={styles.submit}
            type="submit"
            disabled={loading}
          >
            {loading ? "Generant…" : "Generar pressupost"}
          </button>
          {formError ? <p className={styles.formError}>{formError}</p> : null}
        </form>

        {result ? (
          <section className={styles.result} aria-live="polite">
            <div className={styles.totalBlock}>
              {total != null ? (
                <>
                  <span className={styles.totalLabel}>Total estimat</span>
                  <span className={styles.totalValue}>{EUR.format(total)}</span>
                </>
              ) : (
                <p className={styles.totalUnavailable}>
                  No s’ha pogut calcular un total amb les dades indicades.
                </p>
              )}
            </div>

            <div className={styles.budgetBlock}>
              <h2 className={styles.budgetLabel}>Text del pressupost</h2>
              <div className={styles.budgetText}>{result.budgetText}</div>
            </div>

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
