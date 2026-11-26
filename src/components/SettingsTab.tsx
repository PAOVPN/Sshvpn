import { useState } from 'react';
import { Bell, Moon, Vibrate, RotateCcw, ChevronDown } from 'lucide-react';

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  defaultOn?: boolean;
}

function ToggleRow({ icon, label, description, defaultOn = false }: ToggleRowProps) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className="w-full flex items-center gap-3 rounded-2xl bg-navy-card border border-navy-border px-4 py-3.5 text-left hover:border-slate-500/50 transition-colors"
    >
      <div className="w-9 h-9 rounded-xl bg-cyan-glow/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
      <div
        className={`w-10 h-6 rounded-full p-0.5 transition-colors ${on ? 'bg-cyan-glow' : 'bg-slate-700'}`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transition-transform ${on ? 'translate-x-4' : ''}`}
        />
      </div>
    </button>
  );
}

export default function SettingsTab() {
  return (
    <div className="px-5 py-4 flex flex-col gap-2.5">
      <h2 className="text-white font-bold text-base mb-1">Settings</h2>
      <ToggleRow
        icon={<Bell className="w-4 h-4 text-cyan-glow" />}
        label="Notifications"
        description="Alert on connection changes"
        defaultOn
      />
      <ToggleRow
        icon={<Moon className="w-4 h-4 text-cyan-glow" />}
        label="Dark Mode"
        description="Always on for this theme"
        defaultOn
      />
      <ToggleRow
        icon={<Vibrate className="w-4 h-4 text-cyan-glow" />}
        label="Haptic Feedback"
        description="Vibrate on connect and disconnect"
      />
      <button
        onClick={() => {
          if (confirm('Reset all settings to default?')) {
            window.location.reload();
          }
        }}
        className="flex items-center gap-3 rounded-2xl bg-navy-card border border-navy-border px-4 py-3.5 hover:border-rose-500/40 transition-colors group"
      >
        <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
          <RotateCcw className="w-4 h-4 text-rose-400" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold text-white">Reset Settings</div>
          <div className="text-xs text-slate-500">Restore defaults and clear session</div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-600 -rotate-90" />
      </button>
      <div className="text-center text-[11px] text-slate-600 mt-4">SlowDNS v1.0.0 · DNSTT Tunnel</div>
    </div>
  );
}
