import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
} from 'recharts';

interface VramItem {
  name: string;
  value: number;
  max: string;
}

interface ChatSessionItem {
  id: string;
  title: string;
  preview: string;
  updatedAt: number;
}

const ACTIVE_SESSION_KEY = 'firdhan_active_chat_session';
const CHAT_HISTORY_KEY = 'firdhan_chat_history_v1';

const vramData: VramItem[] = [
  { name: 'Opus 4.7 (Active)', value: 85, max: '24GB' },
  { name: 'Deepseek', value: 60, max: '18GB' },
  { name: 'GPT-4', value: 70, max: '20GB' },
  { name: 'Llama 3 70B', value: 55, max: '16GB' },
];

const readChatHistory = (): ChatSessionItem[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) {
      return [
        { id: '#0427', title: 'Forensic Artifact ...', preview: 'Analisis Sistem Diperdalam.', updatedAt: Date.now() },
        { id: '#0426', title: 'Malware Analysis', preview: 'Analisis malware dan perilaku ancaman.', updatedAt: Date.now() - 1000 },
        { id: '#0425', title: 'Code Review', preview: 'Review kode dan audit keamanan.', updatedAt: Date.now() - 2000 },
        { id: '#0424', title: 'Pentest Plan', preview: 'Perencanaan penetrasi testing.', updatedAt: Date.now() - 3000 },
        { id: '#0423', title: 'OSINT Query', preview: 'Open Source Intelligence gathering.', updatedAt: Date.now() - 4000 },
      ];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is ChatSessionItem =>
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

const readActiveSession = () => {
  if (typeof window === 'undefined') return '#0427';
  return window.localStorage.getItem(ACTIVE_SESSION_KEY) || '#0427';
};

const formatTimestamp = (value: number) => {
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const generateGpuData = () => {
  const data = [];
  for (let i = 0; i < 30; i++) {
    data.push({
      time: i,
      value: 40 + Math.random() * 50,
    });
  }
  return data;
};

export default function SystemInfo() {
  const [gpuData, setGpuData] = useState(generateGpuData());
  const [chatSessions, setChatSessions] = useState<ChatSessionItem[]>(() => readChatHistory());
  const [activeSession, setActiveSession] = useState<string>(() => readActiveSession());

  useEffect(() => {
    const syncHistory = () => {
      setChatSessions(readChatHistory());
      setActiveSession(readActiveSession());
    };

    const handleSessionChange = (event: Event) => {
      const detail = (event as CustomEvent<{ sessionId?: string }>).detail;
      if (detail?.sessionId) {
        setActiveSession(detail.sessionId);
      }
    };

    window.addEventListener('storage', syncHistory);
    window.addEventListener('firdhan-chat-session-change', handleSessionChange);
    window.addEventListener('firdhan-chat-history-updated', syncHistory);

    return () => {
      window.removeEventListener('storage', syncHistory);
      window.removeEventListener('firdhan-chat-session-change', handleSessionChange);
      window.removeEventListener('firdhan-chat-history-updated', syncHistory);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setGpuData((prev) => {
        const newData = [...prev.slice(1)];
        newData.push({
          time: prev[prev.length - 1].time + 1,
          value: 40 + Math.random() * 50,
        });
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const gpuAverage = useMemo(() => {
    const sum = gpuData.reduce((acc, d) => acc + d.value, 0);
    return Math.round(sum / gpuData.length);
  }, [gpuData]);

  const selectSession = (sessionId: string) => {
    setActiveSession(sessionId);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
      window.dispatchEvent(new CustomEvent('firdhan-chat-session-change', { detail: { sessionId } }));
    }
  };

  const createNewChat = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firdhan-new-chat-request'));
    }
  };

  return (
    <div className="panel p-2.5 flex flex-col gap-2.5 animate-fade-in-up stagger-1" style={{ width: 280, minWidth: 280, height: '100%' }}>
      <div>
        <h3
          className="font-mono text-[11px] font-semibold tracking-widest mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          VRAM ALLOCATION
        </h3>
        <div className="flex flex-col gap-2">
          {vramData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="font-mono text-[11px] w-[110px] shrink-0 truncate"
                style={{ color: 'var(--text-secondary)' }}
              >
                {item.name}
              </span>
              <div
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: '#1a1a2e' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.value}%`,
                    background: 'linear-gradient(90deg, var(--accent-green), var(--accent-green-dim))',
                  }}
                />
              </div>
              <span
                className="font-mono text-[10px] w-8 text-right shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                {item.max}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3
          className="font-mono text-[11px] font-semibold tracking-widest mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          GPU CORE LOAD
        </h3>
        <div className="panel-inner p-2" style={{ height: 100 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={gpuData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <defs>
                <linearGradient id="gpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff88" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={[0, 100]} hide />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#00ff88"
                strokeWidth={1.5}
                fill="url(#gpuGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-end mt-1">
          <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
            AVG: {gpuAverage}%
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <div className="flex items-center justify-between mb-2">
          <h3
            className="font-mono text-[11px] font-semibold tracking-widest"
            style={{ color: 'var(--text-primary)' }}
          >
            CHAT HISTORY
          </h3>
          <button
            type="button"
            onClick={createNewChat}
            className="btn-green px-2 py-1 text-[9px]"
            style={{ borderRadius: 4 }}
          >
            NEW
          </button>
        </div>

        <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
          {chatSessions.length === 0 ? (
            <div
              className="rounded-md border border-dashed border-white/10 px-2 py-3 text-center font-mono text-[10px]"
              style={{ color: 'var(--text-muted)' }}
            >
              No saved chat
            </div>
          ) : (
            chatSessions.map((session) => {
              const isActive = activeSession === session.id;

              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => selectSession(session.id)}
                  className="group w-full rounded-md border text-left px-2.5 py-2 transition-all duration-200"
                  style={{
                    background: isActive ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255,255,255,0.01)',
                    borderColor: isActive ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255,255,255,0.06)',
                    boxShadow: isActive ? 'inset 0 0 0 1px rgba(0,255,136,0.08)' : 'none',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="font-mono text-[11px] truncate block"
                      style={{
                        color: isActive ? 'var(--accent-green)' : 'var(--text-secondary)',
                      }}
                    >
                      {session.title || `Sesi ${session.id}`}
                    </span>
                    <span className="font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>
                      {formatTimestamp(session.updatedAt)}
                    </span>
                  </div>

                  {session.preview && (
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span
                        className="block max-w-[170px] truncate font-mono text-[9px]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {session.preview}
                      </span>
                      <span
                        className="inline-flex h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ background: isActive ? 'var(--accent-green)' : 'rgba(255,255,255,0.2)' }}
                      />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
