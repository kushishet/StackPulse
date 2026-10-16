import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricStatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  subtext?: string;
  highlight?: boolean;
}

export const MetricStatCard: React.FC<MetricStatCardProps> = ({
  label,
  value,
  icon: Icon,
  subtext,
  highlight = false,
}) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
      if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 ${
        highlight
          ? 'bg-gradient-to-br from-brand-950/60 to-slate-900 border-brand-500/40 shadow-lg shadow-brand-500/10'
          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <div
          className={`p-2 rounded-xl ${
            highlight ? 'bg-brand-500/20 text-brand-400' : 'bg-slate-800 text-slate-400'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
          {formatValue(value)}
        </div>
        {subtext && <div className="text-xs text-slate-500 mt-1">{subtext}</div>}
      </div>
    </div>
  );
};
