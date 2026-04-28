import type { GroqMessage, GroqResponse } from "@/types/groq";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getGroqContent(data: unknown): string | null {
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

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";

export type GroqResponseFormat = "json_object";

export async function callGroq(
  messages: GroqMessage[],
  opts?: {
    apiKey?: string;
    model?: string;
    temperature?: number;
    responseFormat?: GroqResponseFormat;
  }
): Promise<string> {
  const apiKey = opts?.apiKey ?? process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY");
  }

  const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: opts?.model ?? GROQ_DEFAULT_MODEL,
      temperature: opts?.temperature ?? 0,
      messages,
      ...(opts?.responseFormat
        ? { response_format: { type: opts.responseFormat } }
        : null),
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq request failed (${response.status})`);
  }

  const data = (await response.json()) as GroqResponse;
  const content = getGroqContent(data);
  if (!content) {
    throw new Error("Empty Groq response");
  }

  return content;
}

