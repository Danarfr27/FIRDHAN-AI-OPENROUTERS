import { useState, useEffect, useRef } from 'react';

interface LogEntry {
  id: number;
  timestamp: string;
  tag: string;
  tagColor: string;
  message: string;
}

const initialLogs: LogEntry[] = [
  {
    id: 1,
    timestamp: '14:22:07',
    tag: '',
    tagColor: '',
    message: 'Penggunaan token saat ini: 74.5k/128k.',
  },
  {
    id: 2,
    timestamp: '14:22:07',
    tag: 'MODEL',
    tagColor: '#00d4ff',
    message: 'Menghasilkan laporan analitik...',
  },
  {
    id: 3,
    timestamp: '14:22:05',
    tag: 'LOG',
    tagColor: '#f59e0b',
    message: 'Artefak file dicurigai dianalisis dalam kotak pasir.',
  },
  {
    id: 4,
    timestamp: '14:22:04',
    tag: 'GPU',
    tagColor: '#00ff88',
    message: 'Pemanfaatan inti GPU mencapai 88%...',
  },
  {
    id: 5,
    timestamp: '14:22:03',
    tag: 'API',
    tagColor: '#00d4ff',
    message: "Kueri mesin pencari: 'Windows 11 registry keys for malware persistence'...",
  },
  {
    id: 6,
    timestamp: '14:22:03',
    tag: 'SYSTEM',
    tagColor: '#00ff88',
    message: 'Konfigurasi Google Gemma 4 31B IT diperbarui.',
  },
  {
    id: 7,
    timestamp: '14:22:01',
    tag: 'GPU',
    tagColor: '#00ff88',
    message: 'Konfigurasi Google Gemma 4 31B IT diperbarui.',
  },
];

const newLogMessages = [
  { tag: 'GPU', tagColor: '#00ff88', message: 'Pemanfaatan inti GPU menurun ke 72%.' },
  { tag: 'API', tagColor: '#00d4ff', message: 'Respons diterima dari mesin pencari.' },
  { tag: 'MODEL', tagColor: '#00d4ff', message: 'Memproses analisis pola malware...' },
  { tag: 'LOG', tagColor: '#f59e0b', message: 'Pemeriksaan signature file selesai.' },
  { tag: 'SYSTEM', tagColor: '#00ff88', message: 'Garbage collection dijalankan.' },
  { tag: 'GPU', tagColor: '#00ff88', message: 'Batch processing dimulai pada tensor core.' },
  { tag: 'API', tagColor: '#00d4ff', message: 'Permintaan ke sandbox environment dikirim.' },
];

export default function SystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(initialLogs.length + 1);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Simulate new log entries
  useEffect(() => {
    const interval = setInterval(() => {
      const randomMsg = newLogMessages[Math.floor(Math.random() * newLogMessages.length)];
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      setLogs((prev) => [
        ...prev,
        {
          id: nextId.current++,
          timestamp,
          tag: randomMsg.tag,
          tagColor: randomMsg.tagColor,
          message: randomMsg.message,
        },
      ]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Keep only last 50 logs
  useEffect(() => {
    if (logs.length > 50) {
      setLogs((prev) => prev.slice(prev.length - 50));
    }
  }, [logs]);

  return (
    <div
      className="panel p-2.5 animate-fade-in-up stagger-4"
      style={{ height: 140 }}
    >
      <div
        ref={scrollRef}
        className="panel-inner p-2 overflow-y-auto h-full"
      >
        <div className="flex flex-col gap-0.5">
          {logs.map((log, index) => (
            <div
              key={log.id}
              className="font-mono text-[10px] leading-relaxed animate-log-slide"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span style={{ color: 'var(--text-muted)' }}>[{log.timestamp}]</span>{' '}
              {log.tag && (
                <>
                  {log.tag === 'SYSTEM' ? (
                    <span style={{ color: log.tagColor }}>#{log.tag}#</span>
                  ) : (
                    <span style={{ color: log.tagColor }}>&lt;{log.tag}&gt;</span>
                  )}
                  {' '}
                </>
              )}
              <span style={{ color: 'var(--text-secondary)' }}>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
