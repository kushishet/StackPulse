import React, { useState, useEffect } from 'react';
import { compareApi } from '../api/client';
import { ComparisonResult } from '../types';
import { useCompare } from '../context/CompareContext';
import { useAuth } from '../context/AuthContext';
import { HeadToHeadTable } from '../components/HeadToHeadTable';
import { ComparisonCharts } from '../components/ComparisonCharts';
import { SaveComparisonModal } from '../components/SaveComparisonModal';
import {
  Scale,
  Plus,
  X,
  Save,
  Trash2,
  Trophy,
  Star,
  Users,
  BookOpen,
  GitFork,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface ComparePageProps {
  onViewProfile: (username: string) => void;
  onNavigateToSaved: () => void;
}

const PRESET_COMPARISONS = [
  ['torvalds', 'gaearon'],
  ['yyx990803', 'gaearon', 'sindresorhus'],
  ['shadcn', 'antirez'],
];

export const ComparePage: React.FC<ComparePageProps> = ({
  onViewProfile,
  onNavigateToSaved,
}) => {
  const { compareUsernames, addDeveloper, removeDeveloper, clearDevelopers, setDevelopers } = useCompare();
  const { isAuthenticated, openAuthModal } = useAuth();

  const [inputUsername, setInputUsername] = useState('');
  const [comparisonData, setComparisonData] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const fetchComparison = async (usernames: string[]) => {
    if (usernames.length === 0) {
      setComparisonData(null);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const data = await compareApi.compare(usernames);
      setComparisonData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to compare developers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (compareUsernames.length > 0) {
      fetchComparison(compareUsernames);
    } else {
      setComparisonData(null);
    }
  }, [compareUsernames]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUsername.trim()) return;
    addDeveloper(inputUsername.trim());
    setInputUsername('');
  };

  const handleSaveClick = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = async (name: string, description?: string) => {
    try {
      await compareApi.save(name, compareUsernames, description);
      onNavigateToSaved();
    } catch (err: any) {
      alert(`Failed to save comparison: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Compare Control Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Scale className="w-6 h-6 text-brand-400" />
              <span>Multi-Developer Comparison</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select 2 or more developers to compare metrics, star reach, language distributions, and commit volume side-by-side.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {compareUsernames.length >= 2 && (
              <button
                onClick={handleSaveClick}
                className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Comparison</span>
              </button>
            )}
            {compareUsernames.length > 0 && (
              <button
                onClick={clearDevelopers}
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/40 hover:text-red-400 text-slate-400 border border-slate-700/60 transition"
                title="Clear comparison list"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Developer Chips & Add Input */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800">
          {compareUsernames.map((u) => (
            <span
              key={u}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-200 text-xs font-mono font-medium shadow-sm"
            >
              <span>@{u}</span>
              <button
                onClick={() => removeDeveloper(u)}
                className="text-slate-400 hover:text-red-400 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          {/* Add Developer Input */}
          <form onSubmit={handleAddSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
              placeholder="Add username (e.g. torvalds)..."
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition w-52"
            />
            <button
              type="submit"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-brand-600 text-slate-300 hover:text-white transition"
              title="Add developer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-mono">
            Synthesizing comparative developer metrics across GitHub API & database...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-6 rounded-2xl bg-red-950/40 border border-red-800 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={() => fetchComparison(compareUsernames)}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-white hover:bg-slate-800 transition"
          >
            Retry Comparison
          </button>
        </div>
      )}

      {/* Empty State */}
      {compareUsernames.length < 2 && !isLoading && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
            <Scale className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">Compare at least 2 developers</h3>
            <p className="text-xs text-slate-400 mt-1">
              Add developers above or try one of these popular head-to-head comparisons:
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {PRESET_COMPARISONS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setDevelopers(preset)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-500/50 text-xs font-mono text-slate-300 hover:text-brand-300 transition flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>{preset.join(' vs ')}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Content */}
      {comparisonData && compareUsernames.length >= 2 && !isLoading && (
        <div className="space-y-8 animate-fade-in">
          {/* Winner Highlights Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30">
              <div className="flex items-center justify-between text-xs text-amber-300 font-semibold uppercase tracking-wider mb-2">
                <span>Star Leader</span>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
              <div className="text-lg font-extrabold text-white truncate">
                @{comparisonData.highlights.mostStars.username}
              </div>
              <div className="text-xs text-amber-400/80 font-mono mt-0.5">
                {comparisonData.highlights.mostStars.value.toLocaleString()} total stars
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-950/40 to-slate-900 border border-brand-500/30">
              <div className="flex items-center justify-between text-xs text-brand-300 font-semibold uppercase tracking-wider mb-2">
                <span>Most Followers</span>
                <Users className="w-4 h-4 text-brand-400" />
              </div>
              <div className="text-lg font-extrabold text-white truncate">
                @{comparisonData.highlights.mostFollowers.username}
              </div>
              <div className="text-xs text-brand-400/80 font-mono mt-0.5">
                {comparisonData.highlights.mostFollowers.value.toLocaleString()} followers
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30">
              <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold uppercase tracking-wider mb-2">
                <span>Most Repositories</span>
                <BookOpen className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-extrabold text-white truncate">
                @{comparisonData.highlights.mostRepos.username}
              </div>
              <div className="text-xs text-emerald-400/80 font-mono mt-0.5">
                {comparisonData.highlights.mostRepos.value.toLocaleString()} public repos
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-950/40 to-slate-900 border border-sky-500/30">
              <div className="flex items-center justify-between text-xs text-sky-300 font-semibold uppercase tracking-wider mb-2">
                <span>Forks Leader</span>
                <GitFork className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-lg font-extrabold text-white truncate">
                @{comparisonData.highlights.mostForks.username}
              </div>
              <div className="text-xs text-sky-400/80 font-mono mt-0.5">
                {comparisonData.highlights.mostForks.value.toLocaleString()} total forks
              </div>
            </div>
          </div>

          {/* Side-by-Side Table Matrix */}
          <HeadToHeadTable
            comparisonData={comparisonData}
            onRemoveDeveloper={removeDeveloper}
            onViewProfile={onViewProfile}
          />

          {/* Comparative Charts */}
          <ComparisonCharts comparisonData={comparisonData} />
        </div>
      )}

      {/* Save Modal */}
      <SaveComparisonModal
        isOpen={isSaveModalOpen}
        usernames={compareUsernames}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleConfirmSave}
      />
    </div>
  );
};
