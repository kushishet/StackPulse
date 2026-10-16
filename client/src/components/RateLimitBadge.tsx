import React, { useState, useEffect } from 'react';
import { developerApi } from '../api/client';
import { RateLimitInfo } from '../types';
import { Activity, Database, AlertCircle } from 'lucide-react';

export const RateLimitBadge: React.FC = () => {
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [isPostgres, setIsPostgres] = useState<boolean>(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const data = await developerApi.getRateLimit();
        setRateLimit(data.rateLimit);
        setIsPostgres(data.isPostgres);
      } catch (e) {
        // Fallback
      }
    };
    fetchInfo();
    const interval = setInterval(fetchInfo, 30000); // update every 30s
    return () => clearInterval(interval);
  }, []);

  if (!rateLimit) return null;

  const percentLeft = Math.round((rateLimit.remaining / rateLimit.limit) * 100);
  const isLow = rateLimit.remaining < 15;

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* Database Mode indicator */}
      <div
        className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
          isPostgres
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
            : 'bg-indigo-950/40 border-indigo-800/60 text-indigo-300'
        }`}
        title={isPostgres ? 'Connected to PostgreSQL database' : 'Running on local persistent database store'}
      >
        <Database className="w-3.5 h-3.5" />
        <span className="font-medium">{isPostgres ? 'PostgreSQL' : 'Local Storage'}</span>
      </div>

      {/* GitHub API Rate Limit */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
          isLow
            ? 'bg-amber-950/50 border-amber-800/80 text-amber-300'
            : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}
        title={`GitHub API Quota: ${rateLimit.remaining} of ${rateLimit.limit} remaining (${percentLeft}%). Auto-cached to conserve limit.`}
      >
        {isLow ? <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> : <Activity className="w-3.5 h-3.5 text-brand-400" />}
        <span className="font-mono">
          {rateLimit.remaining}/{rateLimit.limit}
        </span>
        <span className="hidden sm:inline text-slate-500 font-sans">API</span>
      </div>
    </div>
  );
};
