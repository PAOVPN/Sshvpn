import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ServerOption } from '@/lib/types';

interface ServerSelectorProps {
  servers: ServerOption[];
  selected: ServerOption | null;
  onSelect: (server: ServerOption) => void;
}

export default function ServerSelector({ servers, selected, onSelect }: ServerSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-5 py-2">
      <div className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 mb-2">SERVER</div>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl bg-navy-card border border-navy-border px-4 py-3.5 flex items-center gap-3 hover:border-cyan-glow/40 transition-colors"
      >
        <span className="text-xl leading-none">{selected?.flag ?? '🌐'}</span>
        <span className="flex-1 text-left text-sm font-medium text-white truncate">
          {selected
            ? `${selected.name} · ${selected.location}${selected.ping !== undefined ? ` · ${selected.ping} ms` : ''}`
            : 'No server selected'}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-500" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="fade-in-up w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-navy-card border border-navy-border p-5 pb-8 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-base mb-4">Select Server</h3>
            {servers.length === 0 ? (
              <p className="text-sm text-slate-500">No servers available. Tap Update Servers.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {servers.map((server) => (
                  <button
                    key={server.id}
                    onClick={() => {
                      onSelect(server);
                      setOpen(false);
                    }}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
                      selected?.id === server.id
                        ? 'border-cyan-glow/60 bg-cyan-glow/10'
                        : 'border-navy-border bg-navy-cardLight hover:border-cyan-glow/30'
                    }`}
                  >
                    <span className="text-xl">{server.flag}</span>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {server.name} · {server.location}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {[
                          server.ping !== undefined ? `Ping ${server.ping} ms` : null,
                          server.load !== undefined ? `Load ${server.load}%` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || server.host}
                      </div>
                    </div>
                    {server.load !== undefined && (
                      <div
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          server.load < 40
                            ? 'bg-emerald-400'
                            : server.load < 60
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
