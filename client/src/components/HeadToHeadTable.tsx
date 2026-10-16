import React from 'react';
import { Developer, ComparisonResult } from '../types';
import { Trophy, Star, Users, GitFork, BookOpen, ExternalLink, X } from 'lucide-react';

interface HeadToHeadTableProps {
  comparisonData: ComparisonResult;
  onRemoveDeveloper: (username: string) => void;
  onViewProfile: (username: string) => void;
}

export const HeadToHeadTable: React.FC<HeadToHeadTableProps> = ({
  comparisonData,
  onRemoveDeveloper,
  onViewProfile,
}) => {
  const { developers, highlights } = comparisonData;

  const getTopLanguage = (dev: Developer) => {
    const langs = Object.entries(dev.languages || {}).sort((a, b) => b[1].percentage - a[1].percentage);
    return langs[0] ? `${langs[0][0]} (${langs[0][1].percentage}%)` : 'N/A';
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Head-to-Head Comparison Matrix</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Key metrics aggregated across all public GitHub activity. Metric leaders highlighted.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase text-slate-400 tracking-wider">
              <th className="py-4 px-6 min-w-[200px]">Developer</th>
              <th className="py-4 px-6 min-w-[140px] text-center">Total Stars</th>
              <th className="py-4 px-6 min-w-[140px] text-center">Followers</th>
              <th className="py-4 px-6 min-w-[140px] text-center">Public Repos</th>
              <th className="py-4 px-6 min-w-[140px] text-center">Total Forks</th>
              <th className="py-4 px-6 min-w-[160px]">Top Language</th>
              <th className="py-4 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {developers.map((dev) => {
              const isStarWinner = dev.github_username === highlights.mostStars.username && dev.total_stars > 0;
              const isFollowerWinner = dev.github_username === highlights.mostFollowers.username && dev.followers > 0;
              const isRepoWinner = dev.github_username === highlights.mostRepos.username && dev.public_repos > 0;
              const isForkWinner = dev.github_username === highlights.mostForks.username && dev.total_forks > 0;

              return (
                <tr key={dev.id} className="hover:bg-slate-800/30 transition">
                  {/* Developer Profile Cell */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={dev.avatar_url || ''}
                        alt={dev.github_username}
                        className="w-11 h-11 rounded-full border border-slate-700 object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <button
                          onClick={() => onViewProfile(dev.github_username)}
                          className="font-bold text-white hover:text-brand-400 transition text-sm truncate block text-left"
                        >
                          {dev.name || dev.github_username}
                        </button>
                        <span className="text-xs text-slate-400 font-mono">@{dev.github_username}</span>
                        {dev.company && (
                          <span className="block text-[11px] text-slate-500 truncate max-w-[180px]">
                            {dev.company}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Stars Cell */}
                  <td className="py-4 px-6 text-center">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold ${
                        isStarWinner
                          ? 'bg-amber-950/60 border border-amber-500/50 text-amber-300 shadow-sm'
                          : 'text-slate-200'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isStarWinner ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                      <span>{dev.total_stars.toLocaleString()}</span>
                    </div>
                    {isStarWinner && (
                      <span className="block text-[10px] text-amber-400 font-medium uppercase mt-0.5">Leader</span>
                    )}
                  </td>

                  {/* Followers Cell */}
                  <td className="py-4 px-6 text-center">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold ${
                        isFollowerWinner
                          ? 'bg-brand-950/60 border border-brand-500/50 text-brand-300 shadow-sm'
                          : 'text-slate-200'
                      }`}
                    >
                      <Users className={`w-3.5 h-3.5 ${isFollowerWinner ? 'text-brand-400' : 'text-slate-500'}`} />
                      <span>{dev.followers.toLocaleString()}</span>
                    </div>
                    {isFollowerWinner && (
                      <span className="block text-[10px] text-brand-400 font-medium uppercase mt-0.5">Leader</span>
                    )}
                  </td>

                  {/* Repos Cell */}
                  <td className="py-4 px-6 text-center">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold ${
                        isRepoWinner
                          ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 shadow-sm'
                          : 'text-slate-200'
                      }`}
                    >
                      <BookOpen className={`w-3.5 h-3.5 ${isRepoWinner ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span>{dev.public_repos.toLocaleString()}</span>
                    </div>
                    {isRepoWinner && (
                      <span className="block text-[10px] text-emerald-400 font-medium uppercase mt-0.5">Leader</span>
                    )}
                  </td>

                  {/* Forks Cell */}
                  <td className="py-4 px-6 text-center">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold ${
                        isForkWinner
                          ? 'bg-sky-950/60 border border-sky-500/50 text-sky-300 shadow-sm'
                          : 'text-slate-200'
                      }`}
                    >
                      <GitFork className={`w-3.5 h-3.5 ${isForkWinner ? 'text-sky-400' : 'text-slate-500'}`} />
                      <span>{dev.total_forks.toLocaleString()}</span>
                    </div>
                    {isForkWinner && (
                      <span className="block text-[10px] text-sky-400 font-medium uppercase mt-0.5">Leader</span>
                    )}
                  </td>

                  {/* Top Language Cell */}
                  <td className="py-4 px-6">
                    <span className="font-mono text-xs text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      {getTopLanguage(dev)}
                    </span>
                  </td>

                  {/* Actions Cell */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onViewProfile(dev.github_username)}
                        title="View Full Profile"
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemoveDeveloper(dev.github_username)}
                        title="Remove from comparison"
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
