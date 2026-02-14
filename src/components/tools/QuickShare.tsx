import React, { useState, useEffect } from 'react';
import { researchService } from '../../services/researchService';
import {
  quickShareService,
  SavedItem,
  ListCategory,
  AnalysisResult,
} from '../../services/quickShareService';

const CATEGORY_CONFIG: Record<ListCategory, { label: string; icon: string; color: string }> = {
  grocery: { label: 'Grocery', icon: '🛒', color: 'bg-green-100 border-green-500' },
  recipes: { label: 'Recipes', icon: '🍳', color: 'bg-orange-100 border-orange-500' },
  restaurants: { label: 'Restaurants', icon: '🍽️', color: 'bg-red-100 border-red-500' },
  places: { label: 'Places', icon: '📍', color: 'bg-blue-100 border-blue-500' },
  watchlist: { label: 'Watchlist', icon: '🎬', color: 'bg-purple-100 border-purple-500' },
  reading: { label: 'Reading', icon: '📚', color: 'bg-yellow-100 border-yellow-500' },
  music: { label: 'Music', icon: '🎵', color: 'bg-pink-100 border-pink-500' },
  uncategorized: { label: 'Uncategorized', icon: '📦', color: 'bg-gray-100 border-gray-500' },
};

interface QuickShareProps {
  initialUrl?: string;
  onComplete?: () => void;
}

const QuickShare: React.FC<QuickShareProps> = ({ initialUrl, onComplete }) => {
  const [url, setUrl] = useState(initialUrl || '');
  const [batchMode, setBatchMode] = useState(false);
  const [batchUrls, setBatchUrls] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<{
    item: SavedItem;
    analysis: AnalysisResult;
  } | null>(null);
  const [recentItems, setRecentItems] = useState<SavedItem[]>([]);
  const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number } | null>(
    null
  );

  useEffect(() => {
    const storedKey = researchService.getApiKey();
    if (storedKey) setApiKey(storedKey);
    setRecentItems(quickShareService.getRecentItems(10));
  }, []);

  const handleSaveApiKey = () => {
    researchService.saveApiKey(apiKey);
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    if (!apiKey) {
      setError('Please enter your API key first');
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentAnalysis(null);

    try {
      const result = await quickShareService.quickSave(url.trim(), apiKey);
      setCurrentAnalysis(result);
      setRecentItems(quickShareService.getRecentItems(10));
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
    if (!apiKey) {
      setError('Please enter your API key first');
      return;
    }

    setLoading(true);
    setError(null);
    setBatchProgress({ completed: 0, total: urls.length });

    try {
      await quickShareService.batchSave(urls, apiKey, (completed, total) => {
        setBatchProgress({ completed, total });
      });
      setRecentItems(quickShareService.getRecentItems(10));
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
    quickShareService.addToList(currentAnalysis.item.id, category);

    // Also add extracted items if they match this category
    const matchingItems = currentAnalysis.analysis.extractedItems.filter(
      (item) => item.type === category
    );
    if (matchingItems.length > 0) {
      quickShareService.addExtractedItems(matchingItems);
    }

    setCurrentAnalysis(null);
    setRecentItems(quickShareService.getRecentItems(10));
    onComplete?.();
  };

  const handleConfirmSuggested = () => {
    if (!currentAnalysis) return;
    handleAddToList(currentAnalysis.item.category);
  };

  const handleRemoveItem = (itemId: string) => {
    quickShareService.removeSavedItem(itemId);
    setRecentItems(quickShareService.getRecentItems(10));
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

  return (
    <div className="space-y-6">
      {/* API Key Section */}
      {!apiKey && (
        <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-sm">
          <label className="block text-sm font-semibold text-black mb-2">API Key Required</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Claude API key"
              className="flex-1 px-3 py-2 border-2 border-black rounded-sm text-sm"
            />
            <button
              onClick={handleSaveApiKey}
              className="px-4 py-2 bg-black text-white font-semibold text-sm rounded-sm hover:bg-charcoal transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setBatchMode(false)}
          className={`flex-1 px-4 py-2 font-semibold text-sm rounded-sm border-2 transition-colors ${
            !batchMode
              ? 'bg-black text-white border-black'
              : 'bg-white text-black border-black hover:bg-concrete'
          }`}
        >
          Single URL
        </button>
        <button
          onClick={() => setBatchMode(true)}
          className={`flex-1 px-4 py-2 font-semibold text-sm rounded-sm border-2 transition-colors ${
            batchMode
              ? 'bg-black text-white border-black'
              : 'bg-white text-black border-black hover:bg-concrete'
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
              placeholder="Paste URL from Instagram, YouTube, etc."
              className="flex-1 px-4 py-3 border-2 border-black rounded-sm text-sm placeholder:text-slate"
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !url.trim()}
              className="px-6 py-3 bg-black text-white font-semibold text-sm rounded-sm hover:bg-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={batchUrls}
            onChange={(e) => setBatchUrls(e.target.value)}
            placeholder="Paste multiple URLs, one per line"
            rows={5}
            className="w-full px-4 py-3 border-2 border-black rounded-sm text-sm placeholder:text-slate resize-none"
          />
          <button
            onClick={handleBatchAnalyze}
            disabled={loading || !batchUrls.trim()}
            className="w-full px-6 py-3 bg-black text-white font-semibold text-sm rounded-sm hover:bg-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-sm">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Analysis Result */}
      {currentAnalysis && (
        <div className="p-4 border-2 border-black rounded-sm space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">
              {CATEGORY_CONFIG[currentAnalysis.item.category]?.icon || '📦'}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-black truncate">{currentAnalysis.item.title}</h3>
              <p className="text-sm text-slate mt-1">{currentAnalysis.item.description}</p>
              <p className="text-xs text-charcoal mt-2 italic">
                {currentAnalysis.item.sourceReason}
              </p>
            </div>
          </div>

          {/* Confidence indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate">Confidence:</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                currentAnalysis.analysis.confidence === 'high'
                  ? 'bg-green-100 text-green-700'
                  : currentAnalysis.analysis.confidence === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {currentAnalysis.analysis.confidence}
            </span>
          </div>

          {/* Suggested category with confirm */}
          {currentAnalysis.analysis.confidence !== 'low' && (
            <button
              onClick={handleConfirmSuggested}
              className={`w-full p-3 border-2 rounded-sm font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${CATEGORY_CONFIG[currentAnalysis.item.category]?.color || 'bg-gray-100 border-gray-500'} hover:opacity-80`}
            >
              <span>{CATEGORY_CONFIG[currentAnalysis.item.category]?.icon}</span>
              <span>Add to {CATEGORY_CONFIG[currentAnalysis.item.category]?.label}</span>
            </button>
          )}

          {/* Category options */}
          <div className="space-y-2">
            <p className="text-xs text-slate font-semibold uppercase">
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
                    className={`p-2 border-2 rounded-sm text-sm flex items-center gap-2 transition-colors ${CATEGORY_CONFIG[category].color} hover:opacity-80`}
                  >
                    <span>{CATEGORY_CONFIG[category].icon}</span>
                    <span>{CATEGORY_CONFIG[category].label}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Extracted items preview */}
          {currentAnalysis.analysis.extractedItems.length > 0 && (
            <div className="pt-3 border-t border-concrete">
              <p className="text-xs text-slate font-semibold uppercase mb-2">
                Extracted items ({currentAnalysis.analysis.extractedItems.length}):
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {currentAnalysis.analysis.extractedItems.map((item, idx) => (
                  <div key={idx} className="text-sm flex items-center gap-2">
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
            className="w-full p-2 text-sm text-slate hover:text-black transition-colors"
          >
            Skip (keep in saved items)
          </button>
        </div>
      )}

      {/* Recent Items */}
      {recentItems.length > 0 && !currentAnalysis && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-black">Recently Saved</h3>
            <a href="/saved" className="text-sm text-tab-blue hover:underline">
              View all →
            </a>
          </div>
          <div className="space-y-2">
            {recentItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="p-3 border-2 border-concrete rounded-sm flex items-center gap-3 hover:border-black transition-colors"
              >
                <span className="text-lg">{CATEGORY_CONFIG[item.category]?.icon || '📦'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  <p className="text-xs text-slate">
                    {item.source} • {formatDate(item.savedAt)}
                  </p>
                </div>
                {item.addedToLists.length > 0 && (
                  <span className="text-xs text-green-600 font-semibold">Added</span>
                )}
                {item.needsUserInput && (
                  <span className="text-xs text-amber-600 font-semibold">Needs review</span>
                )}
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1 text-slate hover:text-red-500 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {recentItems.length === 0 && !currentAnalysis && !loading && (
        <div className="text-center py-8">
          <span className="text-4xl">📥</span>
          <p className="mt-3 text-slate">
            Paste a URL above to save content from Instagram, YouTube, websites, and more.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuickShare;
