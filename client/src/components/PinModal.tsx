import React, { useState, useEffect } from 'react';
import { Repository } from '../types';
import { X, Bookmark, Tag, FileText, Plus } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  repo: Repository | null;
  onClose: () => void;
  onSave: (repoId: number, note: string, tags: string[]) => Promise<void>;
  onUnpin?: (repoId: number) => Promise<void>;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  repo,
  onClose,
  onSave,
  onUnpin,
}) => {
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (repo && repo.pin_details) {
      setNote(repo.pin_details.note || '');
      setTags(repo.pin_details.tags || []);
    } else {
      setNote('');
      setTags([]);
    }
  }, [repo]);

  if (!isOpen || !repo) return null;

  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(repo.id, note, tags);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnpin = async () => {
    if (!onUnpin) return;
    setIsSaving(true);
    try {
      await onUnpin(repo.id);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/15 text-brand-400">
              <Bookmark className="w-5 h-5 fill-brand-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white truncate max-w-xs sm:max-w-sm">
                {repo.is_pinned ? 'Edit Pinned Repository' : 'Pin Repository to Favorites'}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{repo.full_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-400" />
              <span>Personal Notes & Annotations</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add key takeaways, architectural highlights, or why you bookmarked this..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition resize-none"
            />
          </div>

          {/* Tags Manager */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-400" />
              <span>Tags</span>
            </label>

            {/* Input with Add button */}
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. backend, state-management, reference"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500 transition"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Tag Pills */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-medium"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-red-400 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <span className="text-xs text-slate-500 italic">No tags added yet.</span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {repo.is_pinned && onUnpin ? (
              <button
                type="button"
                onClick={handleUnpin}
                disabled={isSaving}
                className="px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition"
              >
                Unpin Repository
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium transition shadow-md disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : repo.is_pinned ? 'Update Pin' : 'Save Pin'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
