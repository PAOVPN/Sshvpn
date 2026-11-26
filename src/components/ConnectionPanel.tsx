import { Power } from 'lucide-react';
import { formatDuration, type ConnectionStatus } from '@/lib/types';

interface ConnectionPanelProps {
  status: ConnectionStatus;
  seconds: number;
  onToggle: () => void;
}

export default function ConnectionPanel({ status, seconds, onToggle }: ConnectionPanelProps) {
  const connected = status === 'connected';
  const connecting = status === 'connecting';

  return (
    <div className="flex flex-col items-center px-5 pt-1">
      <div
        className={`self-start flex items-center gap-2 rounded-full border px-3.5 py-1.5 mb-4 transition-colors ${
          connected
            ? 'border-emerald-500/40 bg-emerald-500/10'
            : connecting
              ? 'border-amber-500/40 bg-amber-500/10'
              : 'border-navy-border bg-navy-card'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {connected && (
            <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              connected ? 'bg-emerald-400' : connecting ? 'bg-amber-400' : 'bg-slate-500'
            }`}
          />
        </span>
        <span
          className={`text-xs font-semibold tracking-wide ${
            connected ? 'text-emerald-400' : connecting ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          {connected ? 'Connected' : connecting ? 'Connecting' : 'Disconnected'}
        </span>
      </div>

      <div className="relative my-2">
        {connecting && (
          <span className="pulse-ring absolute inset-3 rounded-full border-2 border-cyan-glow" />
        )}
        <button
          onClick={onToggle}
          disabled={connecting}
          aria-label={connected ? 'Disconnect' : 'Connect'}
          className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-300 border-2 disabled:cursor-wait ${
            connected
              ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.35)]'
              : 'border-cyan-glow bg-cyan-glow/5 shadow-glow-cyan hover:shadow-glow-cyan hover:scale-[1.03] active:scale-95'
          }`}
        >
          <Power
            className={`w-12 h-12 transition-colors ${connected ? 'text-emerald-400' : 'text-cyan-glow'}`}
            strokeWidth={2.5}
          />
          <span
            className={`text-sm font-bold tracking-[0.2em] transition-colors ${
              connected ? 'text-emerald-400' : 'text-cyan-glow'
            }`}
          >
            {connected ? 'DISCONNECT' : connecting ? '...' : 'CONNECT'}
          </span>
        </button>
      </div>

      <div className="mt-5 mb-1 text-center">
        <div className="font-mono text-5xl font-semibold text-white tabular-nums tracking-wider">
          {formatDuration(seconds)}
        </div>
        <div className="mt-1 text-[10px] font-semibold tracking-[0.3em] text-slate-500">
          SESSION TIME
        </div>
      </div>
    </div>
  );
}
