import type { AIParsedBudgetLines } from "@/types/aiBudget";

interface GroqMessage {
  role: "system" | "user";
  content: string;
}

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

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
        "Ets un assistent que interpreta descripcions de feines de pintura escrites en català informal.",
        "La teva feina és convertir el text de l’usuari en una llista de partides estructurades.",
        "",
        "IMPORTANT:",
        "- Retorna NOMÉS JSON vàlid.",
        "- No afegeixis explicacions.",
        "- No afegeixis markdown.",
        "- No inventis preus.",
        "- No inventis quantitats si no hi ha prou context. Si no està clar, usa quantity: null.",
        '- Si una feina no encaixa bé en una categoria coneguda, usa type: "custom".',
        "",
        "Tipus permesos:",
        '- "walls_and_ceilings"',
        '- "repair"',
        '- "doors"',
        '- "windows"',
        '- "enamel_varnish"',
        '- "exterior"',
        '- "custom"',
        "",
        "Unitats permeses:",
        '- "m²"',
        '- "unitat"',
        '- "partida"',
        "",
        "Regles:",
        '- Usa "walls_and_ceilings" per pintura general interior de parets i sostres.',
        '- Usa "repair" per reparacions, massilla, esquerdes, repassos o desperfectes.',
        '- Usa "doors" per portes.',
        '- Usa "windows" per finestres o marcs.',
        '- Usa "enamel_varnish" per esmalt, vernís, fusta o metall tractat amb esmalt o vernís.',
        '- Usa "exterior" per façanes, terrasses, paraments exteriors o similars.',
        '- Usa "custom" per feines específiques que no encaixin clarament.',
        "",
        "Quan hi hagi m² d’una estança interior general, pots transformar-los a superfície a pintar multiplicant per 3.",
        'Quan hi hagi exclusions clares (per exemple "menys la cuina de 15m2"), descompta-les abans de calcular la superfície a pintar.',
        "Quan la quantitat sigui per unitats (portes, finestres), no converteixis a m².",
        "",
        "Esquema de resposta:",
        '{ "lines": [ { "type": "walls_and_ceilings" | "repair" | "doors" | "windows" | "enamel_varnish" | "exterior" | "custom", "label": "text en català", "quantity": number | null, "unitLabel": "m²" | "unitat" | "partida" } ] }',
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
        model: "llama-3.1-8b-instant",
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
