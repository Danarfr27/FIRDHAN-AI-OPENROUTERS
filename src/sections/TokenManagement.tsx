import { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { MoreHorizontal } from 'lucide-react';

// Token gauge component
function TokenGauge({ value, max }: { value: number; max: number }) {
  const percentage = (value / max) * 100;
  const radius = 58;
  const strokeWidth = 10;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - percentage / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 140, height: 75 }}>
        <svg width="140" height="75" viewBox="0 0 140 75">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00ff88" />
              <stop offset="100%" stopColor="#00d4ff" />
            </linearGradient>
          </defs>
          {/* Background arc */}
          <path
            d={`M 10 70 A ${radius} ${radius} 0 0 1 130 70`}
            fill="none"
            stroke="#1a1a2e"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Fill arc */}
          <path
            d={`M 10 70 A ${radius} ${radius} 0 0 1 130 70`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span
            className="font-mono text-xl font-bold"
            style={{ color: 'var(--accent-green)' }}
          >
            {value.toLocaleString()}
          </span>
          <span
            className="font-mono text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            / {(max / 1000).toFixed(0)}k
          </span>
        </div>
      </div>
    </div>
  );
}

// Bar chart data
const barData = [
  { name: '1', input: 65, output: 30 },
  { name: '2', input: 80, output: 45 },
  { name: '3', input: 55, output: 25 },
  { name: '4', input: 90, output: 55 },
];

// Generate usage trends data
const generateTrendsData = () => {
  const data = [];
  for (let i = 0; i < 30; i++) {
    data.push({
      time: i,
      input: 30 + Math.random() * 40,
      output: 20 + Math.random() * 30,
    });
  }
  return data;
};

const tools = [
  { name: 'Web Search', status: 'Idle', active: false },
  { name: 'Python Sandbox', status: 'Active', active: true },
  { name: 'Malware Lab', status: 'Active', active: true },
  { name: 'API Connector', status: 'Idle', active: false },
];

export default function TokenManagement() {
  const [tokenValue, setTokenValue] = useState(74512);
  const [trendsData, setTrendsData] = useState(generateTrendsData());

  // Simulate token value changes
  useEffect(() => {
    const interval = setInterval(() => {
      setTokenValue((prev) => {
        const change = Math.floor(Math.random() * 200) - 80;
        return Math.max(50000, Math.min(120000, prev + change));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulate trends data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTrendsData((prev) => {
        const newData = [...prev.slice(1)];
        newData.push({
          time: prev[prev.length - 1].time + 1,
          input: 30 + Math.random() * 40,
          output: 20 + Math.random() * 30,
        });
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const inputTokens = useMemo(() => Math.round(tokenValue * 0.7), [tokenValue]);
  const outputTokens = useMemo(() => Math.round(tokenValue * 0.3), [tokenValue]);
  const remaining = useMemo(() => 128000 - tokenValue, [tokenValue]);

  return (
    <div
      className="panel p-2.5 flex flex-col gap-2.5 animate-fade-in-up stagger-3"
      style={{ width: 320, minWidth: 320, height: '100%' }}
    >
      {/* TOKEN MANAGEMENT DASHBOARD */}
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3
            className="font-mono text-[11px] font-semibold tracking-widest"
            style={{ color: 'var(--text-primary)' }}
          >
            TOKEN MANAGEMENT DASHBOARD
          </h3>
          <button
            className="p-1 rounded transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>

        {/* Context Usage */}
        <p
          className="font-mono text-[10px] mb-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          CONTEXT USAGE: {tokenValue.toLocaleString()} / 128k
        </p>

        {/* Gauge */}
        <div className="flex justify-center mb-3">
          <TokenGauge value={tokenValue} max={128000} />
        </div>

        {/* Bar Chart */}
        <div className="panel-inner p-2 mb-2" style={{ height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barGap={2} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <XAxis hide />
              <YAxis hide />
              <Bar dataKey="input" fill="#00ff88" radius={[2, 2, 0, 0]} maxBarSize={12} />
              <Bar dataKey="output" fill="#f59e0b" radius={[2, 2, 0, 0]} maxBarSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Token Stats */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="font-mono text-[9px]" style={{ color: 'var(--text-secondary)' }}>
              INPUT TOKENS:
            </span>
            <span className="font-mono text-[9px]" style={{ color: 'var(--accent-green)' }}>
              {inputTokens.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-[9px]" style={{ color: 'var(--text-secondary)' }}>
              OUTPUT TOKENS:
            </span>
            <span className="font-mono text-[9px]" style={{ color: 'var(--accent-cyan)' }}>
              {outputTokens.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-[9px]" style={{ color: 'var(--text-secondary)' }}>
              Remaining:
            </span>
            <span className="font-mono text-[9px]" style={{ color: 'var(--accent-green)' }}>
              {remaining.toLocaleString()} tokens
            </span>
          </div>
        </div>
      </div>

      {/* ACTIVATED TOOLS */}
      <div>
        <h4
          className="font-sans text-xs font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Activated Tools
        </h4>
        <div className="flex flex-col">
          {tools.map((tool, index) => (
            <div
              key={tool.name}
              className="flex items-center justify-between py-1.5 px-2"
              style={{
                borderBottom: index < tools.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: tool.active ? 'var(--accent-green)' : 'var(--text-muted)',
                    boxShadow: tool.active ? '0 0 4px var(--accent-green)' : 'none',
                  }}
                />
                <span
                  className="font-mono text-[11px]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {tool.name}
                </span>
              </div>
              <span
                className="font-mono text-[10px]"
                style={{
                  color: tool.active ? 'var(--accent-green)' : 'var(--text-muted)',
                }}
              >
                {tool.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* USAGE TRENDS */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3
            className="font-mono text-[11px] font-semibold tracking-widest"
            style={{ color: 'var(--text-primary)' }}
          >
            USAGE TRENDS (Last 60s)
          </h3>
          <button
            className="p-1 rounded transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
        <div className="panel-inner p-2" style={{ height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendsData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <defs>
                <linearGradient id="trendInputGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff88" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="trendOutputGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis hide />
              <YAxis hide />
              <Area
                type="monotone"
                dataKey="input"
                stroke="#00ff88"
                strokeWidth={1.5}
                fill="url(#trendInputGradient)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="output"
                stroke="#00d4ff"
                strokeWidth={1.5}
                fill="url(#trendOutputGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
