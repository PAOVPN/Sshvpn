import { Home, Settings2, ScrollText, Settings } from 'lucide-react';

export type TabId = 'home' | 'config' | 'logs' | 'settings';

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'config', label: 'Config', icon: Settings2 },
  { id: 'logs', label: 'Logs', icon: ScrollText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="sticky bottom-0 mt-auto border-t border-navy-border bg-[#0D1424]/95 backdrop-blur px-2 pt-2 pb-3 flex">
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition-colors"
          >
            <Icon
              className={`w-5 h-5 transition-colors ${isActive ? 'text-cyan-glow' : 'text-slate-500'}`}
              strokeWidth={isActive ? 2.4 : 2}
            />
            <span
              className={`text-[10px] font-semibold transition-colors ${
                isActive ? 'text-cyan-glow' : 'text-slate-500'
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
