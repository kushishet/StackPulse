import React from 'react';
import { ComparisonResult } from '../types';
import { BarChart3, PieChart, Activity } from 'lucide-react';

interface ComparisonChartsProps {
  comparisonData: ComparisonResult;
}

const DEV_PALETTE = ['#8b5cf6', '#38bdf8', '#34d399', '#f43f5e', '#fbbf24', '#a855f7'];

export const ComparisonCharts: React.FC<ComparisonChartsProps> = ({ comparisonData }) => {
  const { developers, languageComparison, commitComparison } = comparisonData;

  // Max stars for comparative scaling
  const maxStars = Math.max(...developers.map((d) => d.total_stars), 1);
  const maxFollowers = Math.max(...developers.map((d) => d.followers), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Head-to-Head Metric Bars */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-400" />
            <span>Star & Reach Comparison</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">Normalized</span>
        </div>

        <div className="space-y-6">
          {developers.map((dev, idx) => {
            const devColor = DEV_PALETTE[idx % DEV_PALETTE.length];
            const starPercent = Math.max(4, Math.round((dev.total_stars / maxStars) * 100));
            const followerPercent = Math.max(4, Math.round((dev.followers / maxFollowers) * 100));

            return (
              <div key={dev.id} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: devColor }} />
                    <span className="font-bold text-white">@{dev.github_username}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                    <span>Stars: <strong className="text-slate-200">{dev.total_stars.toLocaleString()}</strong></span>
                    <span>Followers: <strong className="text-slate-200">{dev.followers.toLocaleString()}</strong></span>
                  </div>
                </div>

                {/* Stars bar */}
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800/80">
                  <div
                    className="h-full rounded-full transition-all duration-500 flex items-center justify-end px-2"
                    style={{ width: `${starPercent}%`, backgroundColor: devColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Language Overlap Comparison */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-brand-400" />
            <span>Language Overlap</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">Top Common Tech</span>
        </div>

        {languageComparison.allLanguages.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No overlapping language data available.
          </div>
        ) : (
          <div className="space-y-4">
            {languageComparison.allLanguages.slice(0, 5).map((lang) => (
              <div key={lang} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-300">{lang}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {developers.map((dev, idx) => {
                    const devColor = DEV_PALETTE[idx % DEV_PALETTE.length];
                    const percent = languageComparison.breakdownByDev[dev.github_username]?.[lang] || 0;
                    return (
                      <div key={dev.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span className="truncate max-w-[80px]" style={{ color: devColor }}>
                            @{dev.github_username}
                          </span>
                          <span className="font-mono text-slate-300">{percent}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${percent}%`, backgroundColor: devColor }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Commit Activity Head-to-Head */}
      <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-400" />
              <span>Sprint Commit Activity Head-to-Head</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative weekly commit frequency across the last 8 sprints.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {commitComparison.series.map((item, idx) => {
            const devColor = DEV_PALETTE[idx % DEV_PALETTE.length];
            const total = item.data.reduce((a, b) => a + b, 0);
            const maxVal = Math.max(...commitComparison.series.flatMap((s) => s.data), 1);

            return (
              <div key={item.username} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm" style={{ color: devColor }}>
                    @{item.username}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Total: <strong className="text-white">{total} commits</strong>
                  </span>
                </div>

                <div className="h-14 flex items-end gap-2 pt-2">
                  {item.data.map((val, wIdx) => {
                    const h = Math.max(6, Math.round((val / maxVal) * 100));
                    return (
                      <div
                        key={wIdx}
                        className="flex-1 flex flex-col items-center justify-end h-full group relative"
                      >
                        <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none font-mono">
                          {val}
                        </div>
                        <div
                          className="w-full rounded-t transition-all group-hover:brightness-125"
                          style={{ height: `${h}%`, backgroundColor: devColor }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  {commitComparison.weeks.map((w, wIdx) => (
                    <span key={wIdx} className="flex-1 text-center truncate">
                      {w.split(' ')[0]}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
