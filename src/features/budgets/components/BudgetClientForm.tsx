import type { BudgetClientDetails } from "@/features/budgets/types/budget";
import styles from "./BudgetDraftView.module.css";

export function BudgetClientForm({
  client,
  onChange,
  quoteManuallyEdited,
  onQuoteNumberChange,
  onResetQuoteAutomation,
}: {
  client: BudgetClientDetails;
  onChange: React.Dispatch<React.SetStateAction<BudgetClientDetails>>;
  quoteManuallyEdited: boolean;
  onQuoteNumberChange: (value: string) => void;
  onResetQuoteAutomation: () => void;
}) {
  function setClientField<K extends keyof BudgetClientDetails>(
    key: K,
    value: BudgetClientDetails[K]
  ) {
    onChange((prev) => ({ ...prev, [key]: value }));
  }

  return (
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
            onChange={(e) => setClientField("nameOrCompany", e.target.value)}
            autoComplete="organization"
            placeholder="Ex: Maria Vila / Pintures Puig"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Carrer i número</span>
          <input
            className={styles.fieldInput}
            type="text"
            value={client.addressStreet ?? ""}
            onChange={(e) => setClientField("addressStreet", e.target.value)}
          />
        </label>
        <div className={styles.fieldRow}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Codi postal</span>
            <input
              className={styles.fieldInput}
              type="text"
              inputMode="numeric"
              value={client.addressPostalCode ?? ""}
              onChange={(e) =>
                setClientField("addressPostalCode", e.target.value)
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Població</span>
            <input
              className={styles.fieldInput}
              type="text"
              value={client.addressCity ?? ""}
              onChange={(e) => setClientField("addressCity", e.target.value)}
            />
          </label>
        </div>
        <label className={`${styles.field} ${styles.estimatedDaysField}`}>
          <span className={styles.fieldLabel}>Durada estimada del treball</span>
          <input
            className={styles.fieldTextarea}
            value={client.estimatedTime}
            onChange={(e) => setClientField("estimatedTime", e.target.value)}
            placeholder="Ex: 5-7 dies hàbils"
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
  );
}
