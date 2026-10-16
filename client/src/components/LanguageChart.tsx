import React from 'react';

interface LanguageChartProps {
  languages: Record<string, { bytes: number; percentage: number }>;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3776ab',
  Rust: '#dea584',
  Go: '#00add8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4f5d95',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  Dart: '#00b4ab',
  Shell: '#89e051',
  Vue: '#41b883',
  Other: '#64748b',
};

export const LanguageChart: React.FC<LanguageChartProps> = ({ languages }) => {
  const entries = Object.entries(languages || {}).sort((a, b) => b[1].percentage - a[1].percentage);

  if (entries.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 text-sm bg-slate-900/40 rounded-xl border border-slate-800">
        No language metrics available.
      </div>
    );
  }

  // Calculate SVG donut segments
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-5 flex items-center justify-between">
        <span>Language Distribution</span>
        <span className="text-xs text-slate-500 font-mono font-normal">By Code Weight</span>
      </h3>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* SVG Donut */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg width={size} height={size} className="rotate-[-90deg]">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#1e293b"
              strokeWidth={strokeWidth}
            />
            {entries.slice(0, 7).map(([lang, info]) => {
              const strokeDasharray = `${(info.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += info.percentage;
              const color = LANGUAGE_COLORS[lang] || '#8b5cf6';

              return (
                <circle
                  key={lang}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 hover:opacity-80"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-white font-mono">
              {entries[0]?.[1]?.percentage || 0}%
            </span>
            <span className="text-[11px] text-slate-400 truncate max-w-[80px]">
              {entries[0]?.[0] || ''}
            </span>
          </div>
        </div>

        {/* Language Breakdown Bars & Legend */}
        <div className="flex-1 w-full space-y-2.5">
          {entries.slice(0, 6).map(([lang, info]) => {
            const color = LANGUAGE_COLORS[lang] || '#8b5cf6';
            return (
              <div key={lang} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-medium text-slate-300">{lang}</span>
                  </div>
                  <span className="font-mono text-slate-400">{info.percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, info.percentage)}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
