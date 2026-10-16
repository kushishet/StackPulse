import React, { useState, useEffect } from 'react';
import { compareApi } from '../api/client';
import { Comparison } from '../types';
import { useCompare } from '../context/CompareContext';
import {
  Layers,
  Play,
  Trash2,
  Calendar,
  AlertCircle,
  ExternalLink,
  Edit2,
  Check,
  X,
} from 'lucide-react';

interface SavedComparisonsPageProps {
  onLoadComparison: () => void;
}

export const SavedComparisonsPage: React.FC<SavedComparisonsPageProps> = ({
  onLoadComparison,
}) => {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setDevelopers } = useCompare();

  // Rename state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const fetchSaved = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await compareApi.getSaved();
      setComparisons(data.comparisons);
    } catch (err: any) {
      setError(err.message || 'Failed to load saved comparisons.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleLoad = (comp: Comparison) => {
    if (comp.developers && comp.developers.length > 0) {
      setDevelopers(comp.developers.map((d) => d.github_username));
      onLoadComparison();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this saved comparison?')) return;
    try {
      await compareApi.delete(id);
      setComparisons((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(`Failed to delete comparison: ${err.message}`);
    }
  };

  const handleStartRename = (comp: Comparison) => {
    setEditingId(comp.id);
    setEditName(comp.name);
  };

  const handleSaveRename = async (id: number) => {
    if (!editName.trim()) return;
    try {
      const { comparison } = await compareApi.update(id, editName.trim());
      setComparisons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: comparison.name } : c))
      );
      setEditingId(null);
    } catch (err: any) {
      alert(`Failed to rename comparison: ${err.message}`);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400 font-mono">Loading saved comparisons...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-brand-400" />
            <span>Saved Comparisons</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Personal comparison snapshots saved to your account.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500">
          {comparisons.length} Saved Snapshots
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {comparisons.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <div className="max-w-sm mx-auto">
            <h3 className="text-base font-bold text-white">No saved comparisons yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Run any comparison in the Compare tab and click "Save Comparison" to preserve it here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {comparisons.map((comp) => {
            const devs = comp.developers || [];
            const isEditing = editingId === comp.id;

            return (
              <div
                key={comp.id}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  {/* Title or inline edit */}
                  <div className="flex items-start justify-between gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-950 border border-brand-500 rounded text-sm text-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveRename(comp.id)}
                          className="p-1 rounded bg-brand-600 text-white hover:bg-brand-500"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h3 className="text-base font-bold text-white truncate">{comp.name}</h3>
                        <button
                          onClick={() => handleStartRename(comp)}
                          className="text-slate-500 hover:text-slate-300 p-1"
                          title="Rename comparison"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => handleDelete(comp.id)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded transition"
                      title="Delete comparison"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {comp.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {comp.description}
                    </p>
                  )}

                  {/* Developers Avatars & Usernames */}
                  <div className="mt-5 space-y-2">
                    <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                      Compared Developers ({devs.length})
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {devs.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300"
                        >
                          <img
                            src={d.avatar_url || ''}
                            alt={d.github_username}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span>@{d.github_username}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="flex items-center justify-between pt-4 mt-6 border-t border-slate-800/80 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(comp.created_at)}</span>
                  </span>

                  <button
                    onClick={() => handleLoad(comp)}
                    className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Load Matrix</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
