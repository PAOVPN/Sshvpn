import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { formatSpeed } from '@/lib/types';

interface SpeedStatsProps {
  upload: number;
  download: number;
}

export default function SpeedStats({ upload, download }: SpeedStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 px-5 py-2">
      <div className="rounded-2xl bg-navy-card border border-navy-border p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-cyan-glow/10 flex items-center justify-center shrink-0">
          <ArrowUpFromLine className="w-[18px] h-[18px] text-cyan-glow" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold tracking-[0.15em] text-slate-500">UPLOAD</div>
          <div className="font-mono text-sm font-semibold text-white truncate tabular-nums">
            {formatSpeed(upload)}
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-navy-card border border-navy-border p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-cyan-glow/10 flex items-center justify-center shrink-0">
          <ArrowDownToLine className="w-[18px] h-[18px] text-cyan-glow" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold tracking-[0.15em] text-slate-500">DOWNLOAD</div>
          <div className="font-mono text-sm font-semibold text-white truncate tabular-nums">
            {formatSpeed(download)}
          </div>
        </div>
      </div>
    </div>
  );
}
