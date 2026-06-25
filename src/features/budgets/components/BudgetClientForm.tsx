import { useCallback, useEffect, useRef, useState } from "react";
import type { BudgetClientDetails } from "@/features/budgets/types/budget";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import styles from "./BudgetDraftView.module.css";

export type ContactAddressOption = {
  id: string;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  label: string | null;
};

export type ContactSuggestion = {
  id: string;
  name: string;
  fiscal_address_street: string | null;
  fiscal_address_postal_code: string | null;
  fiscal_address_city: string | null;
  addresses: ContactAddressOption[];
};

function formatAddressOptionLabel(address: ContactAddressOption): string {
  if (address.label?.trim()) {
    return address.label.trim();
  }
  const parts = [address.street, address.city]
    .map((value) => (value ?? "").trim())
    .filter(Boolean);
  return parts.join(", ") || "Sense adreça";
}

function jobAddressFromContactAddress(address: ContactAddressOption) {
  return {
    jobAddressStreet: address.street ?? "",
    jobAddressPostalCode: address.postal_code ?? "",
    jobAddressCity: address.city ?? "",
  };
}

export function BudgetClientForm({
  client,
  onChange,
  quoteManuallyEdited,
  onQuoteNumberChange,
  onResetQuoteAutomation,
  onContactSelect,
  identityLocked = false,
}: {
  client: BudgetClientDetails;
  onChange: React.Dispatch<React.SetStateAction<BudgetClientDetails>>;
  quoteManuallyEdited: boolean;
  onQuoteNumberChange: (value: string) => void;
  onResetQuoteAutomation: () => void;
  onContactSelect?: (contactId: string) => void;
  identityLocked?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [contactId, setContactId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ContactSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [addressOptions, setAddressOptions] = useState<ContactAddressOption[]>(
    []
  );
  const [addressOptionsOpen, setAddressOptionsOpen] = useState(false);
  const [autocompleteDismissed, setAutocompleteDismissed] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const addressOptionsRef = useRef<HTMLDivElement>(null);

  const closeSuggestions = useCallback(() => {
    setSuggestionsOpen(false);
    setSuggestions([]);
  }, []);

  const closeAddressOptions = useCallback(() => {
    setAddressOptionsOpen(false);
  }, []);

  useClickOutside(autocompleteRef, suggestionsOpen, closeSuggestions);
  useClickOutside(addressOptionsRef, addressOptionsOpen, closeAddressOptions);

  function clearContactSelection() {
    setContactId(null);
    setAddressOptions([]);
    setAddressOptionsOpen(false);
  }

  function setClientField<K extends keyof BudgetClientDetails>(
    key: K,
    value: BudgetClientDetails[K]
  ) {
    onChange((prev) => ({ ...prev, [key]: value }));
  }

  function applyJobAddress(address: ContactAddressOption) {
    onChange((prev) => ({
      ...prev,
      ...jobAddressFromContactAddress(address),
    }));
    setAddressOptionsOpen(false);
  }

  function selectContact(contact: ContactSuggestion) {
    setContactId(contact.id);
    onContactSelect?.(contact.id);

    if (contact.addresses.length === 1) {
      onChange((prev) => ({
        ...prev,
        nameOrCompany: contact.name,
        ...jobAddressFromContactAddress(contact.addresses[0]!),
      }));
      setAddressOptions([]);
      setAddressOptionsOpen(false);
    } else if (contact.addresses.length > 1) {
      onChange((prev) => ({
        ...prev,
        nameOrCompany: contact.name,
      }));
      setAddressOptions(contact.addresses);
      setAddressOptionsOpen(true);
    } else {
      onChange((prev) => ({
        ...prev,
        nameOrCompany: contact.name,
      }));
      setAddressOptions([]);
      setAddressOptionsOpen(false);
    }

    setAutocompleteDismissed(true);
    closeSuggestions();
  }

  useEffect(() => {
    const query = client.nameOrCompany.trim();

    if (identityLocked || query.length < 2 || autocompleteDismissed) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/contacts/search?q=${encodeURIComponent(query)}`,
            { signal: controller.signal }
          );
          if (!res.ok) {
            setSuggestions([]);
            setSuggestionsOpen(false);
            return;
          }
          const data = (await res.json()) as ContactSuggestion[];
          const results = Array.isArray(data) ? data : [];
          setSuggestions(results);
          setSuggestionsOpen(results.length > 0);
        } catch {
          if (!controller.signal.aborted) {
            setSuggestions([]);
            setSuggestionsOpen(false);
          }
        }
      })();
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [client.nameOrCompany, autocompleteDismissed, identityLocked]);

  const clientName = client.nameOrCompany || "Client sense nom";
  const quoteNumber = client.quoteNumber || "—";

  if (collapsed) {
    return (
      <div className={styles.clientSection}>
        <div className={styles.clientSummary}>
          <div className={styles.clientSummaryText}>
            <span className={styles.clientSummaryName}>{clientName}</span>
            <span>{quoteNumber}</span>
          </div>
          <button
            type="button"
            className={styles.linkLike}
            onClick={() => setCollapsed(false)}
          >
            Editar dades
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.clientSection}
      data-selected-contact-id={contactId ?? undefined}
    >
      <button
        type="button"
        className={styles.linkLike}
        onClick={() => setCollapsed(true)}
      >
        Amagar dades
      </button>
      <h3 className={styles.clientSectionTitle}>
        Dades del client i del pressupost
      </h3>
      <div className={styles.fields}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Nom o empresa</span>
          <div className={styles.contactAutocomplete} ref={autocompleteRef}>
            <input
              name="nameOrCompany"
              className={styles.fieldInput}
              type="text"
              value={client.nameOrCompany}
              disabled={identityLocked}
              onChange={(e) => {
                if (identityLocked) return;
                setAutocompleteDismissed(false);
                clearContactSelection();
                setClientField("nameOrCompany", e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") closeSuggestions();
              }}
              autoComplete="organization"
              placeholder="Ex: Maria Vila / Pintures Puig"
              aria-expanded={suggestionsOpen}
              aria-autocomplete="list"
              aria-controls={
                suggestionsOpen ? "contact-suggestions" : undefined
              }
            />
            {identityLocked ? (
              <p className={styles.fieldHint}>
                Dades de facturació congelades en aprovar el pressupost. Per
                corregir-les, edita el contacte des de /contacts (només
                afectarà documents futurs).
              </p>
            ) : null}
            {suggestionsOpen ? (
              <ul
                id="contact-suggestions"
                className={styles.contactSuggestions}
                role="listbox"
              >
                {suggestions.map((contact) => (
                  <li key={contact.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      className={styles.contactSuggestion}
                      onClick={() => selectContact(contact)}
                    >
                      <span>{contact.name}</span>
                      {contact.fiscal_address_city ? (
                        <span className={styles.contactSuggestionMeta}>
                          {contact.fiscal_address_city}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </label>

        {addressOptions.length > 1 ? (
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Adreça de l&apos;obra</span>
            <div className={styles.contactAutocomplete} ref={addressOptionsRef}>
              <button
                type="button"
                className={`${styles.fieldInput} ${styles.addressPickerTrigger}`}
                aria-expanded={addressOptionsOpen}
                aria-controls={
                  addressOptionsOpen ? "job-address-options" : undefined
                }
                onClick={() => setAddressOptionsOpen((open) => !open)}
              >
                Tria una adreça…
              </button>
              {addressOptionsOpen ? (
                <ul
                  id="job-address-options"
                  className={styles.contactSuggestions}
                  role="listbox"
                >
                  {addressOptions.map((address) => (
                    <li key={address.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        className={styles.contactSuggestion}
                        onClick={() => applyJobAddress(address)}
                      >
                        <span>{formatAddressOptionLabel(address)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </label>
        ) : null}

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Carrer i número</span>
          <input
            className={styles.fieldInput}
            type="text"
            value={client.jobAddressStreet ?? ""}
            onChange={(e) => setClientField("jobAddressStreet", e.target.value)}
          />
        </label>
        <div className={styles.fieldRow}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Codi postal</span>
            <input
              className={styles.fieldInput}
              type="text"
              inputMode="numeric"
              value={client.jobAddressPostalCode ?? ""}
              onChange={(e) =>
                setClientField("jobAddressPostalCode", e.target.value)
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Població</span>
            <input
              className={styles.fieldInput}
              type="text"
              value={client.jobAddressCity ?? ""}
              onChange={(e) => setClientField("jobAddressCity", e.target.value)}
            />
          </label>
        </div>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Obra</span>
          <input
            className={styles.fieldInput}
            type="text"
            value={client.projectName ?? ""}
            onChange={(e) => setClientField("projectName", e.target.value)}
            placeholder="Escola Pompeu Fabra, Restauració Edifici X…"
          />
        </label>
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
