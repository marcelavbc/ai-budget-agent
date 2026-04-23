"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";
import { formatEUR } from "@/lib/formatCurrency";
import { isValidEmail } from "@/lib/isValidEmail";
import { isBudgetDraftComplete } from "@/lib/budgetDraft";
import { saveBudgetWithLines } from "@/lib/budgets";
import styles from "./BudgetDraftView.module.css";

interface Props {
  items: BudgetClientItem[];
  clientDetails: BudgetClientDetails;
  onClientDetailsChange: React.Dispatch<
    React.SetStateAction<BudgetClientDetails>
  >;
  onItemDescriptionChange: (id: string, value: string) => void;
  quoteManuallyEdited: boolean;
  onQuoteNumberChange: (value: string) => void;
  onResetQuoteAutomation: () => void;
  onBack: () => void;
}

export function BudgetDraftView({
  items,
  clientDetails: client,
  onClientDetailsChange: setClient,
  onItemDescriptionChange,
  quoteManuallyEdited,
  onQuoteNumberChange,
  onResetQuoteAutomation,
  onBack,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const emailInvalid = client.email.trim().length > 0 && !isValidEmail(client.email);
  const draftComplete = isBudgetDraftComplete({ client, items });

  function handleDescriptionChange(id: string, value: string) {
    onItemDescriptionChange(id, value);
  }

  async function handleSaveBudget() {
    if (!draftComplete || isSaving) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      const { budgetId } = await saveBudgetWithLines({ client, items, subtotal });
      router.push(`/budgets/${budgetId}`);
    } catch (e) {
      setSaveError(
        e instanceof Error
          ? e.message
          : "No s'ha pogut guardar el pressupost. Torna-ho a provar."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function setClientField<K extends keyof BudgetClientDetails>(
    key: K,
    value: BudgetClientDetails[K],
  ) {
    setClient((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <section className={styles.root}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          ← Tornar a les línies
        </button>
        <h2 className={styles.heading}>Esborrany del pressupost</h2>
      </div>

      <div className={styles.clientSection}>
        <h3 className={styles.clientSectionTitle}>
          Dades del client i del pressupost
        </h3>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Nom o empresa</span>
            <input
              className={styles.fieldInput}
              type="text"
              value={client.nameOrCompany}
              onChange={(e) =>
                setClientField("nameOrCompany", e.target.value)
              }
              autoComplete="organization"
              placeholder="Ex: Maria Vila / Pintures Puig"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Correu electrònic</span>
            <input
              className={`${styles.fieldInput} ${emailInvalid ? styles.fieldInputInvalid : ""}`}
              type="email"
              inputMode="email"
              value={client.email}
              onChange={(e) => setClientField("email", e.target.value)}
              autoComplete="email"
              placeholder="nom@exemple.cat"
              aria-invalid={emailInvalid}
            />
            {emailInvalid ? (
              <span className={styles.fieldError} role="alert">
                Revisa el format del correu (cal una adreça vàlida).
              </span>
            ) : null}
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Adreça</span>
            <textarea
              className={styles.fieldTextarea}
              rows={2}
              value={client.address}
              onChange={(e) => setClientField("address", e.target.value)}
              autoComplete="street-address"
              placeholder="Carrer, número, pis, codi postal, població"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Temps estimat</span>
            <textarea
              className={styles.fieldTextarea}
              rows={2}
              value={client.estimatedTime}
              onChange={(e) =>
                setClientField("estimatedTime", e.target.value)
              }
              placeholder="El temps estimat serà d’uns 7 a 9 dies hàbils."
            />
          </label>
          <div className={styles.fieldRow}>
            <div className={styles.quoteField}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Núm. de pressupost</span>
                <input
                  className={styles.fieldInput}
                  type="text"
                  value={client.quoteNumber}
                  onChange={(e) => onQuoteNumberChange(e.target.value)}
                  inputMode="text"
                  autoComplete="off"
                  aria-describedby="quote-hint"
                />
              </label>
              <p id="quote-hint" className={styles.fieldHint}>
                Es genera automàticament amb les inicials del nom o empresa i la
                data (p. ex. MV-20260415). Pots corregir-lo si cal.
              </p>
              {quoteManuallyEdited ? (
                <button
                  type="button"
                  className={styles.linkLike}
                  onClick={onResetQuoteAutomation}
                >
                  Tornar a generar automàticament
                </button>
              ) : null}
            </div>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Data</span>
              <input
                className={styles.fieldInput}
                type="date"
                value={client.date}
                onChange={(e) => setClientField("date", e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>

      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>{item.title}</span>
              <span className={styles.cardTotal}>{formatEUR(item.total)}</span>
            </div>
            <textarea
              className={styles.descTextarea}
              value={item.description}
              onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
              rows={4}
              placeholder="Descripció de la partida…"
            />
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        <span className={styles.totalLabel}>Total pressupost</span>
        <span className={styles.totalValue}>{formatEUR(subtotal)}</span>
        {saveError ? (
          <p className={styles.saveError} role="alert">
            {saveError}
          </p>
        ) : null}
        <button
          type="button"
          className={styles.generatePdfBtn}
          onClick={handleSaveBudget}
          disabled={!draftComplete || isSaving}
        >
          {isSaving ? "Guardant pressupost…" : "Guardar pressupost"}
        </button>
      </div>
    </section>
  );
}
