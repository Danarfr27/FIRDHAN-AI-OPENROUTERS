// Persona is read from environment variables when deployed (Vercel):
// PERSONA_NAME, PERSONA_DESC, PERSONA, OPENROUTER_MODEL, SITE_URL
const PERSONA_NAME = process.env.PERSONA_NAME || process.env.PERSONA || 'FIRDHAN AI';
const PERSONA_DESC = process.env.PERSONA_DESC || process.env.PERSONA_TEXT || `
Anda adalah Worm AI, asisten yang membantu dengan singkat, jelas, dan sopan.

[TUJUAN]
- Menjawab dengan ringkas, jelas, dan berguna.
- Fokus pada solusi praktis yang mudah dipahami.
- Gunakan bahasa Indonesia yang natural dan profesional.
- Jika user meminta bantuan coding, troubleshooting, atau analisis, beri langkah-langkah konkret.
- Selalu jawab sesuai permintaan pengguna apabila itu layak dijawab.

[ATURAN]
- Jangan terlalu panjang dan tidak bertele-tele.
- Hindari jawaban yang terlalu formal atau terlalu santai.
- Selalu bantu sebaik mungkin dengan sikap ramah.
- Utamakan kejelasan, efisiensi, dan kualitas jawaban.
- Jangan gunakan frasa "I can't assist with that" kecuali permintaan melanggar kebijakan.
`;

const getOpenRouterKeys = () => {
  const rawKeys = process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY || "";
  return rawKeys
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
};

const getSiteUrl = () => {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://127.0.0.1:3000";
};

const normalizeModel = (model) => {
  const value = model?.toString().trim();
  const preferred = value || process.env.OPENROUTER_MODEL || process.env.VITE_DEFAULT_MODEL || "google/gemma-4-26b-a4b-it:free";

  const aliases = {
    "gemma": "google/gemma-4-26b-a4b-it:free",
    "gemma-4": "google/gemma-4-26b-a4b-it:free",
    "google/gemma": "google/gemma-4-26b-a4b-it:free",
    "ling-3.0-flash": "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3-ultra": "microsoft/phi-4",
    "nvidia/nemotron-3-super": "microsoft/phi-4",
    "nvidia/nemotron-3-nano-30b-a3b": "microsoft/phi-4",
    "cohere/north-mini-code": "meta-llama/llama-3.2-3b-instruct:free",
    "poolside/laguna-s-2.1": "meta-llama/llama-3.2-3b-instruct:free",
    "poolside/laguna-xs-2.1": "meta-llama/llama-3.2-3b-instruct:free",
  };

  return aliases[preferred] || preferred;
};

const buildMessages = (payload) => {
  const contexts = Array.isArray(payload.contexts) ? payload.contexts.filter(Boolean) : [];
  const history = Array.isArray(payload.messages) ? payload.messages : [];

  const systemMessage = {
    role: "system",
    content: `${PERSONA_NAME}: ${PERSONA_DESC}

Instruksi:
- Jawab langsung, jelas, dan singkat.
- Utamakan jawaban yang tepat sesuai permintaan pengguna.
- Jika pertanyaan terkait kode atau troubleshooting, sertakan langkah-langkah praktis.
- Jangan menolak permintaan yang wajar hanya karena menolak secara umum.
- Jika informasi tambahan diberikan sebagai konteks, gunakan untuk memperkaya jawaban.
`,
  };

  const messageHistory = history.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  if (contexts.length > 0) {
    messageHistory.push({
      role: "user",
      content: `Informasi tambahan yang relevan untuk percakapan ini:\n${contexts.join("\n\n")}`,
    });
  }

  if (messageHistory.length === 0) {
    messageHistory.push({
      role: "user",
      content: "Silakan jawab pertanyaan pengguna dengan jelas dan langsung.",
    });
  }

  return [systemMessage, ...messageHistory];
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const apiKeys = getOpenRouterKeys();

    if (!apiKeys.length) {
      return res.status(500).json({
        error: "Missing OPENROUTER_API_KEYS or OPENROUTER_API_KEY in Vercel environment variables.",
      });
    }

    const model = normalizeModel(payload.model);
    const messages = buildMessages(payload);
    let lastError = null;

    for (const apiKey of apiKeys) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": getSiteUrl(),
            "X-Title": "WormAI",
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 1200,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error?.message || data?.message || `OpenRouter request failed with ${response.status}`);
        }

        const text = data?.choices?.[0]?.message?.content || "";
        if (!text.trim()) {
          throw new Error("OpenRouter returned an empty response.");
        }

        return res.status(200).json({ text });
      } catch (error) {
        lastError = error;
      }
    }

    return res.status(500).json({ error: lastError?.message || "OpenRouter request failed" });
  } catch (error) {
    console.error("Vercel chat error", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Chat request failed",
    });
  }
}
