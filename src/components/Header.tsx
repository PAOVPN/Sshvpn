import { RefreshCw, Wifi } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  refreshing: boolean;
}

export default function Header({ onRefresh, refreshing }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 pt-6 pb-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-glow to-blue-600 flex items-center justify-center shadow-glow-cyan-sm">
          <Wifi className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-white font-bold text-xl leading-tight tracking-tight">SlowDNS</h1>
          <p className="text-slate-500 text-[11px] font-semibold tracking-[0.18em]">DNSTT TUNNEL</p>
        </div>
      </div>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="flex items-center gap-2 bg-navy-card border border-navy-border rounded-full px-4 py-2.5 text-slate-300 text-xs font-semibold hover:border-cyan-glow/50 hover:text-cyan-glow transition-colors disabled:opacity-60"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        Update Servers
      </button>
    </div>
  );
}
