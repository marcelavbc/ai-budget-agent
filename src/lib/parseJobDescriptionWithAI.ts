import { ParsedJob, WallCondition } from "@/types/budget";

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

interface AIParsedJob {
  jobType?: string;
  areaM2?: number | null;
  color?: string | null;
  wallCondition?: string | null;
}

function normalizeWallCondition(value: string | null | undefined): WallCondition | null {
  if (!value) return null;

  const normalized = value.toLowerCase().trim();

  if (normalized === "good") return "good";
  if (normalized === "medium") return "medium";
  if (normalized === "bad") return "bad";

  return null;
}

function safeParsedJob(data: AIParsedJob): ParsedJob {
  return {
    jobType: "interior_painting",
    areaM2: typeof data.areaM2 === "number" ? data.areaM2 : null,
    color: typeof data.color === "string" && data.color.trim() ? data.color.trim() : null,
    wallCondition: normalizeWallCondition(data.wallCondition),
  };
}

export async function parseJobDescriptionWithAI(
  description: string,
): Promise<ParsedJob> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY");
  }

  const messages: GroqMessage[] = [
    {
      role: "system",
      content: [
        "You extract structured data from painting job descriptions written in Catalan.",
        "Return JSON only.",
        "Do not include markdown.",
        "Do not include explanations.",
        "",
        "Return this exact schema:",
        '{ "jobType": "interior_painting", "areaM2": number|null, "color": string|null, "wallCondition": "good"|"medium"|"bad"|null }',
        "",
        "Rules:",
        "- The input may be informal Catalan.",
        "- jobType must always be interior_painting.",
        "- areaM2 should be a number when reasonably clear, otherwise null.",
        "- color should preserve the user language when possible.",
        '- wallCondition must be one of: "good", "medium", "bad", or null.',
        "- If the wall condition is ambiguous, return null.",
        "- Do not invent missing information.",
      ].join("\n"),
    },
    {
      role: "user",
      content: description,
    },
  ];

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
  });

  if (!response.ok) {
    throw new Error("Groq request failed");
  }

  const data = (await response.json()) as GroqResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty Groq response");
  }

  const parsed = JSON.parse(content) as AIParsedJob;

  return safeParsedJob(parsed);
}