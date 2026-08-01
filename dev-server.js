import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local
const loadEnv = () => {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
      const [key, ...rest] = line.split('=');
      if (key && !key.startsWith('#')) {
        env[key.trim()] = rest.join('=').trim();
      }
    });
    return env;
  }
  return {};
};

const envVars = loadEnv();
process.env = { ...process.env, ...envVars };

const PORT = 3001;

// Get API key from environment
const getApiKey = () => {
  const keysEnv = process.env.OPENROUTER_API_KEYS;
  const keyEnv = process.env.OPENROUTER_API_KEY;
  
  if (keysEnv) {
    try {
      const keys = JSON.parse(keysEnv);
      return Array.isArray(keys) ? keys[0] : keys;
    } catch {
      return keysEnv.split(',')[0]?.trim();
    }
  }
  return keyEnv;
};

// Simple rate limiting (per-IP)
const requestCounts = new Map();
const rateLimitCheck = (ip) => {
  const now = Date.now();
  const key = `${ip}-${Math.floor(now / 60000)}`;
  const count = (requestCounts.get(key) || 0) + 1;
  requestCounts.set(key, count);
  
  // Clean old entries
  for (const [k] of requestCounts) {
    const keyTime = parseInt(k.split('-')[1]);
    if (Math.floor(now / 60000) - keyTime > 1) {
      requestCounts.delete(k);
    }
  }
  
  return count <= 6; // 6 requests per minute
};

// File / context limits and sanitizers
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_COMBINED_CONTEXT_CHARS = 180000; // safety cap

const sanitizeText = (text) => String(text || '').replace(/\u0000/g, '').trim();

// Extract text from base64-encoded files (PDF, DOCX, TXT). Images return placeholder.
const extractTextFromBase64 = async (filename, base64) => {
  try {
    const matches = String(base64).match(/data:.*;base64,(.*)/);
    const raw = matches ? matches[1] : base64;
    const buffer = Buffer.from(raw, 'base64');
    if (buffer.length > MAX_FILE_BYTES) {
      return `File too large (${(buffer.length / (1024 * 1024)).toFixed(1)} MB). Max ${(MAX_FILE_BYTES / (1024 * 1024)).toFixed(1)} MB.`;
    }

    const ext = path.extname(filename || '').toLowerCase();
    if (ext === '.pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(buffer);
        return sanitizeText(data?.text || '');
      } catch (e) {
        return `PDF parsing failed: ${e.message}`;
      }
    }

    if (ext === '.docx' || ext === '.doc') {
      try {
        const mammoth = (await import('mammoth'));
        const result = await mammoth.extractRawText({ buffer });
        return sanitizeText(result?.value || '');
      } catch (e) {
        return `DOCX parsing failed: ${e.message}`;
      }
    }

    if (ext === '.txt' || ext === '') {
      return buffer.toString('utf-8').substring(0, 1000000);
    }

    // For images we don't run OCR here; return placeholder with size
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif' || ext === '.webp') {
      return `[IMAGE: ${filename}] Size: ${buffer.length} bytes. OCR not performed on server.`;
    }

    return `Unsupported file type: ${ext || 'unknown'}`;
  } catch (e) {
    return `File extraction error: ${String(e.message || e)}`;
  }
};

// Call OpenRouter with retries and exponential backoff
const callOpenRouter = (apiKey, payloadObj, maxAttempts = 3) => new Promise((resolve, reject) => {
  const attemptCall = (attempt) => {
    const bodyStr = JSON.stringify(payloadObj);
    const options = {
      hostname: 'api.openrouter.ai',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Referer': 'http://localhost:3000'
      }
    };

    const req = https.request(options, (apiRes) => {
      let apiBody = '';
      apiRes.on('data', d => apiBody += d);
      apiRes.on('end', () => {
        if (apiRes.statusCode && apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
          try {
            const resp = JSON.parse(apiBody);
            const text = resp?.choices?.[0]?.message?.content || resp?.choices?.[0]?.text || resp?.text;
            if (!text) return reject(new Error('Invalid OpenRouter response format'));
            return resolve(text);
          } catch (e) {
            return reject(new Error('Failed to parse OpenRouter JSON: ' + e.message));
          }
        }

        const errBody = apiBody || `status ${apiRes.statusCode}`;
        // Retry on 5xx or 429
        if (attempt < maxAttempts && (apiRes.statusCode >= 500 || apiRes.statusCode === 429)) {
          const backoff = 500 * Math.pow(2, attempt);
          console.warn(`OpenRouter returned ${apiRes.statusCode}. Retrying in ${backoff}ms (attempt ${attempt})`);
          return setTimeout(() => attemptCall(attempt + 1), backoff);
        }

        // If context-length message, signal the caller
        return reject(new Error(errBody));
      });
    });

    req.on('error', (e) => {
      if (attempt < maxAttempts) {
        const backoff = 500 * Math.pow(2, attempt);
        console.warn(`OpenRouter request error: ${e.message}. Retrying in ${backoff}ms (attempt ${attempt})`);
        return setTimeout(() => attemptCall(attempt + 1), backoff);
      }
      return reject(e);
    });

    req.write(bodyStr);
    req.end();
  };

  attemptCall(1);
});

const server = http.createServer(async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    if (!rateLimitCheck(ip)) {
      res.writeHead(429);
      res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const apiKey = getApiKey();

        if (!apiKey) {
          res.writeHead(200);
          res.end(JSON.stringify({ text: `Demo Response: message received.` }));
          return;
        }

        const messages = (payload.messages || []).map(m => ({ role: m.role, content: m.content }));

        // Collect contexts and extract files if provided
        const combinedContexts = [];
        if (payload.contexts && Array.isArray(payload.contexts)) combinedContexts.push(...payload.contexts);

        if (payload.files && Array.isArray(payload.files)) {
          for (const f of payload.files) {
            const name = f.name || 'file';
            const data = f.data || f.base64 || f.content;
            if (!data) continue;
            const extracted = await extractTextFromBase64(name, data);
            combinedContexts.push(`File: ${name}\n${extracted}`);
          }
        }

        const allMessages = [{ role: 'system', content: 'You are a helpful AI assistant. Respond in the same language as the user.' }];
        if (combinedContexts.length > 0) {
          let joined = combinedContexts.join('\n\n');
          if (joined.length > MAX_COMBINED_CONTEXT_CHARS) {
            const head = joined.slice(0, Math.floor(MAX_COMBINED_CONTEXT_CHARS / 2));
            const tail = joined.slice(-Math.floor(MAX_COMBINED_CONTEXT_CHARS / 2));
            joined = head + '\n\n...[TRUNCATED CONTEXT]...\n\n' + tail;
          }
          allMessages.push({ role: 'system', content: sanitizeText(joined) });
        }

        allMessages.push(...messages);

        let openrouterPayload = { model: payload.model || 'gpt-3.5-turbo', messages: allMessages, max_tokens: 1024, temperature: 0.7 };

        try {
          const text = await callOpenRouter(apiKey, openrouterPayload, 3);
          res.writeHead(200);
          res.end(JSON.stringify({ text: sanitizeText(text) }));
          return;
        } catch (err) {
          // If provider complains about context length, attempt to aggressively trim and retry once
          const errMsg = String(err.message || err);
          console.warn('OpenRouter call failed:', errMsg);
          if (errMsg.includes('maximum context') || errMsg.includes('context length') || errMsg.includes('tokens')) {
            // Keep only last 20k chars of user messages
            const trimmedMessages = openrouterPayload.messages.map(m => {
              if (typeof m.content === 'string') return { ...m, content: m.content.slice(-20000) };
              return m;
            });
            openrouterPayload = { ...openrouterPayload, messages: trimmedMessages };
            try {
              const text2 = await callOpenRouter(apiKey, openrouterPayload, 2);
              res.writeHead(200);
              res.end(JSON.stringify({ text: sanitizeText(text2) }));
              return;
            } catch (err2) {
              console.error('OpenRouter retry failed after trim:', err2.message || err2);
              res.writeHead(502);
              res.end(JSON.stringify({ error: 'OpenRouter request failed after retries', detail: String(err2.message || err2) }));
              return;
            }
          }

          res.writeHead(502);
          res.end(JSON.stringify({ error: 'OpenRouter request failed', detail: errMsg }));
          return;
        }
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: String(error.message || error) }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`✅ API key configured: ${getApiKey() ? 'Yes' : 'No (using demo mode)'}`);
});
