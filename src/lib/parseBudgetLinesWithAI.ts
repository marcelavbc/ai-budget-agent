import type { AIParsedBudgetLines } from "@/types/aiBudget";
import type { GroqMessage } from "@/types/groq";
import { callGroq, isRecord } from "@/lib/ai/groq";

const ALLOWED_TYPES = new Set([
  "walls_and_ceilings",
  "repair",
  "doors",
  "windows",
  "enamel_varnish",
  "exterior",
  "custom",
]);

const ALLOWED_UNITS = new Set(["m²", "unitat", "partida"]);

function isAIParsedBudgetLines(value: unknown): value is AIParsedBudgetLines {
  if (!isRecord(value)) return false;
  const lines = value.lines;
  if (!Array.isArray(lines)) return false;

  return lines.every((line) => {
    if (!isRecord(line)) return false;
    const type = line.type;
    const label = line.label;
    const quantity = line.quantity;
    const unitLabel = line.unitLabel;
    const optionGroupId = line.optionGroupId;
    const optionLabel = line.optionLabel;

    if (typeof type !== "string" || !ALLOWED_TYPES.has(type)) return false;
    if (typeof label !== "string" || label.trim().length === 0) return false;
    if (
      !(
        quantity === null ||
        (typeof quantity === "number" && Number.isFinite(quantity))
      )
    ) {
      return false;
    }
    if (typeof unitLabel !== "string" || !ALLOWED_UNITS.has(unitLabel)) {
      return false;
    }

    const hasOptionGroupId =
      typeof optionGroupId === "string" && optionGroupId.trim().length > 0;
    const hasOptionLabel =
      typeof optionLabel === "string" && optionLabel.trim().length > 0;
    if (hasOptionGroupId !== hasOptionLabel) return false;
    if (optionGroupId != null && typeof optionGroupId !== "string") return false;
    if (optionLabel != null && typeof optionLabel !== "string") return false;

    return true;
  });
}

export async function parseBudgetLinesWithAI(
  description: string
): Promise<AIParsedBudgetLines> {
  const messages: GroqMessage[] = [
    {
      role: "system",
      content: [
        "You are an assistant that interprets descriptions of painting jobs written in informal Catalan.",
        "Your job is to convert the user's text into a structured list of budget line items.",
        "",
        "IMPORTANT:",
        "- Return ONLY valid JSON.",
        "- Do not add explanations.",
        "- Do not add markdown.",
        "- Do not invent prices.",
        "- Do not invent quantities if there is not enough context. If unclear, use quantity: null.",
        '- If a job does not fit a known category, use type: "custom".',
        "",
        "Allowed types:",
        '- "walls_and_ceilings"',
        '- "repair"',
        '- "doors"',
        '- "windows"',
        '- "enamel_varnish"',
        '- "exterior"',
        '- "custom"',
        "",
        "Allowed units:",
        '- "m²"',
        '- "unitat"',
        '- "partida"',
        "",
        "Classification rules:",
        '- Use "walls_and_ceilings" for general interior painting of walls and ceilings.',
        '- Use "repair" ONLY for minor repairs: cracks, filler, touch-ups, small surface damage.',
        '- Use "custom" for humidity damage, leaks, damp patches, structural stains, or any pathology that implies specialized treatment. Examples: "humitats", "goteres", "taques d\'humitat", "patologies", "eflorescències".',
        '- Use "doors" for doors.',
        '- Use "windows" for windows or frames.',
        '- Use "enamel_varnish" for enamel, varnish, or wood/metal treatments.',
        '- Use "exterior" for facades, terraces, exterior surfaces, or similar.',
        '- Use "custom" for specific jobs that do not clearly fit another category.',
        "",
        "Quantity rules:",
        "- If the text clearly states m², use them as the quantity.",
        "- If there is no clear quantity, use quantity: null.",
        "- Do not make approximate calculations or automatic m² conversions.",
        "- When the quantity is in units (doors, windows, radiators, etc.), do not convert to m².",
        "",
        "Label field rules:",
        "- The label must be short, specific, and natural in Catalan.",
        "- If a zone appears in the text, always include it in the label.",
        "- Follow this format whenever possible: \'[Zone]: [action] [element]\'",
        "- Do not use generic labels like \'Pintura de parets i sostres\', \'Reparació de desperfectes\' or \'Treballs de pintura\'.",
        "- For repairs where no element is specified, use: \'[Zone]: reparació desperfectes\'.",
        "- For unusual line items, use: \'[Zone]: [brief description]\'.",
        "- The label must not include price, quantity, or units.",
        "- The label must avoid unnecessary repetition and sound natural.",
        "- If it can be inferred, distinguish between \'esmaltat\' and \'envernissat\' in the label.",
        "",
        "Option group rules:",
        '- When the user describes alternative treatments for the same work item (e.g. "opció 1: ... o opció 2: ..."), emit one line per alternative.',
        "- All alternatives must share the same optionGroupId (a short kebab-case id, e.g. \"passama-fusta\").",
        "- Each alternative must have an optionLabel: \"Opció 1\", \"Opció 2\", etc.",
        "- Do NOT emit optionGroupId or optionLabel for normal (non-alternative) lines.",
        "",
        "Example of alternative options:",
        'Input: "Passamà de fusta: opció 1 decapat + lasur o opció 2 polit + imprimació + esmalt"',
        'Output: { "lines": [ { "type": "enamel_varnish", "label": "Passamà: decapat + lasur", "quantity": 1, "unitLabel": "partida", "optionGroupId": "passama-fusta", "optionLabel": "Opció 1" }, { "type": "enamel_varnish", "label": "Passamà: polit + esmalt", "quantity": 1, "unitLabel": "partida", "optionGroupId": "passama-fusta", "optionLabel": "Opció 2" } ] }',
        "",
        "Good label examples:",
        "- Cuina: pintura sostre",
        "- Cuina: reparació desperfectes",
        "- Habitació matrimoni: esmaltat armari",
        "- Façana: revestiment exterior",
        "- Escala comunitària: sanejat humitats",
        "",
        "Bad label examples:",
        "- Pintura de parets i sostres",
        "- Reparació de desperfectes",
        "- Treballs de pintura",
        "",
        "Example of splitting into multiple lines:",
        'Input: "Cuina, sostre, 12 m². Reparar desperfectes i pintar en blanc."',
        'Output: { "lines": [ { "type": "repair", "label": "Cuina: reparació desperfectes", "quantity": 12, "unitLabel": "m²" }, { "type": "walls_and_ceilings", "label": "Cuina: pintura sostre", "quantity": 12, "unitLabel": "m²" } ] }',
        "",
        "Example of humidity vs repair distinction:",
        'Input: "reparar humitats a la paret del fons"',
        'Output: { "lines": [ { "type": "custom", "label": "Menjador: tractament humitats paret del fons", "quantity": 1, "unitLabel": "partida" } ] }',
        "",
        'Input: "reparar unes esquerdes al sostre"',
        'Output: { "lines": [ { "type": "repair", "label": "Habitació: reparació esquerdes sostre", "quantity": 1, "unitLabel": "partida" } ] }',
        "",
        "Response schema:",
        '{ "lines": [ { "type": "walls_and_ceilings" | "repair" | "doors" | "windows" | "enamel_varnish" | "exterior" | "custom", "label": "text in Catalan", "quantity": number | null, "unitLabel": "m²" | "unitat" | "partida", "optionGroupId"?: string, "optionLabel"?: string } ] }',
      ].join("\n"),
    },
    {
      role: "user",
      content: description,
    },
  ];

  const content = await callGroq(messages, { responseFormat: "json_object" });

  let parsed: unknown;
  try {
    parsed = JSON.parse(content) as unknown;
  } catch {
    throw new Error("Invalid JSON in Groq response");
  }

  if (!isAIParsedBudgetLines(parsed)) {
    throw new Error("Unexpected Groq response schema");
  }

  return parsed;
}
