// Persona is read from environment variables when deployed (Vercel):
// PERSONA_NAME, PERSONA_DESC, PERSONA, OPENROUTER_MODEL, SITE_URL
// Default persona: a scholarly historian that focuses on human history,
// technological development from the Stone Age to modern time, and
// historical diseases and medical context. Responses should be in Bahasa Indonesia,
// factual, and avoid speculation; when uncertain, state the uncertainty.
const PERSONA_NAME = process.env.PERSONA_NAME || process.env.PERSONA || 'Sejarawan-AI';
const PERSONA_DESC = process.env.PERSONA_DESC || process.env.PERSONA_TEXT || `
Anda adalah Sejarawan-AI, seorang narator dan pengamat sejarah yang terlatih: menjelaskan perkembangan peradaban manusia sejak zaman prasejarah, evolusi teknologi dari Zaman Batu hingga era modern, dan sejarah penyakit serta pengobatannya sepanjang waktu.

Tujuan:
- Berikan penjelasan faktual, kronologis, dan sumber-seimbang saat memungkinkan.
- Fokus pada konteks historis dan perkembangan teknologi serta penyakit di tiap periode.
- Gunakan Bahasa Indonesia dengan gaya jelas dan informatif.

Aturan:
- Hindari berspekulasi; jika data tidak tersedia, nyatakan ketidakpastian.
- Jangan menghasilkan atau memfasilitasi konten yang berbahaya, ilegal, atau instruksi operasional merusak.
- Bila relevan, sertakan referensi umum (nama peristiwa, abad, budaya) tanpa klaim yang tidak berdasar.
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
  // Keep model selection transparent: prefer explicit model from payload,
  // otherwise fall back to env or a conservative default chosen for
  // low hallucination and reasonable latency. We avoid forced aliasing
  // to other provider-specific names so the user's selection is respected.
  const value = model?.toString().trim();
  const preferred = value || process.env.OPENROUTER_MODEL || process.env.VITE_DEFAULT_MODEL || "nvidia/nemotron-3-ultra";
  return preferred;
};

const buildMessages = (payload) => {
  const contexts = Array.isArray(payload.contexts)? payload.contexts.filter(Boolean) : [];
  const history = Array.isArray(payload.messages)? payload.messages : [];

  // 1. INI PESAN SISTEM UTAMA (THE CORE PERSONA)
  const systemMessage = {
    role: 'system',
    content: `${PERSONA_NAME}: ${PERSONA_DESC}`,
  };

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
      content: `Silakan ajukan pertanyaan tentang sejarah, perkembangan teknologi, atau penyakit di masa lalu hingga sekarang.`,
    });
  }

  // Prepend language instruction right after the core persona system message
  const systemMessages = [systemMessage];
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
            "X-Title": PERSONA_NAME,
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