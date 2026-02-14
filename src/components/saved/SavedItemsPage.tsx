import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  quickShareService,
  SavedItem,
  ListCategory,
} from '../../services/quickShareService';

const CATEGORY_CONFIG: Record<ListCategory, { label: string; icon: string; color: string }> = {
  grocery: { label: 'Grocery', icon: '🛒', color: 'bg-green-100 border-green-500 text-green-700' },
  recipes: { label: 'Recipes', icon: '🍳', color: 'bg-orange-100 border-orange-500 text-orange-700' },
  restaurants: { label: 'Restaurants', icon: '🍽️', color: 'bg-red-100 border-red-500 text-red-700' },
  places: { label: 'Places', icon: '📍', color: 'bg-blue-100 border-blue-500 text-blue-700' },
  watchlist: { label: 'Watchlist', icon: '🎬', color: 'bg-purple-100 border-purple-500 text-purple-700' },
  reading: { label: 'Reading', icon: '📚', color: 'bg-yellow-100 border-yellow-500 text-yellow-700' },
  music: { label: 'Music', icon: '🎵', color: 'bg-pink-100 border-pink-500 text-pink-700' },
  uncategorized: { label: 'Uncategorized', icon: '📦', color: 'bg-gray-100 border-gray-500 text-gray-700' },
};

const SavedItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [filter, setFilter] = useState<ListCategory | 'all' | 'needs-review'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setItems(quickShareService.getSavedItems());
  }, []);

  const filteredItems = items.filter((item) => {
    // Filter by category
    if (filter === 'needs-review') {
      if (!item.needsUserInput) return false;
    } else if (filter !== 'all') {
      if (item.category !== filter) return false;
    }

    // Filter by search
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
    quickShareService.removeSavedItem(itemId);
    setItems(quickShareService.getSavedItems());
  };

  const handleAddToList = (itemId: string, category: ListCategory) => {
    quickShareService.addToList(itemId, category);
    setItems(quickShareService.getSavedItems());
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
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold text-black">Saved Items</h1>
            <p className="text-slate text-small mt-1">
              {items.length} items saved
              {needsReviewCount > 0 && ` • ${needsReviewCount} need review`}
            </p>
          </div>
          <button
            onClick={() => navigate('/tools')}
            className="px-4 py-2 bg-black text-white font-semibold text-sm rounded-sm hover:bg-charcoal transition-colors"
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
          className="w-full px-4 py-3 border-2 border-black rounded-sm text-sm placeholder:text-slate"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-sm border-2 whitespace-nowrap transition-colors ${
            filter === 'all'
              ? 'bg-black text-white border-black'
              : 'bg-white text-black border-black hover:bg-concrete'
          }`}
        >
          All ({items.length})
        </button>
        {needsReviewCount > 0 && (
          <button
            onClick={() => setFilter('needs-review')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-sm border-2 whitespace-nowrap transition-colors ${
              filter === 'needs-review'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
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
              className={`px-3 py-1.5 text-xs font-semibold rounded-sm border-2 whitespace-nowrap transition-colors flex items-center gap-1 ${
                filter === category
                  ? `${CATEGORY_CONFIG[category].color} border-current`
                  : 'bg-white text-black border-concrete hover:border-black'
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
              className={`p-4 border-2 rounded-sm transition-colors ${
                item.needsUserInput ? 'border-amber-400 bg-amber-50' : 'border-concrete hover:border-black'
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
                    <h3 className="font-bold text-black">{item.title}</h3>
                    <span className="text-xs text-slate whitespace-nowrap">
                      {formatDate(item.savedAt)}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-sm text-charcoal mt-1 line-clamp-2">{item.description}</p>
                  )}

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-slate bg-concrete px-2 py-0.5 rounded">
                      {item.source}
                    </span>
                    {item.addedToLists.length > 0 && (
                      <span className="text-xs text-green-600 font-semibold">
                        Added to {item.addedToLists.map((l) => CATEGORY_CONFIG[l].label).join(', ')}
                      </span>
                    )}
                  </div>

                  {item.sourceReason && (
                    <p className="text-xs text-slate mt-2 italic">{item.sourceReason}</p>
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
                            className={`px-2 py-1 text-xs font-semibold rounded-sm border transition-colors flex items-center gap-1 ${CATEGORY_CONFIG[category].color}`}
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
                    className="p-1.5 text-slate hover:text-black transition-colors"
                    title="Open URL"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 text-slate hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <span className="text-4xl">📥</span>
          <p className="mt-4 text-slate">
            {searchQuery || filter !== 'all'
              ? 'No items match your search or filter.'
              : 'No saved items yet. Use Quick Share in Tools to save content from URLs.'}
          </p>
          {!searchQuery && filter === 'all' && (
            <button
              onClick={() => navigate('/tools')}
              className="mt-4 px-6 py-2 bg-black text-white font-semibold text-sm rounded-sm hover:bg-charcoal transition-colors"
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
