import { useState, useEffect } from 'react';
import { Github, Music, Zap, Terminal, Code, Server, Shield } from 'lucide-react';

const models = [
  { name: 'Nemotron 3 Ultra', active: true },
  { name: 'Nemotron 3 Nano', active: false },
  { name: 'Ling 3.0 Flash', active: false },
  { name: 'Nemotron 3 Super', active: false },
  { name: 'North Mini Code', active: false },
  { name: 'Laguna S 2.1', active: false, isNew: true },
];

export default function TopBar() {
  const [activeModel, setActiveModel] = useState('Nemotron 3 Ultra');
  const [latency, setLatency] = useState(27);
  const [uptime, setUptime] = useState(41);
  const [showTools, setShowTools] = useState(false);

  // Simulate real-time latency fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 20) + 20);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulate uptime counter
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeout(() => setUptime((prev) => prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <header
      className="w-full flex items-center justify-between px-4"
      style={{
        height: 44,
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-panel)',
      }}
    >
      {/* Left Section */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>FIRDHAN - AGENT</span>
        <span className="font-mono text-xs ml-2" style={{ color: 'var(--text-muted)' }}>v5.0</span>

        <div className="flex items-center gap-2 ml-4">
          <div className="status-dot" />
          <div className="status-dot" />
        </div>

        <div className="hidden xl:flex items-center gap-4 ml-3">
          <span className="font-mono text-[10px] font-semibold tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            SYSTEM AII V5.0 // Advanced Ops Console
          </span>
          <span className="font-mono text-[10px] font-semibold tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            SYSTEM INTEGRITY: 99.8%
          </span>
        </div>
      </div>

      {/* Center Section — Model Tabs */}
      <div className="flex items-center gap-1">
        {models.map((model) => (
          <button
            key={model.name}
            onClick={() => setActiveModel(model.name)}
            className="relative flex items-center gap-1.5 px-3 py-1 font-sans text-xs font-medium transition-all duration-200"
            style={{
              background: activeModel === model.name ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
              border: activeModel === model.name ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid transparent',
              borderRadius: 4,
              color: activeModel === model.name ? 'var(--accent-green)' : 'var(--text-muted)',
            }}
          >
            {model.name}
            {model.isNew && (
              <span
                className="text-[9px] font-bold px-1 py-0.5 rounded-sm"
                style={{ background: 'var(--danger)', color: 'white' }}
              >
                NEW
              </span>
            )}
          </button>
        ))}
        <div className="relative ml-2">
          <button
            className="btn-cyan flex items-center gap-1.5"
            style={{ padding: '4px 10px', fontSize: 10 }}
            onClick={() => setShowTools((s) => !s)}
            aria-expanded={showTools}
            aria-haspopup="menu"
            type="button"
          >
            TOOLS
          </button>

          {showTools && (
            <div
              role="menu"
              aria-label="Quick tools"
              className="absolute z-20 mt-2 p-2 rounded shadow-lg"
              style={{
                right: 0,
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-panel)',
                display: 'flex',
                gap: 8,
              }}
            >
              <a href="#" title="YouTube Music" className="p-2 rounded hover:bg-white/5">
                <Music size={16} />
              </a>
              <a href="#" title="GitHub" className="p-2 rounded hover:bg-white/5">
                <Github size={16} />
              </a>
              <a href="#" title="Zap" className="p-2 rounded hover:bg-white/5">
                <Zap size={16} />
              </a>
              <a href="#" title="Terminal" className="p-2 rounded hover:bg-white/5">
                <Terminal size={16} />
              </a>
              <a href="#" title="Code" className="p-2 rounded hover:bg-white/5">
                <Code size={16} />
              </a>
              <a href="#" title="Server" className="p-2 rounded hover:bg-white/5">
                <Server size={16} />
              </a>
              <a href="#" title="Shield" className="p-2 rounded hover:bg-white/5">
                <Shield size={16} />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Right Section — Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="font-sans text-[10px] font-medium tracking-wider" style={{ color: 'var(--text-muted)' }}>
            LATENCY:
          </span>
          <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent-green)' }}>
            {latency}ms
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-sans text-[10px] font-medium tracking-wider" style={{ color: 'var(--text-muted)' }}>
            TOKENS:
          </span>
          <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent-cyan)' }}>
            879K
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-sans text-[10px] font-medium tracking-wider" style={{ color: 'var(--text-muted)' }}>
            UPTIME:
          </span>
          <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatUptime(uptime)}
          </span>
        </div>
      </div>
    </header>
  );
}
