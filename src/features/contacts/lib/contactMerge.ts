import type { Tables } from "@/core/types/supabase";

type ContactRow = Tables<"contacts">;

function countFilledFields(contact: ContactRow): number {
  return [
    contact.phone,
    contact.email,
    contact.tax_id,
    contact.fiscal_address_street,
    contact.fiscal_address_postal_code,
    contact.fiscal_address_city,
  ].filter((value) => Boolean((value ?? "").trim())).length;
}

/**
 * Suggests which of the two contacts should be the merge survivor,
 * based on how many fields are filled in. On a tie, suggests the
 * older contact (earlier created_at).
 *
 * This is only a SUGGESTION for the UI — Roger manually chooses which
 * one to keep; this function never decides on its own.
 */
export function suggestMergeSurvivor(a: ContactRow, b: ContactRow): ContactRow {
  const filledA = countFilledFields(a);
  const filledB = countFilledFields(b);

  if (filledA !== filledB) {
    return filledA > filledB ? a : b;
  }

  return new Date(a.created_at) <= new Date(b.created_at) ? a : b;
}

/**
 * Same suggestion logic as suggestMergeSurvivor, but for a list of
 * 2 or more contacts. Reduces pairwise.
 */
export function suggestMergeSurvivorAmong(contacts: ContactRow[]): ContactRow {
  if (contacts.length === 0) {
    throw new Error("suggestMergeSurvivorAmong requires at least one contact.");
  }
  return contacts.reduce((best, current) => suggestMergeSurvivor(best, current));
}

export function suggestMergeSurvivorWithJobAddresses(
  a: ContactRow,
  b: ContactRow,
  jobAddressCounts: Record<string, number>
): ContactRow {
  const scoreA = countFilledFields(a) + (jobAddressCounts[a.id] ?? 0);
  const scoreB = countFilledFields(b) + (jobAddressCounts[b.id] ?? 0);

  if (scoreA !== scoreB) {
    return scoreA > scoreB ? a : b;
  }

  return new Date(a.created_at) <= new Date(b.created_at) ? a : b;
}

export function suggestMergeSurvivorAmongWithJobAddresses(
  contacts: ContactRow[],
  jobAddressCounts: Record<string, number>
): ContactRow {
  if (contacts.length === 0) {
    throw new Error("requires at least one contact.");
  }
  return contacts.reduce((best, current) =>
    suggestMergeSurvivorWithJobAddresses(best, current, jobAddressCounts)
  );
}
