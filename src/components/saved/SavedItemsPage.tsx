import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SavedItem, ListCategory } from '../../services/quickShareService';
import { useLists } from '../../contexts/ListsContext';

const CATEGORY_CONFIG: Record<ListCategory, { label: string; icon: string; color: string; bg: string }> = {
  grocery: { label: 'Grocery', icon: '🛒', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  recipes: { label: 'Recipes', icon: '🍳', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  restaurants: { label: 'Restaurants', icon: '🍽️', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  places: { label: 'Places', icon: '📍', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  watchlist: { label: 'Watchlist', icon: '🎬', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  reading: { label: 'Reading', icon: '📚', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  music: { label: 'Music', icon: '🎵', color: 'text-pink-700', bg: 'bg-pink-50 border-pink-200' },
  uncategorized: { label: 'Uncategorized', icon: '📦', color: 'text-warm-600', bg: 'bg-warm-50 border-warm-200' },
};

const SavedItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const { savedItems: items, removeSavedItem, addSavedItemToList } = useLists();
  const [filter, setFilter] = useState<ListCategory | 'all' | 'needs-review'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter((item) => {
    if (filter === 'needs-review') {
      if (!item.needsUserInput) return false;
    } else if (filter !== 'all') {
      if (item.category !== filter) return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleRemove = (itemId: string) => {
    removeSavedItem(itemId);
  };

  const handleAddToList = (itemId: string, category: ListCategory) => {
    addSavedItemToList(itemId, category);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const needsReviewCount = items.filter((i) => i.needsUserInput).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-6">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold text-warm-800">Saved Items</h1>
            <p className="text-warm-500 text-small mt-1">
              {items.length} items saved
              {needsReviewCount > 0 && ` • ${needsReviewCount} need review`}
            </p>
          </div>
          <button
            onClick={() => navigate('/share')}
            className="px-4 py-2.5 gradient-coral text-white font-semibold text-sm rounded-xl hover:opacity-90 transition-all shadow-glow-coral"
          >
            + Add New
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search saved items..."
          className="w-full px-4 py-3 border-2 border-warm-200 rounded-xl text-sm placeholder:text-warm-400 focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/10"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl border-2 whitespace-nowrap transition-all ${
            filter === 'all'
              ? 'bg-brand-coral text-white border-brand-coral'
              : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
          }`}
        >
          All ({items.length})
        </button>
        {needsReviewCount > 0 && (
          <button
            onClick={() => setFilter('needs-review')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border-2 whitespace-nowrap transition-all ${
              filter === 'needs-review'
                ? 'bg-brand-sunset text-white border-brand-sunset'
                : 'bg-brand-sunset/5 text-brand-sunset border-brand-sunset/20 hover:border-brand-sunset/40'
            }`}
          >
            Needs Review ({needsReviewCount})
          </button>
        )}
        {(Object.keys(CATEGORY_CONFIG) as ListCategory[])
          .filter((cat) => items.some((i) => i.category === cat))
          .map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filter === category
                  ? `${CATEGORY_CONFIG[category].bg} ${CATEGORY_CONFIG[category].color} border-current`
                  : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
              }`}
            >
              <span>{CATEGORY_CONFIG[category].icon}</span>
              <span>{CATEGORY_CONFIG[category].label}</span>
              <span className="opacity-60">
                ({items.filter((i) => i.category === category).length})
              </span>
            </button>
          ))}
      </div>

      {/* Items list */}
      {filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 border rounded-2xl transition-all shadow-sm ${
                item.needsUserInput ? 'border-brand-sunset/30 bg-brand-sunset/5' : 'border-warm-200 bg-white hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Category icon */}
                <span className="text-2xl flex-shrink-0">
                  {CATEGORY_CONFIG[item.category]?.icon || '📦'}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-warm-800">{item.title}</h3>
                    <span className="text-xs text-warm-400 whitespace-nowrap">
                      {formatDate(item.savedAt)}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-sm text-warm-600 mt-1 line-clamp-2">{item.description}</p>
                  )}

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-warm-500 bg-warm-100 px-2 py-0.5 rounded-lg">
                      {item.source}
                    </span>
                    {item.addedToLists.length > 0 && (
                      <span className="text-xs text-brand-mint font-semibold">
                        Added to {item.addedToLists.map((l) => CATEGORY_CONFIG[l].label).join(', ')}
                      </span>
                    )}
                  </div>

                  {item.sourceReason && (
                    <p className="text-xs text-warm-400 mt-2 italic">{item.sourceReason}</p>
                  )}

                  {/* Quick add buttons for items needing review */}
                  {item.needsUserInput && item.addedToLists.length === 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(Object.keys(CATEGORY_CONFIG) as ListCategory[])
                        .filter((cat) => cat !== 'uncategorized')
                        .map((category) => (
                          <button
                            key={category}
                            onClick={() => handleAddToList(item.id, category)}
                            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 hover:shadow-sm ${CATEGORY_CONFIG[category].bg} ${CATEGORY_CONFIG[category].color}`}
                          >
                            <span>{CATEGORY_CONFIG[category].icon}</span>
                            <span>{CATEGORY_CONFIG[category].label}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-warm-400 hover:text-brand-ocean transition-colors rounded-lg"
                    title="Open URL"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 text-warm-400 hover:text-brand-coral transition-colors rounded-lg"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-warm-100 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">📥</span>
          </div>
          <h3 className="font-bold text-warm-800 mb-2">No items found</h3>
          <p className="text-warm-500 text-sm">
            {searchQuery || filter !== 'all'
              ? 'No items match your search or filter.'
              : 'No saved items yet. Use Quick Share to save content from URLs.'}
          </p>
          {!searchQuery && filter === 'all' && (
            <button
              onClick={() => navigate('/share')}
              className="mt-4 px-6 py-2.5 gradient-coral text-white font-semibold text-sm rounded-xl hover:opacity-90 transition-all shadow-glow-coral"
            >
              Go to Quick Share
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedItemsPage;
