import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ListCategory } from '../../services/quickShareService';
import { useLists } from '../../contexts/ListsContext';

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
  const { savedItems } = useLists();
  const items = savedItems.slice(0, 3);

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

  const needsReviewCount = savedItems.filter((i) => i.needsUserInput).length;

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-warm-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-warm-800 flex items-center gap-2">
          <span className="text-lg">📥</span> Recently Saved
        </h3>
        <button
          onClick={() => navigate('/saved')}
          className="text-xs text-brand-ocean hover:underline font-semibold"
        >
          View all →
        </button>
      </div>

      {needsReviewCount > 0 && (
        <button
          onClick={() => navigate('/saved')}
          className="w-full mb-3 p-2.5 bg-brand-sunset/5 border border-brand-sunset/20 rounded-xl text-sm text-brand-sunset font-semibold hover:bg-brand-sunset/10 transition-colors"
        >
          {needsReviewCount} item{needsReviewCount > 1 ? 's' : ''} need review
        </button>
      )}

      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-warm-50 transition-colors cursor-pointer"
            onClick={() => navigate('/saved')}
          >
            <span className="text-lg">{CATEGORY_ICONS[item.category] || '📦'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-warm-800 truncate">{item.title}</p>
              <p className="text-xs text-warm-500">
                {item.source} • {formatDate(item.savedAt)}
              </p>
            </div>
            {item.addedToLists.length > 0 && (
              <span className="text-xs text-brand-mint font-semibold">✓</span>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/share')}
        className="w-full mt-3 p-2.5 gradient-coral text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-glow-coral"
      >
        + Quick Share
      </button>
    </div>
  );
};

export default RecentlySavedWidget;
