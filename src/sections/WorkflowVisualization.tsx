import { X } from 'lucide-react';

interface WorkflowVisualizationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkflowVisualization({ isOpen, onClose }: WorkflowVisualizationProps) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute z-20 panel p-3"
      style={{
        width: 200,
        top: 12,
        right: 12,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h4
          className="font-mono text-[10px] font-semibold tracking-widest"
          style={{ color: 'var(--text-primary)' }}
        >
          WORKFLOW VISUALIZATION
        </h4>
        <button
          onClick={onClose}
          className="p-0.5 rounded transition-colors hover:bg-white/5"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Subtitle */}
      <p
        className="font-mono text-[10px] mb-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        Mental Model
      </p>

      {/* Tree Diagram */}
      <div className="relative" style={{ height: 140 }}>
        <svg width="100%" height="100%" viewBox="0 0 180 140">
          {/* Connection lines */}
          {/* Root to Web Search */}
          <line x1="90" y1="22" x2="45" y2="52" stroke="#1a1a2e" strokeWidth="1" />
          {/* Root to Python Sandbox */}
          <line x1="90" y1="22" x2="90" y2="52" stroke="#1a1a2e" strokeWidth="1" />
          {/* Root to Malware Lab */}
          <line x1="90" y1="22" x2="135" y2="52" stroke="#1a1a2e" strokeWidth="1" />
          {/* Python Sandbox to children */}
          <line x1="90" y1="72" x2="70" y2="102" stroke="#1a1a2e" strokeWidth="1" />
          <line x1="90" y1="72" x2="110" y2="102" stroke="#1a1a2e" strokeWidth="1" />

          {/* Root Node */}
          <rect x="55" y="8" width="70" height="18" rx="3" fill="#1a1a2e" stroke="#2a2a3e" strokeWidth="1" />
          <text x="90" y="20" textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="'JetBrains Mono', monospace">
            Mental Model
          </text>

          {/* Web Search */}
          <rect x="10" y="52" width="70" height="18" rx="3" fill="#1a1a2e" stroke="#2a2a3e" strokeWidth="1" />
          <text x="45" y="64" textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="'JetBrains Mono', monospace">
            Web Search
          </text>

          {/* Python Sandbox */}
          <rect x="55" y="72" width="70" height="18" rx="3" fill="#1a1a2e" stroke="#2a2a3e" strokeWidth="1" />
          <text x="90" y="84" textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="'JetBrains Mono', monospace">
            Python Sandbox
          </text>

          {/* Malware Lab (right child) */}
          <rect x="100" y="52" width="70" height="18" rx="3" fill="#1a1a2e" stroke="#2a2a3e" strokeWidth="1" />
          <text x="135" y="64" textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="'JetBrains Mono', monospace">
            Malware Lab
          </text>

          {/* API Connector */}
          <rect x="30" y="112" width="80" height="18" rx="3" fill="#1a1a2e" stroke="#2a2a3e" strokeWidth="1" />
          <text x="70" y="124" textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="'JetBrains Mono', monospace">
            API Connector
          </text>

          {/* Python Services */}
          <rect x="90" y="112" width="80" height="18" rx="3" fill="#1a1a2e" stroke="#2a2a3e" strokeWidth="1" />
          <text x="130" y="124" textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="'JetBrains Mono', monospace">
            Python Services
          </text>
        </svg>
      </div>
    </div>
  );
}
