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

function trimOrEmpty(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function hasAnyAddressValue(
  street: string | null | undefined,
  postalCode: string | null | undefined,
  city: string | null | undefined
): boolean {
  return Boolean(
    trimOrEmpty(street) || trimOrEmpty(postalCode) || trimOrEmpty(city)
  );
}

function addressesEqual(
  aStreet: string,
  aPostal: string,
  aCity: string,
  bStreet: string,
  bPostal: string,
  bCity: string
): boolean {
  return aStreet === bStreet && aPostal === bPostal && aCity === bCity;
}

export function BudgetClientForm({
  client,
  onChange,
  quoteManuallyEdited,
  onQuoteNumberChange,
  onResetQuoteAutomation,
  onContactSelect,
  identityLocked = false,
  mode = "create",
}: {
  client: BudgetClientDetails;
  onChange: React.Dispatch<React.SetStateAction<BudgetClientDetails>>;
  quoteManuallyEdited: boolean;
  onQuoteNumberChange: (value: string) => void;
  onResetQuoteAutomation: () => void;
  onContactSelect?: (contactId: string) => void;
  identityLocked?: boolean;
  mode?: "create" | "edit";
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
  const [useDifferentFiscalAddress, setUseDifferentFiscalAddress] =
    useState(false);
  const [fiscalMirrorsJob, setFiscalMirrorsJob] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const addressOptionsRef = useRef<HTMLDivElement>(null);
  const initializedFiscalAddressRef = useRef(false);

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

  const setClientField = useCallback(
    <K extends keyof BudgetClientDetails>(
      key: K,
      value: BudgetClientDetails[K]
    ) => {
      onChange((prev) => ({ ...prev, [key]: value }));
    },
    [onChange]
  );

  function applyJobAddress(address: ContactAddressOption) {
    onChange((prev) => ({
      ...prev,
      ...jobAddressFromContactAddress(address),
    }));
    setAddressOptionsOpen(false);
  }

  const applyFiscalAddress = useCallback(
    (args: {
      taxId?: string | null;
      street?: string | null;
      postalCode?: string | null;
      city?: string | null;
    }) => {
      if (args.taxId !== undefined) {
        setClientField("clientTaxId", args.taxId ?? "");
      }
      if (args.street !== undefined) {
        setClientField("clientAddressStreet", args.street ?? "");
      }
      if (args.postalCode !== undefined) {
        setClientField("clientAddressPostalCode", args.postalCode ?? "");
      }
      if (args.city !== undefined) {
        setClientField("clientAddressCity", args.city ?? "");
      }
    },
    [setClientField]
  );

  async function selectContact(contact: ContactSuggestion) {
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

    if (mode !== "create") return;

    const currentJobStreet = client.jobAddressStreet ?? "";
    const currentJobPostal = client.jobAddressPostalCode ?? "";
    const currentJobCity = client.jobAddressCity ?? "";
    const currentFiscalStreet = trimOrEmpty(client.clientAddressStreet);
    const currentFiscalPostal = trimOrEmpty(client.clientAddressPostalCode);
    const currentFiscalCity = trimOrEmpty(client.clientAddressCity);
    const currentTaxId = trimOrEmpty(client.clientTaxId);

    const shouldReplaceCurrentFiscal =
      !hasAnyAddressValue(
        currentFiscalStreet,
        currentFiscalPostal,
        currentFiscalCity
      ) ||
      addressesEqual(
        currentFiscalStreet,
        currentFiscalPostal,
        currentFiscalCity,
        currentJobStreet,
        currentJobPostal,
        currentJobCity
      );

    try {
      const res = await fetch(`/api/contacts/${contact.id}`);
      if (!res.ok) return;

      const data = (await res.json()) as {
        tax_id: string | null;
        fiscal_address_street: string | null;
        fiscal_address_postal_code: string | null;
        fiscal_address_city: string | null;
      } | null;

      if (!data) return;

      const fiscalStreet = trimOrEmpty(data.fiscal_address_street);
      const fiscalPostal = trimOrEmpty(data.fiscal_address_postal_code);
      const fiscalCity = trimOrEmpty(data.fiscal_address_city);
      if (!hasAnyAddressValue(fiscalStreet, fiscalPostal, fiscalCity)) {
        setFiscalMirrorsJob(true);
        return;
      }

      if (shouldReplaceCurrentFiscal) {
        applyFiscalAddress({
          taxId: currentTaxId ? undefined : data.tax_id,
          street: fiscalStreet,
          postalCode: fiscalPostal,
          city: fiscalCity,
        });
      } else if (!currentTaxId && data.tax_id) {
        setClientField("clientTaxId", data.tax_id);
      }

      setFiscalMirrorsJob(false);

      setUseDifferentFiscalAddress(
        !addressesEqual(
          shouldReplaceCurrentFiscal ? fiscalStreet : currentFiscalStreet,
          shouldReplaceCurrentFiscal ? fiscalPostal : currentFiscalPostal,
          shouldReplaceCurrentFiscal ? fiscalCity : currentFiscalCity,
          currentJobStreet,
          currentJobPostal,
          currentJobCity
        )
      );
    } catch {
      const fiscalStreet = trimOrEmpty(contact.fiscal_address_street);
      const fiscalPostal = trimOrEmpty(contact.fiscal_address_postal_code);
      const fiscalCity = trimOrEmpty(contact.fiscal_address_city);
      if (!hasAnyAddressValue(fiscalStreet, fiscalPostal, fiscalCity)) {
        setFiscalMirrorsJob(true);
        return;
      }

      if (shouldReplaceCurrentFiscal) {
        applyFiscalAddress({
          street: fiscalStreet,
          postalCode: fiscalPostal,
          city: fiscalCity,
        });
      }

      setUseDifferentFiscalAddress(
        !addressesEqual(
          shouldReplaceCurrentFiscal ? fiscalStreet : currentFiscalStreet,
          shouldReplaceCurrentFiscal ? fiscalPostal : currentFiscalPostal,
          shouldReplaceCurrentFiscal ? fiscalCity : currentFiscalCity,
          currentJobStreet,
          currentJobPostal,
          currentJobCity
        )
      );
      setFiscalMirrorsJob(false);
    }
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

  useEffect(() => {
    if (initializedFiscalAddressRef.current) return;

    const jobStreet = trimOrEmpty(client.jobAddressStreet);
    const jobPostal = trimOrEmpty(client.jobAddressPostalCode);
    const jobCity = trimOrEmpty(client.jobAddressCity);
    const fiscalStreet = trimOrEmpty(client.clientAddressStreet);
    const fiscalPostal = trimOrEmpty(client.clientAddressPostalCode);
    const fiscalCity = trimOrEmpty(client.clientAddressCity);
    const hasFiscal = hasAnyAddressValue(
      fiscalStreet,
      fiscalPostal,
      fiscalCity
    );

    if (hasFiscal) {
      setFiscalMirrorsJob(false);
      setUseDifferentFiscalAddress(
        !addressesEqual(
          fiscalStreet,
          fiscalPostal,
          fiscalCity,
          jobStreet,
          jobPostal,
          jobCity
        )
      );
    } else {
      setUseDifferentFiscalAddress(false);
      setFiscalMirrorsJob(true);
      if (hasAnyAddressValue(jobStreet, jobPostal, jobCity)) {
        applyFiscalAddress({
          street: client.jobAddressStreet ?? "",
          postalCode: client.jobAddressPostalCode ?? "",
          city: client.jobAddressCity ?? "",
        });
      }
    }

    initializedFiscalAddressRef.current = true;
  }, [
    client.jobAddressStreet,
    client.jobAddressPostalCode,
    client.jobAddressCity,
    client.clientAddressStreet,
    client.clientAddressPostalCode,
    client.clientAddressCity,
    mode,
    applyFiscalAddress,
  ]);

  useEffect(() => {
    if (!fiscalMirrorsJob) return;

    applyFiscalAddress({
      street: client.jobAddressStreet ?? "",
      postalCode: client.jobAddressPostalCode ?? "",
      city: client.jobAddressCity ?? "",
    });
  }, [
    fiscalMirrorsJob,
    client.jobAddressStreet,
    client.jobAddressPostalCode,
    client.jobAddressCity,
    applyFiscalAddress,
  ]);

  function toggleDifferentFiscalAddress(checked: boolean) {
    setUseDifferentFiscalAddress(checked);
    if (!checked) {
      setFiscalMirrorsJob(true);
      applyFiscalAddress({
        street: client.jobAddressStreet ?? "",
        postalCode: client.jobAddressPostalCode ?? "",
        city: client.jobAddressCity ?? "",
      });
    } else {
      setFiscalMirrorsJob(false);
    }
  }

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
                Dades de facturació bloquejades perquè el pressupost està
                facturat.
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

        <div className={styles.fiscalSection}>
          <h4 className={styles.fiscalSectionTitle}>Dades fiscals</h4>
          <div className={styles.fiscalFields}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>NIF/NIE</span>
              <input
                className={styles.fieldInput}
                type="text"
                value={client.clientTaxId ?? ""}
                disabled={identityLocked}
                onChange={(e) => setClientField("clientTaxId", e.target.value)}
                placeholder="Ex: B12345678"
              />
            </label>

            <label
              className={styles.field}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <input
                type="checkbox"
                checked={useDifferentFiscalAddress}
                onChange={(e) => toggleDifferentFiscalAddress(e.target.checked)}
                disabled={identityLocked}
              />
              <span className={styles.fieldLabel}>
                La direcció fiscal és diferent de l&apos;adreça de l&apos;obra
              </span>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>
                Adreça fiscal (carrer i número)
              </span>
              <input
                className={styles.fieldInput}
                type="text"
                value={client.clientAddressStreet ?? ""}
                disabled={identityLocked}
                onChange={(e) =>
                  setClientField("clientAddressStreet", e.target.value)
                }
              />
            </label>

            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Codi postal fiscal</span>
                <input
                  className={styles.fieldInput}
                  type="text"
                  inputMode="numeric"
                  value={client.clientAddressPostalCode ?? ""}
                  disabled={identityLocked}
                  onChange={(e) =>
                    setClientField("clientAddressPostalCode", e.target.value)
                  }
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Població fiscal</span>
                <input
                  className={styles.fieldInput}
                  type="text"
                  value={client.clientAddressCity ?? ""}
                  disabled={identityLocked}
                  onChange={(e) =>
                    setClientField("clientAddressCity", e.target.value)
                  }
                />
              </label>
            </div>

            <fieldset className={styles.radioFieldset}>
              <legend className={styles.fieldLabel}>IVA</legend>
              <div className={styles.radioGroup}>
                {[0, 10, 21].map((rate) => (
                  <label key={rate} className={styles.radioOption}>
                    <input
                      type="radio"
                      name="taxRate"
                      value={rate}
                      checked={client.taxRate === rate}
                      disabled={identityLocked}
                      onChange={() => setClientField("taxRate", rate)}
                    />
                    <span>{rate}%</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
}
