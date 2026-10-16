import React, { useState, useMemo } from 'react';
import { Repository } from '../types';
import {
  Star,
  GitFork,
  ExternalLink,
  Bookmark,
  Calendar,
  Search,
  SlidersHorizontal,
  Tag,
  FileText,
} from 'lucide-react';

interface RepoListProps {
  repos: Repository[];
  onPinClick: (repo: Repository) => void;
}

export const RepoList: React.FC<RepoListProps> = ({ repos, onPinClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'stars' | 'forks' | 'updated' | 'name'>('stars');

  // Extract unique languages
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    repos.forEach((r) => {
      if (r.primary_language) set.add(r.primary_language);
    });
    return Array.from(set).sort();
  }, [repos]);

  // Filter & sort
  const filteredRepos = useMemo(() => {
    return repos
      .filter((r) => {
        const matchesQuery =
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesLang =
          selectedLanguage === 'all' || r.primary_language === selectedLanguage;
        return matchesQuery && matchesLang;
      })
      .sort((a, b) => {
        if (sortBy === 'stars') return (b.stars || 0) - (a.stars || 0);
        if (sortBy === 'forks') return (b.forks || 0) - (a.forks || 0);
        if (sortBy === 'updated') {
          return new Date(b.pushed_at || 0).getTime() - new Date(a.pushed_at || 0).getTime();
        }
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [repos, searchQuery, selectedLanguage, sortBy]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 backdrop-blur-sm">
        {/* Search inside repos */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search repositories..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Language filter */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition"
          >
            <option value="all">All Languages ({repos.length})</option>
            {availableLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none text-xs cursor-pointer"
            >
              <option value="stars">Most Stars</option>
              <option value="forks">Most Forks</option>
              <option value="updated">Recently Updated</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Repos Grid */}
      {filteredRepos.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800/80">
          No repositories match your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                repo.is_pinned
                  ? 'bg-gradient-to-br from-brand-950/30 to-slate-900 border-brand-500/40 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header: Title, Links & Pin Action */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-bold text-white hover:text-brand-400 transition inline-flex items-center gap-1.5 group truncate max-w-full"
                    >
                      <span className="truncate">{repo.name}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 shrink-0" />
                    </a>
                  </div>

                  {/* Pin Button */}
                  <button
                    onClick={() => onPinClick(repo)}
                    title={repo.is_pinned ? 'Edit Note / Unpin' : 'Pin to Favorites'}
                    className={`p-2 rounded-xl border transition ${
                      repo.is_pinned
                        ? 'bg-brand-500 text-white border-brand-400 shadow-md shadow-brand-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-brand-400 hover:border-slate-700'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${repo.is_pinned ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {repo.description || <span className="italic text-slate-600">No description provided</span>}
                </p>

                {/* Pinned Note & Tags preview if pinned */}
                {repo.is_pinned && repo.pin_details && (
                  <div className="mt-3 p-2.5 rounded-xl bg-brand-950/50 border border-brand-800/40 text-xs space-y-1.5">
                    {repo.pin_details.note && (
                      <div className="flex items-start gap-1.5 text-brand-200">
                        <FileText className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                        <span className="italic line-clamp-2">{repo.pin_details.note}</span>
                      </div>
                    )}
                    {repo.pin_details.tags && repo.pin_details.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center pt-1">
                        <Tag className="w-3 h-3 text-brand-400 shrink-0" />
                        {repo.pin_details.tags.map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 text-[10px] font-mono"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer: Metrics & Details */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-4 mt-4 border-t border-slate-800/80">
                <div className="flex items-center gap-3">
                  {repo.primary_language && (
                    <span className="flex items-center gap-1.5 font-medium text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-brand-400" />
                      {repo.primary_language}
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-mono">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                    {repo.stars.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <GitFork className="w-3.5 h-3.5 text-slate-400" />
                    {repo.forks.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(repo.pushed_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
