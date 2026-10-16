import React from 'react';
import { CommitActivityItem } from '../types';
import { GitCommit, TrendingUp } from 'lucide-react';

interface CommitActivityChartProps {
  activity: CommitActivityItem[];
}

export const CommitActivityChart: React.FC<CommitActivityChartProps> = ({ activity }) => {
  const items = activity || [];
  const maxCommits = Math.max(...items.map((i) => i.commits), 1);
  const totalCommits = items.reduce((acc, i) => acc + i.commits, 0);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-brand-400" />
            <span>Commit & Push Activity</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Recorded across recent active sprints</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-white font-mono">{totalCommits}</div>
          <div className="text-[11px] text-slate-500">Recent Commits</div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm">
          No public commit logs indexed in this timeframe.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bar Chart Visualization */}
          <div className="h-32 flex items-end gap-2 sm:gap-4 pt-6 pb-2 border-b border-slate-800">
            {items.map((item, idx) => {
              const heightPercent = Math.max(8, Math.round((item.commits / maxCommits) * 100));
              const isPeak = item.commits === maxCommits && maxCommits > 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 border border-slate-700 text-white text-[11px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10 font-mono">
                    {item.commits} commit{item.commits === 1 ? '' : 's'}
                  </div>

                  {/* Visual Bar */}
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 group-hover:brightness-125 ${
                      isPeak
                        ? 'bg-gradient-to-t from-brand-600 to-indigo-400 shadow-md shadow-brand-500/30'
                        : item.commits > 0
                        ? 'bg-gradient-to-t from-slate-700 to-brand-500/80'
                        : 'bg-slate-800/50'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Week Labels */}
          <div className="flex justify-between gap-1 text-[11px] text-slate-500 font-mono">
            {items.map((item, idx) => (
              <span key={idx} className="flex-1 text-center truncate">
                {item.week.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
