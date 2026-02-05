import React, { useState, useEffect } from 'react';
import { WatchlistItem } from '../../types/research';
import { researchService } from '../../services/researchService';
import { useApp } from '../../contexts/AppContext';
import Card from '../common/Card';
import Button from '../common/Button';
import { Input, Select } from '../common/Input';

// Type options for watchlist items
const TYPE_OPTIONS = [
  { value: '', label: 'Any Type' },
  { value: 'movie', label: 'Movie' },
  { value: 'tv', label: 'TV Show' },
  { value: 'documentary', label: 'Documentary' },
];

interface WatchlistListProps {
  isFullPage?: boolean;
  onBack?: () => void;
}

const WatchlistList: React.FC<WatchlistListProps> = ({ isFullPage = false, onBack }) => {
  const { showToast } = useApp();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', type: '', notes: '' });
  const [isEnriching, setIsEnriching] = useState<string | null>(null);

  useEffect(() => {
    setWatchlist(researchService.getWatchlist());
  }, []);

  // Auto-enrich: Find IMDB link for the movie/show
  const enrichWithIMDB = async (name: string): Promise<string | null> => {
    try {
      // Search IMDB via a simple URL pattern (user can click to search)
      const searchQuery = encodeURIComponent(name);
      return `https://www.imdb.com/find/?q=${searchQuery}`;
    } catch {
      return null;
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name.trim()) return;

    setIsEnriching(newItem.name);

    // Try to get IMDB link
    const imdbUrl = await enrichWithIMDB(newItem.name);

    const item: WatchlistItem = {
      name: newItem.name,
      works: newItem.type ? [newItem.type] : [],
      imdbUrl,
      addedAt: new Date().toISOString(),
    };

    const updated = researchService.addToWatchlist(item);
    setWatchlist(updated);
    setNewItem({ name: '', type: '', notes: '' });
    setShowAddForm(false);
    setIsEnriching(null);
    showToast(`Added "${newItem.name}" to watchlist`, 'success');
  };

  const handleRemove = (name: string) => {
    const updated = researchService.removeFromWatchlist(name);
    setWatchlist(updated);
    showToast(`Removed "${name}" from watchlist`, 'info');
  };

  const containerClass = isFullPage ? 'min-h-screen bg-white' : '';

  return (
    <div className={containerClass}>
      {/* Header for full page mode */}
      {isFullPage && (
        <div className="sticky top-0 bg-white border-b-2 border-black z-10 px-4 py-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 -ml-2 hover:bg-concrete rounded-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-black flex items-center gap-2">
                <span className="text-2xl">🎬</span> Watchlist
              </h1>
              {watchlist.length > 0 && (
                <p className="text-sm text-slate">{watchlist.length} to watch</p>
              )}
            </div>
          </div>
        </div>
      )}

      <Card className={`${isFullPage ? 'border-0 shadow-none' : 'mb-4'} border-2 border-steel hover:border-charcoal transition-colors`}>
        {/* Header for embedded mode */}
        {!isFullPage && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="text-xl">🎬</span> Watchlist
              {watchlist.length > 0 && (
                <span className="text-xs bg-tab-red/20 text-tab-red px-2 py-1 rounded-full font-semibold">
                  {watchlist.length}
                </span>
              )}
            </h3>
          </div>
        )}

        {/* Item List */}
        {watchlist.length === 0 ? (
          <p className="text-slate text-sm italic mb-4 py-8 text-center">
            No movies or shows yet. Add something to watch!
          </p>
        ) : (
          <ul className="space-y-2 mb-4">
            {watchlist.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-3 p-4 bg-tab-red/5 border-2 border-tab-red/20 rounded-sm hover:border-tab-red/40 transition-all"
              >
                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <span className="text-base font-semibold text-black block">{item.name}</span>
                  {item.works && item.works.length > 0 && (
                    <span className="text-sm text-slate capitalize">{item.works[0]}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  {item.imdbUrl && (
                    <a
                      href={item.imdbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 px-4 flex items-center justify-center bg-tab-red/10 text-tab-red font-semibold text-sm rounded-sm hover:bg-tab-red/20 transition-colors"
                    >
                      IMDB →
                    </a>
                  )}
                  <button
                    onClick={() => handleRemove(item.name)}
                    className="w-12 h-12 flex items-center justify-center text-slate hover:text-danger hover:bg-red-50 rounded-sm transition-colors"
                    title="Remove"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Add Item Form */}
        {!showAddForm ? (
          <Button
            onClick={() => setShowAddForm(true)}
            variant="secondary"
            size="lg"
            className="w-full min-h-[56px] text-base"
          >
            + Add Movie or Show
          </Button>
        ) : (
          <div className="space-y-3 p-4 bg-concrete rounded-sm">
            <div className="flex gap-2">
              <Input
                placeholder="Movie or show title"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="flex-1 !mb-0 text-base min-h-[52px]"
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                autoFocus
              />
              <button
                onClick={() => setShowAddForm(false)}
                className="w-12 h-12 flex items-center justify-center text-slate hover:text-black"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <Select
              options={TYPE_OPTIONS}
              value={newItem.type}
              onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
              placeholder="Type (optional)"
              className="!mb-0 min-h-[52px]"
            />

            <Button
              onClick={handleAddItem}
              variant="primary"
              size="lg"
              className="w-full min-h-[56px]"
              isLoading={isEnriching !== null}
            >
              {isEnriching ? 'Finding IMDB...' : 'Add to Watchlist'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default WatchlistList;
