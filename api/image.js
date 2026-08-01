const createPlaceholderImage = (prompt) => {
  const safePrompt = String(prompt || "Generated image").replace(/</g, "&lt;").slice(0, 80);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <rect width="1024" height="1024" fill="#0f172a"/>
      <rect x="64" y="64" width="896" height="896" rx="40" fill="#111827" stroke="#38bdf8" stroke-width="8"/>
      <circle cx="320" cy="360" r="140" fill="#38bdf8" opacity="0.95"/>
      <path d="M220 760c60-140 180-220 320-220s260 80 320 220" fill="#f8fafc" opacity="0.95"/>
      <text x="512" y="900" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" fill="#f8fafc">${safePrompt}</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const prompt = payload.prompt || "Create a polished visual concept";
    return res.status(200).json({ image: createPlaceholderImage(prompt) });
  } catch (error) {
    console.error("Vercel image error", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Image request failed" });
  }
}
