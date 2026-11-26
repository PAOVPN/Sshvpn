import { NETWORKS, type NetworkOption } from '@/lib/types';

interface NetworkSelectorProps {
  operators: NetworkOption[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function NetworkSelector({ operators, selected, onSelect }: NetworkSelectorProps) {
  return (
    <div className="px-5 py-2 pb-4">
      <div className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 mb-2">
        NETWORK / OPERATOR
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {(operators.length > 0 ? operators : NETWORKS).map((network) => {
          const active = network.id === selected;
          return (
            <button
              key={network.id}
              onClick={() => onSelect(network.id)}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 border ${
                active
                  ? 'border-cyan-glow bg-cyan-glow/10 text-cyan-glow shadow-glow-cyan-sm'
                  : 'border-navy-border bg-navy-card text-slate-400 hover:border-slate-500/50 hover:text-slate-200'
              }`}
            >
              {network.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
