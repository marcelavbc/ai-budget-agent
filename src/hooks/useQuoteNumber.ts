import { useCallback, useRef, useState, type SetStateAction } from "react";
import { buildAutoQuoteNumber } from "@/lib/generateQuoteNumber";
import type { BudgetClientDetails } from "@/types/budget";

export function useQuoteNumber(args: {
  setClientDetails: React.Dispatch<SetStateAction<BudgetClientDetails>>;
  initialManuallyEdited?: boolean;
}) {
  const { setClientDetails, initialManuallyEdited = false } = args;
  const [quoteManuallyEdited, setQuoteManuallyEdited] = useState(
    initialManuallyEdited
  );
  const quoteManuallyEditedRef = useRef(initialManuallyEdited);

  const setClientWithAutoQuote = useCallback(
    (action: SetStateAction<BudgetClientDetails>) => {
      setClientDetails((prev) => {
        const next =
          typeof action === "function"
            ? (action as (p: BudgetClientDetails) => BudgetClientDetails)(prev)
            : action;
        const nameOrDateChanged =
          next.nameOrCompany !== prev.nameOrCompany || next.date !== prev.date;
        if (!quoteManuallyEditedRef.current && nameOrDateChanged) {
          return {
            ...next,
            quoteNumber: buildAutoQuoteNumber(next.nameOrCompany, next.date),
          };
        }
        return next;
      });
    },
    [setClientDetails]
  );

  const onQuoteNumberChange = useCallback(
    (value: string) => {
      setQuoteManuallyEdited(true);
      quoteManuallyEditedRef.current = true;
      setClientDetails((prev) => ({ ...prev, quoteNumber: value }));
    },
    [setClientDetails]
  );

  const resetAutomation = useCallback(() => {
    setQuoteManuallyEdited(false);
    quoteManuallyEditedRef.current = false;
    setClientDetails((prev) => ({
      ...prev,
      quoteNumber: buildAutoQuoteNumber(prev.nameOrCompany, prev.date),
    }));
  }, [setClientDetails]);

  return {
    quoteManuallyEdited,
    setClientWithAutoQuote,
    onQuoteNumberChange,
    resetAutomation,
  };
}

