import { useState } from 'react';
import { Eye, EyeOff, Server, KeyRound, User, Globe, ShieldCheck, Network } from 'lucide-react';
import type { SshConfig } from '@/lib/types';

interface ConfigTabProps {
  config: SshConfig;
  onChange: (config: SshConfig) => void;
}

const fields = [
  { key: 'host' as const, label: 'SSH HOST', placeholder: 'tunnel.example.com', icon: Server },
  { key: 'port' as const, label: 'PORT', placeholder: '443', icon: ShieldCheck },
  { key: 'username' as const, label: 'USERNAME', placeholder: 'tunnel_user', icon: User },
  { key: 'ns' as const, label: 'NAMESERVER (NS)', placeholder: 'ns1.tunnel.example.com', icon: Dns },
  { key: 'dns' as const, label: 'Network SERVER', placeholder: '8.8.8.8', icon: Globe },
];

export default function ConfigTab({ config, onChange }: ConfigTabProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      <h2 className="text-white font-bold text-base">SSH / DNSTT Configuration</h2>
      {fields.map(({ key, label, placeholder, icon: Icon }) => (
        <div key={key}>
          <label className="text-[10px] font-semibold tracking-[0.15em] text-slate-500 block mb-1.5">
            {label}
          </label>
          <div className="relative">
            <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={config[key]}
              onChange={(e) => onChange({ ...config, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full rounded-xl bg-navy-card border border-navy-border pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-glow/60 transition-colors"
            />
          </div>
        </div>
      ))}
      <div>
        <label className="text-[10px] font-semibold tracking-[0.15em] text-slate-500 block mb-1.5">
          PASSWORD
        </label>
        <div className="relative">
          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={config.password}
            onChange={(e) => onChange({ ...config, password: e.target.value })}
            placeholder="••••••••"
            className="w-full rounded-xl bg-navy-card border border-navy-border pl-10 pr-11 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-glow/60 transition-colors"
          />
          <button
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-semibold tracking-[0.15em] text-slate-500 block mb-1.5">
          PUBLIC KEY
        </label>
        <div className="relative">
          <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={config.publicKey}
            onChange={(e) => onChange({ ...config, publicKey: e.target.value })}
            placeholder="ssh-ed25519 AAAA..."
            className="w-full rounded-xl bg-navy-card border border-navy-border pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-glow/60 transition-colors"
          />
        </div>
      </div>
      <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
        Values auto-fill from the selected server. Manual edits are kept for the current session.
      </p>
    </div>
  );
}
