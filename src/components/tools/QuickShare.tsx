import React, { useState, useMemo } from 'react';
import {
  quickShareService,
  SavedItem,
  ListCategory,
  AnalysisResult,
} from '../../services/quickShareService';
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

// Source-specific configs for visual feedback
const SOURCE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  instagram: { icon: '📸', label: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' },
  youtube: { icon: '▶️', label: 'YouTube', color: 'bg-red-500 text-white' },
  tiktok: { icon: '🎵', label: 'TikTok', color: 'bg-warm-900 text-white' },
  spotify: { icon: '🎧', label: 'Spotify', color: 'bg-green-500 text-white' },
  twitter: { icon: '🐦', label: 'Twitter/X', color: 'bg-sky-500 text-white' },
  yelp: { icon: '⭐', label: 'Yelp', color: 'bg-red-600 text-white' },
  website: { icon: '🌐', label: 'Website', color: 'bg-warm-500 text-white' },
};

interface QuickShareProps {
  initialUrl?: string;
  onComplete?: () => void;
}

const QuickShare: React.FC<QuickShareProps> = ({ initialUrl, onComplete }) => {
  const [url, setUrl] = useState(initialUrl || '');
  const [batchMode, setBatchMode] = useState(false);
  const [batchUrls, setBatchUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<{
    item: SavedItem;
    analysis: AnalysisResult;
  } | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number } | null>(null);
  const [showFoodSuggestions, setShowFoodSuggestions] = useState(false);

  const {
    savedItems,
    setSavedItems,
    removeSavedItem,
    addSavedItemToList,
    addGroceryItem,
    addRestaurant,
    addToPlacesList,
    addToWatchlist,
    addToReadingList,
    addToSpotifyList,
    restaurantsList,
  } = useLists();
  const recentItems = savedItems.slice(0, 10);

  // Food suggestions based on shared restaurant content
  const foodSuggestions = useMemo(() => {
    // Get restaurants that were recently added via sharing
    const sharedRestaurants = savedItems
      .filter((item) => item.category === 'restaurants' && item.addedToLists.includes('restaurants'))
      .slice(0, 5);

    // Get all restaurants from the list that haven't been visited
    const unvisitedRestaurants = restaurantsList
      .filter((r) => !r.lastVisited && (r.status || 'active') === 'active')
      .slice(0, 5);

    // Collect cuisine types from shared items
    const sharedCuisines = new Set<string>();
    sharedRestaurants.forEach((item) => {
      if (item.description) {
        const words = item.description.toLowerCase().split(/[\s,]+/);
        const cuisineKeywords = ['italian', 'mexican', 'japanese', 'chinese', 'thai', 'indian', 'korean', 'vietnamese', 'french', 'mediterranean', 'american', 'bbq', 'sushi', 'pizza', 'ramen', 'tacos', 'burgers', 'seafood', 'brunch', 'cafe', 'bakery', 'dessert'];
        words.forEach((w) => { if (cuisineKeywords.includes(w)) sharedCuisines.add(w); });
      }
    });

    // Match unvisited restaurants by cuisine
    const suggested = unvisitedRestaurants.filter((r) => {
      if (sharedCuisines.size === 0) return true; // If no cuisine info, suggest all
      const cuisine = (r.cuisine || '').toLowerCase();
      return Array.from(sharedCuisines).some((c) => cuisine.includes(c));
    });

    return {
      sharedRestaurants,
      suggested: suggested.length > 0 ? suggested : unvisitedRestaurants.slice(0, 3),
      cuisines: Array.from(sharedCuisines),
    };
  }, [savedItems, restaurantsList]);

  // Google Maps entries from restaurant list
  const googleMapsEntries = useMemo(() => {
    return restaurantsList
      .filter((r) => r.googleMapsUrl || r.googleMapsUri)
      .map((r) => ({
        id: r.id,
        name: r.name,
        cuisine: r.cuisine,
        neighborhood: r.neighborhood,
        url: r.googleMapsUrl || r.googleMapsUri,
        isNew: !r.lastVisited,
        city: r.city,
      }));
  }, [restaurantsList]);

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setCurrentAnalysis(null);

    try {
      const result = await quickShareService.quickSave(url.trim());
      setCurrentAnalysis(result);
      setSavedItems(quickShareService.getSavedItems());
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze URL');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchAnalyze = async () => {
    const urls = batchUrls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0) return;

    setLoading(true);
    setError(null);
    setBatchProgress({ completed: 0, total: urls.length });

    try {
      await quickShareService.batchSave(urls, (completed, total) => {
        setBatchProgress({ completed, total });
      });
      setSavedItems(quickShareService.getSavedItems());
      setBatchUrls('');
      setBatchMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process batch');
    } finally {
      setLoading(false);
      setBatchProgress(null);
    }
  };

  const handleAddToList = (category: ListCategory) => {
    if (!currentAnalysis) return;
    addSavedItemToList(currentAnalysis.item.id, category);

    const matchingItems = currentAnalysis.analysis.extractedItems.filter(
      (item) => item.type === category
    );
    if (matchingItems.length > 0) {
      const now = new Date().toISOString();
      matchingItems.forEach((extracted) => {
        switch (extracted.type) {
          case 'grocery':
            addGroceryItem({ name: extracted.name, quantity: parseInt(extracted.quantity || '1', 10) || 1, unit: extracted.unit || '', isStaple: false });
            break;
          case 'restaurants':
            addRestaurant({ name: extracted.name, cuisine: extracted.details || '', location: '', notes: '' });
            break;
          case 'places':
            addToPlacesList({ name: extracted.name, location: extracted.details || null, reason: '', visited: false, addedAt: now });
            break;
          case 'watchlist':
            addToWatchlist({ name: extracted.name, works: extracted.details ? [extracted.details] : [], imdbUrl: null, addedAt: now });
            break;
          case 'reading':
            addToReadingList({ name: extracted.name, works: extracted.details ? [extracted.details] : [], kindleUrl: null, addedAt: now });
            break;
          case 'music':
            addToSpotifyList({ name: extracted.name, spotifyUrl: null, addedAt: now });
            break;
        }
      });
    }

    setCurrentAnalysis(null);
    onComplete?.();
  };

  const handleConfirmSuggested = () => {
    if (!currentAnalysis) return;
    handleAddToList(currentAnalysis.item.category);
  };

  const handleRemoveItem = (itemId: string) => {
    removeSavedItem(itemId);
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

  const getSourceConfig = (source: string) => {
    return SOURCE_CONFIG[source] || SOURCE_CONFIG.website;
  };

  return (
    <div className="space-y-5">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setBatchMode(false)}
          className={`flex-1 px-4 py-2.5 font-semibold text-sm rounded-xl border-2 transition-all ${
            !batchMode
              ? 'bg-brand-coral text-white border-brand-coral shadow-glow-coral'
              : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
          }`}
        >
          Single URL
        </button>
        <button
          onClick={() => setBatchMode(true)}
          className={`flex-1 px-4 py-2.5 font-semibold text-sm rounded-xl border-2 transition-all ${
            batchMode
              ? 'bg-brand-coral text-white border-brand-coral shadow-glow-coral'
              : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
          }`}
        >
          Batch Mode
        </button>
      </div>

      {/* URL Input */}
      {!batchMode ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste Instagram, YouTube, or any URL..."
              className="flex-1 px-4 py-3.5 border-2 border-warm-200 rounded-xl text-sm placeholder:text-warm-400 focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/10"
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !url.trim()}
              className="px-5 py-3.5 gradient-coral text-white font-semibold text-sm rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-coral"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                'Save'
              )}
            </button>
          </div>
          {/* Instagram hint */}
          <p className="text-xs text-warm-400 flex items-center gap-1.5">
            <span>📸</span> Tip: Share Instagram posts directly to Valt-Tab from the share menu
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={batchUrls}
            onChange={(e) => setBatchUrls(e.target.value)}
            placeholder="Paste multiple URLs, one per line..."
            rows={5}
            className="w-full px-4 py-3.5 border-2 border-warm-200 rounded-xl text-sm placeholder:text-warm-400 resize-none focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/10"
          />
          <button
            onClick={handleBatchAnalyze}
            disabled={loading || !batchUrls.trim()}
            className="w-full px-6 py-3.5 gradient-coral text-white font-semibold text-sm rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-coral"
          >
            {loading
              ? batchProgress
                ? `Processing ${batchProgress.completed}/${batchProgress.total}...`
                : 'Processing...'
              : `Save ${batchUrls.split('\n').filter((u) => u.trim()).length} URLs`}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Analysis Result */}
      {currentAnalysis && (
        <div className="bg-white p-5 border border-warm-200 rounded-2xl shadow-md space-y-4">
          {/* Source badge */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${getSourceConfig(currentAnalysis.item.source).color}`}>
              {getSourceConfig(currentAnalysis.item.source).icon} {getSourceConfig(currentAnalysis.item.source).label}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                currentAnalysis.analysis.confidence === 'high'
                  ? 'bg-brand-mint/10 text-brand-mint'
                  : currentAnalysis.analysis.confidence === 'medium'
                    ? 'bg-brand-peach text-warm-700'
                    : 'bg-brand-coral/10 text-brand-coral'
              }`}
            >
              {currentAnalysis.analysis.confidence} confidence
            </span>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-3xl">
              {CATEGORY_CONFIG[currentAnalysis.item.category]?.icon || '📦'}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-warm-800 text-lg">{currentAnalysis.item.title}</h3>
              <p className="text-sm text-warm-500 mt-1">{currentAnalysis.item.description}</p>
              <p className="text-xs text-warm-400 mt-2 italic">
                {currentAnalysis.item.sourceReason}
              </p>
            </div>
          </div>

          {/* Suggested category with confirm */}
          {currentAnalysis.analysis.confidence !== 'low' && (
            <button
              onClick={handleConfirmSuggested}
              className={`w-full p-3.5 border-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:shadow-md ${CATEGORY_CONFIG[currentAnalysis.item.category]?.bg || 'bg-warm-50 border-warm-200'} ${CATEGORY_CONFIG[currentAnalysis.item.category]?.color}`}
            >
              <span className="text-lg">{CATEGORY_CONFIG[currentAnalysis.item.category]?.icon}</span>
              <span>Add to {CATEGORY_CONFIG[currentAnalysis.item.category]?.label}</span>
            </button>
          )}

          {/* Category options */}
          <div className="space-y-2">
            <p className="text-xs text-warm-500 font-semibold uppercase tracking-wider">
              {currentAnalysis.analysis.confidence === 'low'
                ? 'Choose a list:'
                : 'Or choose a different list:'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CATEGORY_CONFIG) as ListCategory[])
                .filter((cat) => cat !== 'uncategorized' && cat !== currentAnalysis.item.category)
                .map((category) => (
                  <button
                    key={category}
                    onClick={() => handleAddToList(category)}
                    className={`p-2.5 border rounded-xl text-sm flex items-center gap-2 transition-all hover:shadow-sm ${CATEGORY_CONFIG[category].bg} ${CATEGORY_CONFIG[category].color}`}
                  >
                    <span>{CATEGORY_CONFIG[category].icon}</span>
                    <span className="font-medium">{CATEGORY_CONFIG[category].label}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Extracted items preview */}
          {currentAnalysis.analysis.extractedItems.length > 0 && (
            <div className="pt-3 border-t border-warm-100">
              <p className="text-xs text-warm-500 font-semibold uppercase tracking-wider mb-2">
                Extracted items ({currentAnalysis.analysis.extractedItems.length}):
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {currentAnalysis.analysis.extractedItems.map((item, idx) => (
                  <div key={idx} className="text-sm flex items-center gap-2 text-warm-700">
                    <span>{CATEGORY_CONFIG[item.type]?.icon || '•'}</span>
                    <span className="truncate">
                      {item.quantity && `${item.quantity} `}
                      {item.unit && `${item.unit} `}
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skip button */}
          <button
            onClick={() => setCurrentAnalysis(null)}
            className="w-full p-2.5 text-sm text-warm-400 hover:text-warm-700 transition-colors rounded-xl hover:bg-warm-50"
          >
            Skip (keep in saved items)
          </button>
        </div>
      )}

      {/* Google Maps Entries Section */}
      {!currentAnalysis && googleMapsEntries.length > 0 && (
        <div className="bg-white rounded-2xl border border-warm-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowFoodSuggestions(!showFoodSuggestions)}
            className="w-full p-4 flex items-center justify-between hover:bg-warm-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <div className="text-left">
                <h3 className="font-bold text-warm-800 text-sm">Google Maps Places</h3>
                <p className="text-xs text-warm-500">
                  {googleMapsEntries.length} place{googleMapsEntries.length !== 1 ? 's' : ''} saved
                  {googleMapsEntries.filter((e) => e.isNew).length > 0 && (
                    <span className="ml-1 text-brand-coral font-semibold">
                      • {googleMapsEntries.filter((e) => e.isNew).length} new
                    </span>
                  )}
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-warm-400 transition-transform ${showFoodSuggestions ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showFoodSuggestions && (
            <div className="border-t border-warm-100">
              {/* Food Suggestions based on shared content */}
              {foodSuggestions.suggested.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-brand-sunset/5 to-brand-peach/10">
                  <h4 className="text-xs font-bold text-warm-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>✨</span> Suggested for you
                    {foodSuggestions.cuisines.length > 0 && (
                      <span className="normal-case font-normal text-warm-400">
                        (based on your {foodSuggestions.cuisines.join(', ')} shares)
                      </span>
                    )}
                  </h4>
                  <div className="space-y-2">
                    {foodSuggestions.suggested.slice(0, 3).map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-2.5 bg-white rounded-xl shadow-sm">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-warm-800 truncate">{r.name}</p>
                          <div className="flex gap-2 text-xs text-warm-500 mt-0.5">
                            {r.cuisine && <span>{r.cuisine}</span>}
                            {r.neighborhood && <span>• {r.neighborhood}</span>}
                          </div>
                        </div>
                        {(r.googleMapsUrl || r.googleMapsUri) && (
                          <a
                            href={r.googleMapsUrl || r.googleMapsUri || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 ml-2 px-3 py-1.5 bg-brand-ocean/10 text-brand-ocean text-xs font-semibold rounded-lg hover:bg-brand-ocean/20 transition-colors"
                          >
                            Maps
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Google Maps entries */}
              <div className="p-4">
                <h4 className="text-xs font-bold text-warm-600 uppercase tracking-wider mb-2">
                  All Places ({googleMapsEntries.length})
                </h4>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {googleMapsEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-2 hover:bg-warm-50 rounded-lg transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-warm-800 truncate">{entry.name}</p>
                          {entry.isNew && (
                            <span className="shrink-0 text-[10px] bg-brand-coral/10 text-brand-coral px-1.5 py-0.5 rounded-full font-bold">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 text-xs text-warm-400">
                          {entry.cuisine && <span>{entry.cuisine}</span>}
                          {entry.neighborhood && <span>• {entry.neighborhood}</span>}
                          {entry.city && <span>• {entry.city}</span>}
                        </div>
                      </div>
                      {entry.url && (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 ml-2 p-1.5 text-warm-400 hover:text-brand-ocean transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Items */}
      {recentItems.length > 0 && !currentAnalysis && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-warm-800">Recently Saved</h3>
            <a href="/saved" className="text-sm text-brand-ocean font-medium hover:underline">
              View all →
            </a>
          </div>
          <div className="space-y-2">
            {recentItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-white border border-warm-200 rounded-xl flex items-center gap-3 hover:shadow-sm transition-all"
              >
                <span className="text-xl">{CATEGORY_CONFIG[item.category]?.icon || '📦'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-warm-800 truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getSourceConfig(item.source).color}`}>
                      {getSourceConfig(item.source).icon}
                    </span>
                    <span className="text-xs text-warm-400">{formatDate(item.savedAt)}</span>
                  </div>
                </div>
                {item.addedToLists.length > 0 && (
                  <span className="text-xs text-brand-mint font-semibold bg-brand-mint/10 px-2 py-0.5 rounded-full">Added</span>
                )}
                {item.needsUserInput && (
                  <span className="text-xs text-brand-sunset font-semibold bg-brand-sunset/10 px-2 py-0.5 rounded-full">Review</span>
                )}
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1.5 text-warm-300 hover:text-brand-coral transition-colors rounded-lg hover:bg-brand-coral/5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {recentItems.length === 0 && !currentAnalysis && !loading && (
        <div className="text-center py-10">
          <div className="w-20 h-20 mx-auto mb-4 gradient-coral rounded-3xl flex items-center justify-center shadow-glow-coral">
            <span className="text-4xl">📥</span>
          </div>
          <h3 className="font-bold text-warm-800 mb-2">Share Content Here</h3>
          <p className="text-warm-500 text-sm max-w-xs mx-auto">
            Paste a link from Instagram, YouTube, or any website. AI will analyze it and add items to your lists.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuickShare;
