import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quickShareService, SavedItem, ListCategory } from '../../services/quickShareService';

const CATEGORY_ICONS: Record<ListCategory, string> = {
  grocery: '🛒',
  recipes: '🍳',
  restaurants: '🍽️',
  places: '📍',
  watchlist: '🎬',
  reading: '📚',
  music: '🎵',
  uncategorized: '📦',
};

const RecentlySavedWidget: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<SavedItem[]>([]);

  useEffect(() => {
    setItems(quickShareService.getRecentItems(3));
  }, []);

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
    return `${diffDays}d ago`;
  };

  const needsReviewCount = quickShareService.getItemsNeedingInput().length;

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="border-2 border-black rounded-sm p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-black">Recently Saved</h3>
        <button
          onClick={() => navigate('/saved')}
          className="text-xs text-tab-blue hover:underline font-semibold"
        >
          View all →
        </button>
      </div>

      {needsReviewCount > 0 && (
        <button
          onClick={() => navigate('/saved')}
          className="w-full mb-3 p-2 bg-amber-50 border-2 border-amber-300 rounded-sm text-sm text-amber-700 font-semibold hover:bg-amber-100 transition-colors"
        >
          {needsReviewCount} item{needsReviewCount > 1 ? 's' : ''} need review
        </button>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-2 rounded-sm hover:bg-concrete transition-colors cursor-pointer"
            onClick={() => navigate('/saved')}
          >
            <span className="text-lg">{CATEGORY_ICONS[item.category] || '📦'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-xs text-slate">
                {item.source} • {formatDate(item.savedAt)}
              </p>
            </div>
            {item.addedToLists.length > 0 && (
              <span className="text-xs text-green-600">✓</span>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/tools')}
        className="w-full mt-3 p-2 border-2 border-black rounded-sm text-sm font-semibold hover:bg-black hover:text-white transition-colors"
      >
        + Quick Share
      </button>
    </div>
  );
};

export default RecentlySavedWidget;
