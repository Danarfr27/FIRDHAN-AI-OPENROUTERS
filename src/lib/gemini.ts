import { GoogleGenerativeAI, type Content } from "@google/generative-ai";

export type GeminiModel = "google/gemma-4-26b-a4b-it:free";

// Support multiple API keys via VITE_GEMINI_API_KEYS (JSON array or comma-separated)
const rawKeys = import.meta.env.VITE_GEMINI_API_KEYS ?? import.meta.env.VITE_GEMINI_API_KEY;

if (!rawKeys) {
  throw new Error("VITE_GEMINI_API_KEY or VITE_GEMINI_API_KEYS environment variable is not set");
}

function parseKeys(raw: string): string[] {
  const cleaned = raw.trim().replace(/^['"]+|['"]+$/g, "");

  // Try JSON array first
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // ignore
  }

  // Fallback: comma separated values
  return cleaned
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const apiKeys = parseKeys(rawKeys);

if (apiKeys.length === 0) {
  throw new Error("No valid Gemini API keys found in environment");
}

// Create a client for each API key
const clients = apiKeys.map((k) => new GoogleGenerativeAI(k));

export interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export class GeminiService {
  private currentModel: GeminiModel = "google/gemma-4-26b-a4b-it:free";
  private clientIndex = 0;

  private getClient() {
    return clients[this.clientIndex];
  }

  private rotateClient() {
    this.clientIndex = (this.clientIndex + 1) % clients.length;
    return this.getClient();
  }

  setModel(model: GeminiModel) {
    this.currentModel = model;
  }

  private getModel() {
    return this.getClient().getGenerativeModel({ model: this.currentModel });
  }

  private isRateLimitError(err: any) {
    if (!err) return false;
    const msg = String(err?.message || err?.toString() || "").toLowerCase();
    if (msg.includes("rate") || msg.includes("quota") || msg.includes("limit") || msg.includes("429")) return true;
    if (err?.status === 429) return true;
    if (err?.response?.status === 429) return true;
    return false;
  }

  // Try an operation, rotate keys on rate-limit errors up to number of keys
  private async withKeyRotation<T>(fn: () => Promise<T>): Promise<T> {
    const attempts = clients.length;
    let lastError: any = null;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (this.isRateLimitError(err) && clients.length > 1) {
          console.warn(`API key at index ${this.clientIndex} rate-limited, rotating to next key.`);
          this.rotateClient();
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  async generateContent(prompt: string): Promise<string> {
    return await this.withKeyRotation(async () => {
      const result = await this.getModel().generateContent(prompt);
      const response = result.response;
      return response.text();
    });
  }

  async startChat(history: GeminiMessage[] = []) {
    // Create chat on current client/model
    const preservedHistory = history ? [...history] : [];
    let chat = this.getModel().startChat({ history: preservedHistory as Content[] });

    return {
      sendMessage: async (userMessage: string): Promise<string> => {
        // Wrap sendMessage with rotation logic
        return await this.withKeyRotation(async () => {
          try {
            const result = await chat.sendMessage(userMessage);
            const response = result.response;
            return response.text();
          } catch (err) {
            // If rate-limited, throw to let withKeyRotation rotate and retry
            throw err;
          }
        }).catch(async (err) => {
          // If rotation happened, recreate chat with preserved history and retry once
          if (this.isRateLimitError(err) && clients.length > 1) {
            const prevHistory = chat.getHistory ? await chat.getHistory() : [];
            const combined: Content[] = [
              ...(Array.isArray(prevHistory) ? (prevHistory as Content[]) : []),
              { role: "user", parts: [{ text: userMessage }] } as unknown as Content,
            ];
            chat = this.getModel().startChat({ history: combined });
            const result = await chat.sendMessage(userMessage);
            return result.response.text();
          }
          throw err;
        });
      },
      getHistory: () => chat.getHistory(),
    };
  }

  async streamContent(prompt: string) {
    return await this.withKeyRotation(async () => {
      const result = await this.getModel().generateContentStream(prompt);
      return result;
    });
  }
}

export const geminiService = new GeminiService();
