import { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import type { LogEntry } from '@/lib/types';

interface LogsTabProps {
  logs: LogEntry[];
  onClear: () => void;
}

const levelStyle: Record<LogEntry['level'], string> = {
  info: 'text-slate-300',
  success: 'text-emerald-400',
  warn: 'text-amber-400',
  error: 'text-rose-400',
};

const levelTag: Record<LogEntry['level'], string> = {
  info: '[INFO]',
  success: '[ OK ]',
  warn: '[WARN]',
  error: '[FAIL]',
};

export default function LogsTab({ logs, onClear }: LogsTabProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div className="px-5 py-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-bold text-base">Connection Logs</h2>
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-[#080C16] border border-navy-border p-4 font-mono text-[11px] leading-relaxed">
        {logs.length === 0 ? (
          <div className="text-slate-600">No logs yet. Connect to start capturing events.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="whitespace-pre-wrap break-words">
              <span className="text-slate-600">{log.time} </span>
              <span className={levelStyle[log.level]}>{levelTag[log.level]} </span>
              <span className="text-slate-300">{log.message}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
