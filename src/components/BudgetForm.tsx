"use client";

import { useState } from "react";
import styles from "./BudgetForm.module.css";

interface Props {
  loading: boolean;
  formError: string | null;
  pricePerSqm: number;
  onPriceChange: (value: number) => void;
  onSubmit: (description: string) => Promise<boolean>;
}

export function BudgetForm({
  loading,
  formError,
  pricePerSqm,
  onPriceChange,
  onSubmit,
}: Props) {
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const displayError = validationError ?? formError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = description.trim();

    if (!trimmed) {
      setValidationError("Escriu una descripció del treball.");
      return;
    }

    setValidationError(null);
    const ok = await onSubmit(trimmed);
    if (ok) setDescription("");
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const trimmed = description.trim();

      if (!trimmed) {
        setValidationError("Escriu una descripció del treball.");
        return;
      }

      setValidationError(null);
      const ok = await onSubmit(trimmed);
      if (ok) setDescription("");
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label className={styles.label} htmlFor="job-description">
        Descripció del treball
      </label>

      <textarea
        id="job-description"
        className={styles.textarea}
        name="description"
        value={description}
        disabled={loading}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Ex.: Pintar menjador de 20 m² en blanc"
        autoComplete="off"
        spellCheck
        onKeyDown={handleKeyDown}
      />

      <div className={styles.actions}>
        <div className={styles.priceBlock}>
          <div className={styles.priceRow}>
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
            onChange={(e) => onPriceChange(Number(e.target.value))}
            disabled={loading}
          />

          <p className={styles.sliderHint}>
            Valor aplicat a la pintura de parets i sostres.
          </p>
        </div>

        <button className={styles.submit} type="submit" disabled={loading}>
          {loading ? "Afegint…" : "Afegir partida"}
        </button>
      </div>

      {displayError ? <p className={styles.formError}>{displayError}</p> : null}
    </form>
  );
}
