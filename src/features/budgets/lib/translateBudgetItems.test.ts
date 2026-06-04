import { describe, expect, it, vi, afterEach } from "vitest";
import type { BudgetClientItem } from "@/features/budgets/types/budget";
import {
  stripLeadingOptionPrefix,
  normalizeOptionLabel,
  extractTexts,
  applyTranslatedTexts,
  parseTranslations,
  translateBudgetItems,
} from "@/features/budgets/lib/translateBudgetItems";
import { callGroq } from "@/features/budgets/lib/ai/groq";

vi.mock("@/features/budgets/lib/ai/groq", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/budgets/lib/ai/groq")>();
  return { ...actual, callGroq: vi.fn() };
});

function makeItem(overrides: Partial<BudgetClientItem> = {}): BudgetClientItem {
  return {
    id: "i1",
    title: "Menjador: pintura parets",
    description: "Protecció i pintura plàstica Jotun Jotaprof Supermate",
    quantity: 20,
    unitLabel: "m²",
    unitPrice: 12,
    total: 240,
    ...overrides,
  };
}

describe("stripLeadingOptionPrefix", () => {
  it("removes matching optionLabel prefix", () => {
    const title = "Opció 2: Menjador";
    expect(stripLeadingOptionPrefix(title, "Opció 2")).toBe("Menjador");
  });

  it("title without prefix returned unchanged", () => {
    const title = "Saló gran";
    expect(stripLeadingOptionPrefix(title, "Opció 2")).toBe(title);
  });

  it("no optionLabel returns unchanged", () => {
    const title = "Opció 2: Menjador";
    expect(stripLeadingOptionPrefix(title, undefined)).toBe(title);
  });

  it("case-insensitive match removes prefix", () => {
    const title = "opció 2: Menjador";
    expect(stripLeadingOptionPrefix(title, "Opció 2")).toBe("Menjador");
  });

  it("after stripping empty string returns original title", () => {
    const title = "Opció 2:";
    expect(stripLeadingOptionPrefix(title, "Opció 2")).toBe(title);
  });
});

describe("normalizeOptionLabel", () => {
  it("" + "Opció 1" + " with lang es -> Opción 1", () => {
    expect(normalizeOptionLabel("Opció 1", "es")).toBe("Opción 1");
  });

  it("Opción 2 with lang ca -> Opció 2", () => {
    expect(normalizeOptionLabel("Opción 2", "ca")).toBe("Opció 2");
  });

  it("already correct label unchanged", () => {
    expect(normalizeOptionLabel("Opción 2", "es")).toBe("Opción 2");
    expect(normalizeOptionLabel("Opció 3", "ca")).toBe("Opció 3");
  });

  it("undefined returns undefined", () => {
    expect(normalizeOptionLabel(undefined, "es")).toBeUndefined();
  });
});

describe("extractTexts", () => {
  it("single item without optionLabel extracts title and description", () => {
    const item = makeItem();
    const { texts, fieldRefs } = extractTexts([item]);
    expect(texts).toHaveLength(2);
    expect(fieldRefs).toHaveLength(2);
    expect(fieldRefs[0]).toMatchObject({ itemIdx: 0, field: "title" });
    expect(fieldRefs[1]).toMatchObject({ itemIdx: 0, field: "description" });
  });

  it("single item with optionLabel extracts title, description and optionLabel", () => {
    const item = makeItem({ optionLabel: "Opció 2" });
    const { texts, fieldRefs } = extractTexts([item]);
    expect(texts).toHaveLength(3);
    expect(fieldRefs.map((f) => f.field)).toEqual([
      "title",
      "description",
      "optionLabel",
    ]);
  });

  it("fieldRefs map each text to itemIdx and field correctly", () => {
    const items = [
      makeItem({ id: "a", optionLabel: "Opció 1" }),
      makeItem({ id: "b" }),
    ];
    const { texts, fieldRefs } = extractTexts(items);
    // expected fields: a.title, a.description, a.optionLabel, b.title, b.description
    expect(fieldRefs[0]).toMatchObject({ itemIdx: 0, field: "title" });
    expect(fieldRefs[1]).toMatchObject({ itemIdx: 0, field: "description" });
    expect(fieldRefs[2]).toMatchObject({ itemIdx: 0, field: "optionLabel" });
    expect(fieldRefs[3]).toMatchObject({ itemIdx: 1, field: "title" });
    expect(fieldRefs[4]).toMatchObject({ itemIdx: 1, field: "description" });
    expect(texts).toHaveLength(fieldRefs.length);
  });

  it("title with optionLabel prefix has prefix stripped in extracted title", () => {
    const item = makeItem({
      title: "Opció 2: Menjador",
      optionLabel: "Opció 2",
    });
    const { texts } = extractTexts([item]);
    expect(texts[0]).toBe("Menjador");
  });
});

describe("parseTranslations", () => {
  it("valid JSON with correct count returns array of strings", () => {
    const raw = JSON.stringify({ translations: ["a", "b"] });
    expect(parseTranslations(raw, 2)).toEqual(["a", "b"]);
  });

  it("wrong count returns null", () => {
    const raw = JSON.stringify({ translations: ["a", "b"] });
    expect(parseTranslations(raw, 3)).toBeNull();
  });

  it("missing translations key returns null", () => {
    const raw = JSON.stringify({ other: [] });
    expect(parseTranslations(raw, 0)).toBeNull();
  });

  it("non-string item in array returns null", () => {
    const raw = JSON.stringify({ translations: ["ok", 1] });
    expect(parseTranslations(raw, 2)).toBeNull();
  });

  it("invalid JSON returns null", () => {
    expect(parseTranslations("not json", 1)).toBeNull();
  });
});

describe("applyTranslatedTexts", () => {
  it("applies translations to title and description correctly", () => {
    const item = makeItem({ id: "i1" });
    const { fieldRefs } = extractTexts([item]);
    const translations = ["Titol nou", "Descripcio nova"];
    const next = applyTranslatedTexts([item], translations, fieldRefs, "ca");
    expect(next[0].title).toBe("Titol nou");
    expect(next[0].description).toBe("Descripcio nova");
  });

  it("optionLabel translated and normalized for lang es", () => {
    const item = makeItem({ id: "i1", optionLabel: "Opció 2" });
    const { fieldRefs } = extractTexts([item]);
    const translations = ["Menjador nou", "Descripcio nova", "Opció 2"]; // last will be normalized
    const next = applyTranslatedTexts([item], translations, fieldRefs, "es");
    expect(next[0].optionLabel).toBe("Opción 2");
  });

  it("item without optionLabel does not get optionLabel added", () => {
    const item = makeItem({ id: "i1" });
    const { fieldRefs } = extractTexts([item]);
    const translations = ["Titol nou", "Descripcio nova"];
    const next = applyTranslatedTexts([item], translations, fieldRefs, "ca");
    expect(next[0].optionLabel).toBeUndefined();
  });

  it("translation array shorter than fieldRefs keeps original for missing fields", () => {
    const item = makeItem({ id: "i1", optionLabel: "Opció 1" });
    const { fieldRefs } = extractTexts([item]);
    // fieldRefs length is 3, provide only 1 translation
    const translations = ["Titol parcial"];
    const next = applyTranslatedTexts([item], translations, fieldRefs, "ca");
    expect(next[0].title).toBe("Titol parcial");
    expect(next[0].description).toBe(item.description);
    expect(next[0].optionLabel).toBe("Opció 1");
  });
});

describe("translateBudgetItems", () => {
  afterEach(() => {
    vi.mocked(callGroq).mockReset();
  });

  it("array empty returns original items", async () => {
    const items: BudgetClientItem[] = [];
    const next = await translateBudgetItems(items, "es");
    expect(next).toEqual([]);
    expect(callGroq).not.toHaveBeenCalled();
  });

  it("returns original items if Groq call fails", async () => {
    vi.mocked(callGroq).mockRejectedValue(new Error("test"));
    const items = [makeItem({ id: "i1" })];
    const next = await translateBudgetItems(items, "es");
    expect(next).toEqual([makeItem({ id: "i1" })]);
  });

  it("returns original items if Groq has invalid response", async () => {
    vi.mocked(callGroq).mockResolvedValue("invalid response");
    const items = [makeItem({ id: "i1" })];
    const next = await translateBudgetItems(items, "es");
    expect(next).toEqual([makeItem({ id: "i1" })]);
  });

  it("translates items correctly", async () => {
    vi.mocked(callGroq).mockResolvedValue(
      JSON.stringify({
        translations: [
          "Comedor: pintura paredes",
          "Protección y pintura plástica Jotun Jotaprof Supermate",
        ],
      })
    );
    const items = [makeItem({ id: "i1" })];
    const next = await translateBudgetItems(items, "ca");
    expect(next[0].title).toBe("Comedor: pintura paredes");
    expect(next[0].description).toBe(
      "Protección y pintura plástica Jotun Jotaprof Supermate"
    );
  });
});
