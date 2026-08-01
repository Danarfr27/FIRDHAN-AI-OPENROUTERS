import { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle, Play, Paperclip, Zap, X, Copy, Check } from 'lucide-react';
import { useModel } from '@/contexts/ModelContext';

interface MainConsoleProps {
  activeSession: string;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ContextItem {
  id: string;
  content: string;
  fileName: string;
}

const sessionData: Record<string, { title: string; welcomeText: string }> = {
  '#0427': {
    title: 'Forensic Artifact Analysis',
    welcomeText: "Analisis Sistem Diperdalam.",
  },
  '#0426': {
    title: 'Malware Analysis',
    welcomeText: "Analisis malware dan perilaku ancaman.",
  },
  '#0425': {
    title: 'Code Review',
    welcomeText: "Review kode dan audit keamanan.",
  },
  '#0424': {
    title: 'Pentest Plan',
    welcomeText: "Perencanaan penetrasi testing.",
  },
  '#0423': {
    title: 'OSINT Query',
    welcomeText: "Open Source Intelligence gathering.",
  },
};

// Helper functions for file parsing
const normalizeExtractedText = (text: string, fallbackName: string, maxChars = 12000): string => {
  const cleaned = String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!cleaned) {
    return `[FILE: ${fallbackName}] No readable text found in the file.`;
  }

  if (cleaned.length > maxChars) {
    return `${cleaned.slice(0, maxChars)}\n\n...[TRUNCATED: too long for context]`;
  }

  return cleaned;
};

const extractTextFromFile = async (file: File): Promise<string> => {
  const fileName = file.name.toLowerCase();
  const fileType = file.type || '';

  if (fileType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv')) {
    const text = await file.text();
    return normalizeExtractedText(text, file.name, 20000);
  }

  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    const pdfjs = (await import('pdfjs-dist')) as any;
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (pageText) {
        pages.push(pageText);
      }
    }

    return normalizeExtractedText(pages.join('\n\n'), file.name, 20000);
  }

  if (fileType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return normalizeExtractedText(result.value, file.name, 20000);
  }

  if (fileType.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(fileName)) {
    const { default: Tesseract } = await import('tesseract.js');
    const result = await Tesseract.recognize(file, 'eng+ind');
    return normalizeExtractedText(result.data.text || '', file.name, 20000);
  }

  return `[FILE: ${file.name}] Unsupported file type: ${fileType || 'unknown'}`;
};

const CHAT_STORAGE_PREFIX = 'firdhan_chat_session_';
const ACTIVE_SESSION_KEY = 'firdhan_active_chat_session';
const CHAT_HISTORY_KEY = 'firdhan_chat_history_v1';

const readStoredSessionMessages = (sessionId: string): ConversationMessage[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(`${CHAT_STORAGE_PREFIX}${sessionId}`);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is ConversationMessage =>
      Boolean(item) &&
      typeof item === 'object' &&
      (item.role === 'user' || item.role === 'assistant') &&
      typeof item.content === 'string'
    );
  } catch {
    return [];
  }
};

const readChatHistory = (): Array<{ id: string; title: string; preview: string; updatedAt: number }> => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is { id: string; title: string; preview: string; updatedAt: number } =>
      Boolean(item) &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.title === 'string' &&
      typeof item.preview === 'string' &&
      typeof item.updatedAt === 'number'
    );
  } catch {
    return [];
  }
};

const persistChatHistory = (id: string, title: string, preview: string) => {
  if (typeof window === 'undefined') return;

  const history = readChatHistory();
  const next = [
    { id, title, preview, updatedAt: Date.now() },
    ...history.filter((item) => item.id !== id),
  ].sort((a, b) => b.updatedAt - a.updatedAt);

  window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(next));
};

export default function MainConsole({ activeSession }: MainConsoleProps) {
  const [inputValue, setInputValue] = useState('');
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>(() =>
    readStoredSessionMessages(activeSession || '#0427')
  );
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [copiedMessageKey, setCopiedMessageKey] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return activeSession || '#0427';
    return window.localStorage.getItem(ACTIVE_SESSION_KEY) || activeSession || '#0427';
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitInFlightRef = useRef(false);
  const session = sessionData[activeSessionId] || sessionData['#0427'];
  const { selectedModel } = useModel();

  const emitHistoryUpdate = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firdhan-chat-history-updated'));
    }
  }, []);

  const syncActiveSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setConversationMessages(readStoredSessionMessages(sessionId));
    setContexts([]);
    setInputValue('');
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
    }
  }, []);

  const createNewChat = useCallback(() => {
    const nextId = `#${Date.now().toString(36)}`;
    const title = `New Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    persistChatHistory(nextId, title, 'Chat baru dimulai.');
    emitHistoryUpdate();
    syncActiveSession(nextId);
    window.dispatchEvent(new CustomEvent('firdhan-chat-session-change', { detail: { sessionId: nextId } }));
  }, [emitHistoryUpdate, syncActiveSession]);

  useEffect(() => {
    const handleSessionSync = (event: Event) => {
      const detail = (event as CustomEvent<{ sessionId?: string }>).detail;
      if (detail?.sessionId) {
        setActiveSessionId(detail.sessionId);
        setConversationMessages(readStoredSessionMessages(detail.sessionId));
        setContexts([]);
        setInputValue('');
      }
    };

    const handleNewChat = () => {
      createNewChat();
    };

    window.addEventListener('firdhan-chat-session-change', handleSessionSync);
    window.addEventListener('firdhan-new-chat-request', handleNewChat);

    return () => {
      window.removeEventListener('firdhan-chat-session-change', handleSessionSync);
      window.removeEventListener('firdhan-new-chat-request', handleNewChat);
    };
  }, [createNewChat]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
      window.localStorage.setItem(`${CHAT_STORAGE_PREFIX}${activeSessionId}`, JSON.stringify(conversationMessages));
    }
  }, [activeSessionId, conversationMessages]);

  useEffect(() => {
    if (activeSession && activeSession !== activeSessionId) {
      syncActiveSession(activeSession);
    }
  }, [activeSession, activeSessionId, syncActiveSession]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsProcessingFile(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extractedText = await extractTextFromFile(file);

        const contextItem: ContextItem = {
          id: Date.now().toString() + Math.random(),
          content: extractedText,
          fileName: file.name,
        };

        setContexts((prev) => [...prev, contextItem]);
      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  const removeContext = useCallback((id: string) => {
    setContexts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleExecute = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || submitInFlightRef.current) return;

    submitInFlightRef.current = true;
    setIsLoading(true);

    try {
      const userMessage = { role: 'user' as const, content: trimmed };
      const nextMessages = [...conversationMessages, userMessage];
      const preview = trimmed.length > 48 ? `${trimmed.slice(0, 48).trim()}…` : trimmed;
      setConversationMessages(nextMessages);
      persistChatHistory(activeSessionId, preview, trimmed);
      emitHistoryUpdate();
      setInputValue('');

      const payload = {
        model: selectedModel,
        mode: 'chat' as const,
        contexts: contexts.map((c) => c.content),
        messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant' as const,
        content: data.text || 'No response received',
      };

      const finalMessages = [...nextMessages, assistantMessage];
      setConversationMessages(finalMessages);
      const assistantPreview = assistantMessage.content.length > 48 ? `${assistantMessage.content.slice(0, 48).trim()}…` : assistantMessage.content;
      persistChatHistory(activeSessionId, assistantPreview, assistantMessage.content);
      emitHistoryUpdate();
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`${CHAT_STORAGE_PREFIX}${activeSessionId}`, JSON.stringify(finalMessages));
      }
    } catch (error) {
      const errorMessage = {
        role: 'assistant' as const,
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      const finalMessages = [...conversationMessages, errorMessage];
      setConversationMessages(finalMessages);
      persistChatHistory(activeSessionId, 'Error response', errorMessage.content);
      emitHistoryUpdate();
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`${CHAT_STORAGE_PREFIX}${activeSessionId}`, JSON.stringify(finalMessages));
      }
    } finally {
      setIsLoading(false);
      submitInFlightRef.current = false;
    }
  }, [activeSessionId, conversationMessages, contexts, inputValue, selectedModel, emitHistoryUpdate]);

  const handleSubmitFromKeyboard = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleExecute();
    }
  }, [handleExecute]);

  const handleCopyMessage = useCallback(async (content: string, key: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageKey(key);
      window.setTimeout(() => setCopiedMessageKey((prev) => (prev === key ? null : prev)), 1200);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedMessageKey(key);
      window.setTimeout(() => setCopiedMessageKey((prev) => (prev === key ? null : prev)), 1200);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSessionId, conversationMessages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  return (
    <div
      className="panel flex flex-col relative animate-fade-in-up stagger-2 min-h-0"
      style={{ flex: 1, minWidth: 0, height: '100%' }}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: 'var(--border-panel)' }}>
        <div className="flex items-center gap-2">
          <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} />
          <span className="font-mono text-[11px] font-semibold" style={{ color: 'var(--accent-green)' }}>
            {session.title || 'FIRDHAN AI'}
          </span>
        </div>

        <button
          type="button"
          onClick={createNewChat}
          className="btn-green px-2.5 py-1.5 text-[10px]"
          style={{ letterSpacing: '0.12em' }}
        >
          NEW CHAT
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-2.5 scroll-smooth"
        style={{ maxHeight: '100%' }}
      >
        {conversationMessages.length === 0 && (
          <div className="mb-4 rounded-md border border-green-500/20 bg-green-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} />
              <span className="font-mono text-[11px] font-semibold" style={{ color: 'var(--accent-green)' }}>
                FIRDHAN AI v5.0 // OPUS 4.0
              </span>
            </div>

            <p className="font-mono text-xs mb-3" style={{ color: 'var(--accent-green)' }}>
              [SYSTEM INITIALIZED]
            </p>

            <div className="font-mono text-[13px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              <p className="mb-1">
                Selamat datang di FIRDHAN AI v5.0 'Advanced Ops'. {session.welcomeText}
              </p>
              <p className="mb-3">
                Sesi {activeSessionId} Aktif.
              </p>
              <p className="mb-1">Status: Semua sistem operasional dengan pemantauan dinamis.</p>
              <p className="mb-1">Model: Opus 4.7 (Optimal)</p>
              <p className="mb-4">Konteks: Penggunaan 128k dikelola secara adaptif.</p>
              <p style={{ color: 'var(--text-secondary)' }}>
                Ketik{' '}
                <span className="inline-block px-1.5 py-0.5 rounded font-mono text-xs font-medium" style={{ background: 'rgba(0, 255, 136, 0.15)', color: 'var(--accent-green)', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
                  /help
                </span>{' '}
                untuk daftar perintah tingkat lanjut, atau{' '}
                <span className="inline-block px-1.5 py-0.5 rounded font-mono text-xs font-medium" style={{ background: 'rgba(0, 255, 136, 0.15)', color: 'var(--accent-green)', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
                  /compare
                </span>{' '}
                untuk perbandingan model.
              </p>
            </div>
          </div>
        )}

        {contexts.length > 0 && (
          <div className="mb-4 p-3 rounded-md" style={{ background: 'rgba(0, 200, 200, 0.1)', border: '1px solid rgba(0, 200, 200, 0.3)' }}>
            <div className="font-mono text-xs mb-2" style={{ color: 'var(--accent-cyan)' }}>
              LOADED CONTEXTS ({contexts.length}):
            </div>
            <div className="space-y-1">
              {contexts.map((ctx) => (
                <div key={ctx.id} className="flex items-center justify-between gap-2 text-xs bg-black/30 p-2 rounded-md">
                  <span style={{ color: 'var(--text-secondary)' }} className="truncate font-mono">
                    [{ctx.fileName}] - {ctx.content.substring(0, 40)}...
                  </span>
                  <button
                    onClick={() => removeContext(ctx.id)}
                    className="p-1 hover:bg-red-900/50 rounded transition-colors shrink-0"
                    style={{ color: 'var(--accent-red, #ff6b6b)' }}
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {conversationMessages.map((msg, idx) => {
          const key = `${msg.role}-${idx}`;
          const isCopied = copiedMessageKey === key;

          return (
            <div key={key} className="mb-4 font-mono text-sm">
              <div className="mb-1 flex items-center justify-between gap-2" style={{ color: msg.role === 'user' ? 'var(--accent-green)' : 'var(--accent-cyan)' }}>
                <span className="font-semibold">{msg.role === 'user' ? '> USER' : '> AI'}:</span>
                <button
                  type="button"
                  onClick={() => void handleCopyMessage(msg.content, key)}
                  className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] transition-colors hover:bg-white/10"
                  style={{ color: isCopied ? 'var(--accent-green)' : 'var(--text-muted)' }}
                  title="Copy message"
                >
                  {isCopied ? <Check size={11} /> : <Copy size={11} />}
                  {isCopied ? 'COPIED' : 'COPY'}
                </button>
              </div>
              <div className="rounded-md border border-white/5 bg-black/10 px-3 py-2 leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--text-primary)' }}>
                {msg.content}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="mb-4 font-mono text-sm animate-pulse">
            <div style={{ color: 'var(--accent-cyan)' }}>
              <span className="font-semibold">{'> AI'}:</span>
            </div>
            <div className="rounded-md border border-white/5 bg-black/10 px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
              Processing request...
            </div>
          </div>
        )}

      </div>

      <div className="p-2.5" style={{ borderTop: '1px solid var(--border-panel)' }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.gif,.webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isProcessingFile}
        />

        <div className="panel-inner flex items-end gap-2 px-2.5 py-2" style={{ minHeight: 56 }}>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleSubmitFromKeyboard}
            placeholder="Masukkan perintah, seret file, atau tempel kode..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none overflow-hidden font-mono text-[13px] leading-5"
            style={{ color: 'var(--text-primary)', maxHeight: 120 }}
            disabled={isLoading}
          />

          <button
            className="p-1.5 rounded transition-colors hover:bg-white/5 shrink-0"
            style={{ color: isProcessingFile ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingFile}
            title="Upload PDF, Word, Image untuk add context"
          >
            <Paperclip size={16} />
          </button>

          <button className="btn-green flex items-center gap-1.5 shrink-0" type="button">
            <Zap size={12} />
            OPTIMIZE
          </button>

          <button
            className="btn-cyan flex items-center gap-1.5 shrink-0"
            type="button"
            onClick={() => {
              void handleExecute();
            }}
            disabled={isLoading}
            data-testid="execute-button"
          >
            <Play size={12} />
            {isLoading ? 'PROCESSING' : 'EXECUTE'}
          </button>
        </div>
      </div>
    </div>
  );
}
