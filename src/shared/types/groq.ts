export interface GroqMessage {
  role: "system" | "user";
  content: string;
}

export interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}
