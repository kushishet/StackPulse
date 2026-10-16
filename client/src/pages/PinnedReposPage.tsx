import React, { useState, useEffect, useMemo } from 'react';
import { pinApi } from '../api/client';
import { Pin, Repository } from '../types';
import { PinModal } from '../components/PinModal';
import {
  Bookmark,
  Tag,
  Star,
  GitFork,
  ExternalLink,
  Edit2,
  Trash2,
  Search,
  FileText,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';

interface PinnedReposPageProps {
  onViewDeveloper: (username: string) => void;
}

export const PinnedReposPage: React.FC<PinnedReposPageProps> = ({ onViewDeveloper }) => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Edit Pin modal
  const [editingRepo, setEditingRepo] = useState<Repository | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPins = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await pinApi.getPins(selectedTag || undefined);
      setPins(data.pins);
    } catch (err: any) {
      setError(err.message || 'Failed to load pinned repositories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPins();
  }, [selectedTag]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    pins.forEach((p) => {
      p.tags.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [pins]);

  // Filtered pins
  const filteredPins = useMemo(() => {
    return pins.filter((p) => {
      const repoName = p.repo?.name || '';
      const repoDesc = p.repo?.description || '';
      const note = p.note || '';
      const matchesSearch =
        repoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repoDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [pins, searchQuery]);

  const handleOpenEdit = (pin: Pin) => {
    if (!pin.repo) return;
    setEditingRepo({
      ...pin.repo,
      is_pinned: true,
      pin_details: {
        id: pin.id,
        note: pin.note,
        tags: pin.tags,
        created_at: pin.created_at,
      },
    });
    setIsModalOpen(true);
  };

  const handleSavePin = async (repoId: number, note: string, tags: string[]) => {
    try {
      await pinApi.pinRepo(repoId, note, tags);
      fetchPins();
    } catch (e: any) {
      alert(`Failed to update pin: ${e.message}`);
    }
  };

  const handleUnpin = async (repoId: number) => {
    try {
      await pinApi.unpinByRepo(repoId);
      setPins((prev) => prev.filter((p) => p.repo_id !== repoId));
    } catch (e: any) {
      alert(`Failed to unpin: ${e.message}`);
    }
  };

  if (isLoading && pins.length === 0) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400 font-mono">Loading your pinned repositories & notes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 text-brand-400 fill-brand-400" />
            <span>Pinned Repositories & Curations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Personal collection of standout repositories with your private annotations and custom tags.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500">
          {pins.length} Curated Repositories
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pinned repos or notes..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-start md:justify-end">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedTag === null
                ? 'bg-brand-500 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Tags
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                selectedTag === tag
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-brand-300 border border-slate-800'
              }`}
            >
              <Tag className="w-3 h-3" />
              <span>#{tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Pinned Repos */}
      {filteredPins.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
            <FolderOpen className="w-7 h-7" />
          </div>
          <div className="max-w-sm mx-auto">
            <h3 className="text-base font-bold text-white">No pinned repositories found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {pins.length === 0
                ? 'Search any developer and click the bookmark icon on any repository to pin it here.'
                : 'No pinned repositories match the active search or tag filter.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPins.map((pin) => {
            const repo = pin.repo;
            const dev = pin.developer;

            return (
              <div
                key={pin.id}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Dev username & Actions */}
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
                    {dev && (
                      <button
                        onClick={() => onViewDeveloper(dev.github_username)}
                        className="flex items-center gap-2 hover:opacity-80 transition text-left"
                      >
                        <img
                          src={dev.avatar_url || ''}
                          alt={dev.github_username}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="text-xs font-mono text-slate-400 hover:text-brand-400">
                          @{dev.github_username}
                        </span>
                      </button>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(pin)}
                        title="Edit note & tags"
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleUnpin(pin.repo_id)}
                        title="Unpin repository"
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Repo Title */}
                  <div className="flex items-start justify-between gap-2">
                    <a
                      href={repo?.html_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-bold text-white hover:text-brand-400 transition inline-flex items-center gap-1.5 truncate"
                    >
                      <span className="truncate">{repo?.name || 'Unnamed repo'}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    </a>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {repo?.description || 'No description provided.'}
                  </p>

                  {/* Personal Note Box */}
                  {pin.note && (
                    <div className="mt-4 p-3 rounded-xl bg-brand-950/40 border border-brand-800/30 text-xs">
                      <div className="flex items-center gap-1.5 text-brand-300 font-semibold mb-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>My Note</span>
                      </div>
                      <p className="text-slate-300 italic leading-relaxed">{pin.note}</p>
                    </div>
                  )}

                  {/* Tags */}
                  {pin.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-2">
                      {pin.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-brand-300"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Metrics */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 mt-5 border-t border-slate-800/80">
                  <span className="flex items-center gap-1 font-mono">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                    {repo?.stars?.toLocaleString() || 0}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <GitFork className="w-3.5 h-3.5 text-slate-400" />
                    {repo?.forks?.toLocaleString() || 0}
                  </span>
                  {repo?.primary_language && (
                    <span className="font-medium text-slate-300">
                      {repo.primary_language}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pin Edit Modal */}
      <PinModal
        isOpen={isModalOpen}
        repo={editingRepo}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePin}
        onUnpin={handleUnpin}
      />
    </div>
  );
};
