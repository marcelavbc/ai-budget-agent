import type { AIParsedBudgetLines } from "@/types/aiBudget";
import type { GroqMessage, GroqResponse } from "@/types/groq";

export async function parseBudgetLinesWithAI(
  description: string
): Promise<AIParsedBudgetLines> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY");
  }

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
        '- Use "repair" for repairs, filler, cracks, touch-ups, or damage.',
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
        "Response schema:",
        '{ "lines": [ { "type": "walls_and_ceilings" | "repair" | "doors" | "windows" | "enamel_varnish" | "exterior" | "custom", "label": "text in Catalan", "quantity": number | null, "unitLabel": "m²" | "unitat" | "partida" } ] }',
      ].join("\n"),
    },
    {
      role: "user",
      content: description,
    },
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
        response_format: { type: "json_object" },
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Groq request failed");
  }

  const data = (await response.json()) as GroqResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty Groq response");
  }

  return JSON.parse(content) as AIParsedBudgetLines;
}
