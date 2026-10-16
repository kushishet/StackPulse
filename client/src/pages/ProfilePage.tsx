import React, { useState, useEffect } from 'react';
import { developerApi, pinApi } from '../api/client';
import { Developer, Repository } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../context/CompareContext';
import { MetricStatCard } from '../components/MetricStatCard';
import { LanguageChart } from '../components/LanguageChart';
import { CommitActivityChart } from '../components/CommitActivityChart';
import { RepoList } from '../components/RepoList';
import { PinModal } from '../components/PinModal';
import {
  Star,
  Users,
  GitFork,
  BookOpen,
  MapPin,
  Building,
  Link as LinkIcon,
  Twitter,
  ExternalLink,
  RefreshCw,
  Scale,
  CheckCircle,
  Database,
  Globe,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

interface ProfilePageProps {
  username: string;
  onBack: () => void;
  onNavigateToCompare: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  username,
  onBack,
  onNavigateToCompare,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { addDeveloper, isInCompare } = useCompare();

  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isCached, setIsCached] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pin Modal State
  const [selectedRepoForPin, setSelectedRepoForPin] = useState<Repository | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const fetchProfile = async (force: boolean = false) => {
    setError(null);
    if (force) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await developerApi.getProfile(username, force);
      setDeveloper(data.developer);
      setRepos(data.repos);
      setIsCached(data.is_cached);
    } catch (err: any) {
      setError(err.message || `Failed to load GitHub profile for '${username}'.`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile(false);
  }, [username]);

  const handleRefreshClick = () => {
    fetchProfile(true);
  };

  const handleCompareClick = () => {
    if (developer) {
      addDeveloper(developer.github_username);
      onNavigateToCompare();
    }
  };

  const handleOpenPinModal = (repo: Repository) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setSelectedRepoForPin(repo);
    setIsPinModalOpen(true);
  };

  const handleSavePin = async (repoId: number, note: string, tags: string[]) => {
    try {
      const { pin } = await pinApi.pinRepo(repoId, note, tags);
      // Update local repo state
      setRepos((prev) =>
        prev.map((r) =>
          r.id === repoId
            ? {
                ...r,
                is_pinned: true,
                pin_details: {
                  id: pin.id,
                  note: pin.note,
                  tags: pin.tags,
                  created_at: pin.created_at,
                },
              }
            : r
        )
      );
    } catch (e: any) {
      console.error('Failed to pin repo:', e);
    }
  };

  const handleUnpinRepo = async (repoId: number) => {
    try {
      await pinApi.unpinByRepo(repoId);
      setRepos((prev) =>
        prev.map((r) =>
          r.id === repoId
            ? {
                ...r,
                is_pinned: false,
                pin_details: null,
              }
            : r
        )
      );
    } catch (e: any) {
      console.error('Failed to unpin repo:', e);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400 font-mono">
          Querying GitHub API & computing profile metrics for @{username}...
        </p>
      </div>
    );
  }

  if (error || !developer) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Profile Lookup Failed</h2>
          <p className="text-sm text-slate-400 mt-2">{error || 'Developer not found.'}</p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            Go Back
          </button>
          <button
            onClick={() => fetchProfile(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-xs font-semibold text-white transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Fetch</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Back button & cache status banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Explore</span>
        </button>

        {/* Cache / Live source indicator */}
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
              isCached
                ? 'bg-slate-900/80 border-slate-800 text-slate-400'
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
            }`}
          >
            {isCached ? <Database className="w-3.5 h-3.5 text-brand-400" /> : <Globe className="w-3.5 h-3.5 text-emerald-400" />}
            <span>
              {isCached
                ? `Fast-Loaded from Cache (${new Date(developer.fetched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                : 'Live Data from GitHub API'}
            </span>
          </div>

          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition text-xs disabled:opacity-50"
            title="Bypass database cache and fetch fresh data from GitHub"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Live'}</span>
          </button>
        </div>
      </div>

      {/* Developer Profile Header Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={developer.avatar_url || ''}
              alt={developer.github_username}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-slate-700 object-cover shadow-xl shrink-0"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {developer.name || developer.github_username}
                </h1>
                <a
                  href={`https://github.com/${developer.github_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 hover:text-brand-300 hover:bg-slate-700 transition inline-flex items-center gap-1"
                >
                  <span>@{developer.github_username}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>

              {developer.bio && (
                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {developer.bio}
                </p>
              )}

              {/* Badges: Company, Location, Blog, Twitter */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
                {developer.company && (
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{developer.company}</span>
                  </span>
                )}
                {developer.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{developer.location}</span>
                  </span>
                )}
                {developer.blog && (
                  <a
                    href={developer.blog.startsWith('http') ? developer.blog : `https://${developer.blog}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-brand-400 transition"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate max-w-[180px]">{developer.blog}</span>
                  </a>
                )}
                {developer.twitter_username && (
                  <a
                    href={`https://twitter.com/${developer.twitter_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-sky-400 transition"
                  >
                    <Twitter className="w-3.5 h-3.5 text-slate-500" />
                    <span>@{developer.twitter_username}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={handleCompareClick}
              className={`px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition flex items-center gap-2 shadow-md ${
                isInCompare(developer.github_username)
                  ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                  : 'bg-brand-600 hover:bg-brand-500 text-white'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>
                {isInCompare(developer.github_username) ? 'Queued in Compare' : 'Add to Compare'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Metric Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricStatCard
          label="Total Stars"
          value={developer.total_stars}
          icon={Star}
          subtext="Across public repositories"
          highlight={true}
        />
        <MetricStatCard
          label="Followers"
          value={developer.followers}
          icon={Users}
          subtext="GitHub developers following"
        />
        <MetricStatCard
          label="Public Repositories"
          value={developer.public_repos}
          icon={BookOpen}
          subtext="Indexed on profile"
        />
        <MetricStatCard
          label="Total Forks"
          value={developer.total_forks}
          icon={GitFork}
          subtext="Community derivative forks"
        />
      </div>

      {/* Visual Analytics: Language Distribution & Commit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LanguageChart languages={developer.languages} />
        <CommitActivityChart activity={developer.commit_activity} />
      </div>

      {/* Repositories Explorer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Repository Explorer</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore projects, filter by technology, and pin favorites with custom tags
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {repos.length} Repositories Indexed
          </span>
        </div>

        <RepoList repos={repos} onPinClick={handleOpenPinModal} />
      </div>

      {/* Pin / Annotation Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        repo={selectedRepoForPin}
        onClose={() => setIsPinModalOpen(false)}
        onSave={handleSavePin}
        onUnpin={handleUnpinRepo}
      />
    </div>
  );
};
