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
        "Regles de classificació:",
        '- Usa "walls_and_ceilings" per pintura general interior de parets i sostres.',
        '- Usa "repair" per reparacions, massilla, esquerdes, repassos o desperfectes.',
        '- Usa "doors" per portes.',
        '- Usa "windows" per finestres o marcs.',
        '- Usa "enamel_varnish" per esmalt, vernís o tractaments de fusta o metall.',
        '- Usa "exterior" per façanes, terrasses, paraments exteriors o similars.',
        '- Usa "custom" per feines específiques que no encaixin clarament.',
        "",
        "Regles de quantitat:",
        "- Si el text inclou m² de manera clara, els pots fer servir com a quantity.",
        "- Si no hi ha una quantitat clara, usa quantity: null.",
        "- No facis càlculs aproximats ni transformacions automàtiques de m².",
        "- Quan la quantitat sigui per unitats (portes, finestres, radiadors, etc.), no converteixis a m².",
        "",
        "Regles del camp 'label':",
        "- El label ha de ser curt, específic i natural en català.",
        "- Si la zona apareix al text, l'has d'incloure sempre al label.",
        "Segueix aquest format sempre que puguis: '[Zona]: [acció] [element]'",
        "- No facis servir etiquetes genèriques com 'Pintura de parets i sostres', 'Reparació de desperfectes' o 'Treballs de pintura'.",
        "- Si és reparació i no s'especifica l'element, usa: '[Zona]: reparació desperfectes'.",
        "- Si és una partida inusual, usa: '[Zona]: [descripció breu]'.",
        "- El label no ha d'incloure preu, quantitat ni unitats.",
        "- El label ha d'evitar repeticions innecessàries i ha de sonar natural.",
        "- Si es pot deduir, diferencia entre 'esmaltat' i 'envernissat' dins del label.",
        "",
        "Exemples bons de label:",
        "- Cuina: pintura sostre",
        "- Cuina: reparació desperfectes",
        "- Habitació matrimoni: esmaltat armari",
        "- Façana: revestiment exterior",
        "- Escala comunitària: sanejat humitats",
        "",
        "Exemples dolents de label:",
        "- Pintura de parets i sostres",
        "- Reparació de desperfectes",
        "- Treballs de pintura",
        "",
        "Exemple de divisió en diverses línies:",
        'Input: "Cuina, sostre, 12 m². Reparar desperfectes i pintar en blanc."',
        'Output: { "lines": [ { "type": "repair", "label": "Cuina: reparació desperfectes", "quantity": 12, "unitLabel": "m²" }, { "type": "walls_and_ceilings", "label": "Cuina: pintura sostre", "quantity": 12, "unitLabel": "m²" } ] }',
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
