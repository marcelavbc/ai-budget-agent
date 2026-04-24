import type { BudgetClientItem } from "@/types/budget";
import type { GroqMessage, GroqResponse } from "@/types/groq";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getGroqContent(data: unknown): string | null {
  if (!isRecord(data)) return null;
  const choices = data.choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0];
  if (!isRecord(first)) return null;
  const message = first.message;
  if (!isRecord(message)) return null;
  const content = message.content;
  return typeof content === "string" ? content : null;
}

function isBudgetClientItem(value: unknown): value is BudgetClientItem {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string") return false;
  if (typeof value.title !== "string") return false;
  if (typeof value.description !== "string") return false;
  if (typeof value.total !== "number" || !Number.isFinite(value.total)) return false;

  const quantity = value.quantity;
  if (
    !(
      quantity === undefined ||
      (typeof quantity === "number" && Number.isFinite(quantity))
    )
  ) {
    return false;
  }

  const unitLabel = value.unitLabel;
  if (
    !(
      unitLabel === undefined ||
      unitLabel === "m²" ||
      unitLabel === "unitat" ||
      unitLabel === "partida"
    )
  ) {
    return false;
  }

  const unitPrice = value.unitPrice;
  if (
    !(
      unitPrice === undefined ||
      (typeof unitPrice === "number" && Number.isFinite(unitPrice))
    )
  ) {
    return false;
  }

  return true;
}

export async function translateBudgetItems(
  items: BudgetClientItem[],
  targetLang: "ca" | "es"
): Promise<BudgetClientItem[]> {
  if (targetLang === "ca") return items;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("translateBudgetItems: Missing GROQ_API_KEY");
    return items;
  }

  const systemPrompt = [
    "You are a professional translator specializing in construction and painting trade documents. Translate the following JSON from Catalan to Spanish. Rules:",
    "- Translate only 'title' and 'description' fields",
    "- Never translate brand names: Jotun, Jotaprof, Jotaprof Supermate, Isaval, Fixenol, Bixolan, Titanlux, Titanlux Ecològic",
    "- Keep a professional, formal tone",
    "- Return only valid JSON, no explanations, no markdown",
  ].join("\n");

  try {
    const messages: GroqMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(items) },
    ];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0,
          messages,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Groq request failed (${response.status})`);
    }

    const data = (await response.json()) as GroqResponse;
    const content = getGroqContent(data);
    if (!content) throw new Error("Empty Groq response");

    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed) || !parsed.every(isBudgetClientItem)) {
      throw new Error("Unexpected translation schema");
    }

    return parsed;
  } catch (err) {
    console.error("translateBudgetItems: Translation failed", err);
    return items;
  }
}

