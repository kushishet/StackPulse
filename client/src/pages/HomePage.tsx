import React, { useState, useEffect } from 'react';
import { developerApi } from '../api/client';
import { Developer } from '../types';
import { useCompare } from '../context/CompareContext';
import {
  Search,
  Sparkles,
  Star,
  Users,
  BookOpen,
  ArrowRight,
  Scale,
  ShieldCheck,
  Zap,
  Bookmark,
} from 'lucide-react';

interface HomePageProps {
  onSelectDeveloper: (username: string) => void;
  onNavigateToCompare: () => void;
}

const FEATURED_DEVS = [
  { username: 'torvalds', label: 'Linux & Git Creator' },
  { username: 'gaearon', label: 'Redux & React Core' },
  { username: 'yyx990803', label: 'Vue.js Creator' },
  { username: 'sindresorhus', label: 'Prolific OSS Builder' },
  { username: 'shadcn', label: 'shadcn/ui Creator' },
  { username: 'antirez', label: 'Redis Creator' },
];

export const HomePage: React.FC<HomePageProps> = ({
  onSelectDeveloper,
  onNavigateToCompare,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recentDevs, setRecentDevs] = useState<Developer[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const { addDeveloper, compareUsernames } = useCompare();

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const data = await developerApi.getRecent(6);
        setRecentDevs(data.developers);
      } catch (e) {
        // Fallback
      } finally {
        setIsLoadingRecent(false);
      }
    };
    loadRecent();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    onSelectDeveloper(searchTerm.trim());
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 sm:pt-16 sm:pb-12 text-center max-w-4xl mx-auto px-4">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-brand-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Full-Stack GitHub Developer Intelligence & Head-to-Head Metrics</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Analyze & Compare <br />
          <span className="bg-gradient-to-r from-brand-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
            GitHub Developers
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Look up any GitHub engineer to inspect aggregated stars, language distributions, and commit
          activity. Pit developers side-by-side with multi-metric comparison matrices and curated bookmarks.
        </p>

        {/* Hero Search Box */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-8 max-w-2xl mx-auto relative flex items-center"
        >
          <div className="relative w-full shadow-2xl">
            <Search className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter GitHub username (e.g. torvalds, gaearon, yyx990803)..."
              className="w-full pl-12 pr-32 py-4 bg-slate-900 border border-slate-700/80 rounded-2xl text-base text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5 shadow-md"
            >
              <span>Explore</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Featured Quick Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Try exploring:</span>
          {FEATURED_DEVS.map((dev) => (
            <button
              key={dev.username}
              onClick={() => onSelectDeveloper(dev.username)}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300 hover:text-brand-300 hover:border-brand-500/50 transition flex items-center gap-1.5"
            >
              <span>@{dev.username}</span>
              <span className="text-[10px] text-slate-500 font-sans hidden sm:inline">
                ({dev.label})
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center mb-4">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Live Metrics Aggregation</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pulls live public activity from the GitHub API, calculates total stars across all repositories,
            computes language breakdown weight, and tracks sprint commit cadence.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-4">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Side-by-Side Compare View</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Select 2 or more developers to view comparative head-to-head matrices, star reach, language
            overlap, and metric winners. Save named comparisons to revisit anytime.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4">
            <Bookmark className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Curate Repos & Notes</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Bookmark standout repositories directly to your private dashboard. Add custom architectural
            annotations, tag with custom labels, and organize your favorite tools.
          </p>
        </div>
      </section>

      {/* Recently Explored Developers Section */}
      {recentDevs.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Recently Explored Developers</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Fast-cached profiles ready for instantaneous lookup
              </p>
            </div>
            {compareUsernames.length >= 2 && (
              <button
                onClick={onNavigateToCompare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-semibold hover:bg-brand-500/25 transition"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Compare {compareUsernames.length} Queued Devs</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentDevs.map((dev) => (
              <div
                key={dev.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={dev.avatar_url || ''}
                        alt={dev.github_username}
                        className="w-12 h-12 rounded-full border border-slate-700 object-cover"
                      />
                      <div className="min-w-0">
                        <button
                          onClick={() => onSelectDeveloper(dev.github_username)}
                          className="font-bold text-white hover:text-brand-400 transition text-sm truncate block text-left"
                        >
                          {dev.name || dev.github_username}
                        </button>
                        <span className="text-xs text-slate-400 font-mono">
                          @{dev.github_username}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => addDeveloper(dev.github_username)}
                      title="Add to Compare"
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-brand-400 hover:border-brand-500/50 transition"
                    >
                      <Scale className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                    {dev.bio || 'Active open source developer'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 mt-4 border-t border-slate-800/80">
                  <span className="flex items-center gap-1 font-mono">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                    {dev.total_stars.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {dev.followers.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    {dev.public_repos} repos
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
