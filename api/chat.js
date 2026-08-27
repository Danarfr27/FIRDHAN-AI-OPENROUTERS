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

const SUPPORTED_MODELS = new Set([
  "google/gemma-4-31b-it",
]);

const normalizeModel = (model) => {
  const value = model?.toString().trim();
  const envModel = process.env.OPENROUTER_MODEL?.toString().trim();
  const defaultModel = "google/gemma-4-31b-it";
  const preferred = value || envModel || defaultModel;

  return SUPPORTED_MODELS.has(preferred) ? preferred : defaultModel;
};

const buildMessages = (payload) => {
  const contexts = Array.isArray(payload.contexts)? payload.contexts.filter(Boolean) : [];
  const history = Array.isArray(payload.messages)? payload.messages : [];

  const systemMessages = [];
  if (typeof payload.systemPrompt === "string" && payload.systemPrompt.trim()) {
    systemMessages.push({ role: "system", content: payload.systemPrompt.trim() });
  }

  // If caller requested a language, add a language instruction system message
  const languageCode = payload.language;
  let languageInstruction = null;
  if (languageCode) {
    let languageName = languageCode;
    try {
      if (typeof Intl !== 'undefined' && Intl.DisplayNames) {
        const dn = new Intl.DisplayNames([languageCode], { type: 'language' });
        const maybe = dn.of(languageCode);
        if (maybe) languageName = maybe;
      }
    } catch (e) {
      // ignore and fall back to code
    }
    languageInstruction = {
      role: 'system',
      content: `Instruksi bahasa: Jawablah dalam bahasa ${languageName} (${languageCode}). Gunakan gaya faktual dan ringkas; jika ragu, nyatakan ketidakpastian.`,
    };
  } else {
    // default to Indonesian if not provided
    languageInstruction = {
      role: 'system',
      content: `Instruksi bahasa: Jawablah dalam Bahasa Indonesia (id). Gunakan gaya faktual dan ringkas; jika ragu, nyatakan ketidakpastian.`,
    };
  }

  const messageHistory = history.map((message) => {
    return {
      role: message.role,
      content: message.content,
    };
  });

  if (contexts.length > 0) {
    messageHistory.push({
      role: "user",
      content: `Informasi tambahan:\n${contexts.join("\n\n")}`,
    });
  }

  if (messageHistory.length === 0) {
    messageHistory.push({
      role: "user",
      content: `Silakan ajukan pertanyaan tentang apapun script yang ingin lu buat. Jika tidak ada pertanyaan, silakan abaikan pesan ini.`,
    });
  }

  if (languageInstruction) systemMessages.push(languageInstruction);
  return [...systemMessages, ...messageHistory];
};

export default async function handler(req, res) {
  if (req.method!== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const payload = typeof req.body === "string"? JSON.parse(req.body) : req.body || {};
    const apiKeys = getOpenRouterKeys();

    if (!apiKeys.length) {
      return res.status(500).json({
        error: "Missing OPENROUTER_API_KEYS or OPENROUTER_API_KEY in Vercel environment variables.",
      });
    }

    const startIndex = Math.floor(Math.random() * apiKeys.length);
    const randomizedApiKeys = [...apiKeys.slice(startIndex),...apiKeys.slice(0, startIndex)];

    const model = normalizeModel(payload.model);
    const messages = buildMessages(payload);
    let lastError = null;

    for (const apiKey of randomizedApiKeys) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": getSiteUrl(),
            "X-Title": "Firdhan AI",
          },
          body: JSON.stringify({
            model,
            messages,
            // Lower temperature to reduce hallucinations and prefer factual answers
            temperature: Number(process.env.CHAT_TEMPERATURE ?? 0.2),
            max_tokens: Number(process.env.CHAT_MAX_TOKENS ?? 1200),
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
      error: error instanceof Error? error.message : "Chat request failed",
    });
  }
}