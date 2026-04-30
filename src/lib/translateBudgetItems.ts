import type { BudgetClientItem } from "@/types/budget";
import type { GroqMessage } from "@/types/groq";
import { callGroq, isRecord } from "@/lib/ai/groq";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FieldRef = {
  itemIdx: number;
  field: "title" | "description" | "optionLabel";
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Remove duplicate "Opció 2: …" prefix already stored in title. */
function stripLeadingOptionPrefix(
  title: string,
  optionLabel: string | undefined
): string {
  const t = title.trim();
  const ol = optionLabel?.trim();
  if (!ol || !t) return title;

  const prefixRe = new RegExp(
    "^" + ol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*:\\s*",
    "i"
  );
  const rest = t.replace(prefixRe, "").trim();
  return rest.length > 0 ? rest : title;
}

/** Fix "Opció N" ↔ "Opción N" regardless of LLM output. */
function normalizeOptionLabel(
  label: string | undefined,
  lang: "ca" | "es"
): string | undefined {
  if (!label) return label;
  if (lang === "es") {
    return label.replace(/\bOpció(\s+\d+)\b/gi, "Opción$1");
  }
  return label.replace(/\bOpción(\s+\d+)\b/gi, "Opció$1");
}

// ---------------------------------------------------------------------------
// Flatten / reconstruct
// ---------------------------------------------------------------------------

/**
 * Extract every translatable text field into a flat array of strings.
 * fieldRefs[i] tells us which item + field string[i] belongs to.
 */
function extractTexts(items: BudgetClientItem[]): {
  texts: string[];
  fieldRefs: FieldRef[];
} {
  const texts: string[] = [];
  const fieldRefs: FieldRef[] = [];

  items.forEach((item, i) => {
    fieldRefs.push({ itemIdx: i, field: "title" });
    texts.push(stripLeadingOptionPrefix(item.title, item.optionLabel));

    fieldRefs.push({ itemIdx: i, field: "description" });
    texts.push(item.description);

    if (typeof item.optionLabel === "string" && item.optionLabel.trim()) {
      fieldRefs.push({ itemIdx: i, field: "optionLabel" });
      texts.push(item.optionLabel);
    }
  });

  return { texts, fieldRefs };
}

function applyTranslatedTexts(
  originals: BudgetClientItem[],
  translations: string[],
  fieldRefs: FieldRef[],
  lang: "ca" | "es"
): BudgetClientItem[] {
  const patches: Array<
    Partial<Pick<BudgetClientItem, "title" | "description" | "optionLabel">>
  > = originals.map(() => ({}));

  fieldRefs.forEach((ref, i) => {
    const text = translations[i];
    if (typeof text === "string") {
      patches[ref.itemIdx]![ref.field] = text;
    }
  });

  return originals.map((orig, i) => {
    const patch = patches[i]!;
    const hasOptionLabel =
      typeof orig.optionLabel === "string" && orig.optionLabel.trim().length > 0;
    const optionLabel = normalizeOptionLabel(
      "optionLabel" in patch ? patch.optionLabel : orig.optionLabel,
      lang
    );

    return {
      ...orig,
      title: patch.title ?? orig.title,
      description: patch.description ?? orig.description,
      ...(hasOptionLabel ? { optionLabel } : {}),
    };
  });
}

// ---------------------------------------------------------------------------
// LLM call
// ---------------------------------------------------------------------------

function buildMessages(
  texts: string[],
  lang: "ca" | "es"
): GroqMessage[] {
  // We send the array of strings and ask for { "translations": [...] }
  // using json_object mode — this is reliable and needs zero custom parsing.
  const inputJson = JSON.stringify({ texts });

  if (lang === "es") {
    const system = [
      "Eres un traductor profesional de catalán a español para presupuestos de obras y pintura.",
      "Recibirás un objeto JSON con la clave \"texts\": un array de cadenas de texto en catalán (o catalán/español mezclado).",
      "Debes devolver un objeto JSON con la clave \"translations\": el mismo array con CADA cadena traducida íntegramente al español.",
      "",
      "Reglas estrictas:",
      "- Traduce CADA cadena completa al español. No dejes ninguna palabra en catalán.",
      "- El array de salida debe tener EXACTAMENTE el mismo número de elementos y el mismo orden que el array de entrada.",
      "- No traduzcas nombres de marca: Jotun, Jotaprof, Jotaprof Supermate, Isaval, Fixenol, Bixolan, Titanlux, Titanlux Ecològic.",
      "- Conserva íntegramente: números, m², €, y cualquier código.",
      "- Tono formal y profesional.",
      "",
      "Ejemplo de entrada:",
      '{"texts":["Paviment: garantia 15 anys trànsit mig","Neteja de la superfície mitjançant producte fungicida i aigua a pressió","Opció 2"]}',
      "Ejemplo de salida:",
      '{"translations":["Pavimento: garantía 15 años tránsito medio","Limpieza de la superficie mediante producto fungicida y agua a presión","Opción 2"]}',
    ].join("\n");

    return [
      { role: "system", content: system },
      { role: "user", content: inputJson },
    ];
  }

  const system = [
    "Ets un traductor professional de castellà a català per a pressupostos d'obres i pintura.",
    "Rebràs un objecte JSON amb la clau \"texts\": un array de cadenes de text en castellà (o castellà/català barrejat).",
    "Has de retornar un objecte JSON amb la clau \"translations\": el mateix array amb CADA cadena traduïda íntegrament al català.",
    "",
    "Regles:",
    "- Tradueix CADA cadena completament al català. No deixis cap paraula en castellà.",
    "- L'array de sortida ha de tenir EXACTAMENT el mateix nombre d'elements i el mateix ordre.",
    "- No tradueixis noms de marca: Jotun, Jotaprof, Jotaprof Supermate, Isaval, Fixenol, Bixolan, Titanlux, Titanlux Ecològic.",
    "- Conserva íntegrament: números, m², €, i qualsevol codi.",
    "- To formal i professional.",
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: inputJson },
  ];
}

// ---------------------------------------------------------------------------
// Validate LLM response
// ---------------------------------------------------------------------------

function parseTranslations(
  raw: string,
  expectedCount: number
): string[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;

  const arr = (parsed as { translations?: unknown }).translations;
  if (!Array.isArray(arr)) return null;
  if (arr.length !== expectedCount) return null;
  if (!arr.every((item) => typeof item === "string")) return null;

  return arr as string[];
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export async function translateBudgetItems(
  items: BudgetClientItem[],
  targetLang: "ca" | "es"
): Promise<BudgetClientItem[]> {
  if (items.length === 0) return items;

  const { texts, fieldRefs } = extractTexts(items);
  if (texts.length === 0) return items;

  const messages = buildMessages(texts, targetLang);

  try {
    const raw = await callGroq(messages, {
      responseFormat: "json_object",
      temperature: 0,
    });

    const translations = parseTranslations(raw, texts.length);
    if (!translations) {
      throw new Error(
        `Translation response validation failed. Expected ${texts.length} strings. Got: ${raw.slice(0, 300)}`
      );
    }

    return applyTranslatedTexts(items, translations, fieldRefs, targetLang);
  } catch (err) {
    console.error("translateBudgetItems failed:", err);
    return items;
  }
}
