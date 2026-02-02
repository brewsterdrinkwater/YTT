import React, { useState, useCallback } from 'react';
import { useEntries } from '../../contexts/EntriesContext';

const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const { searchEntries } = useEntries();

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      const results = searchEntries(query);
      console.log('Search results:', results);
      // For now, just log results - can be expanded to show in a dropdown
    }
  }, [query, searchEntries]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white border-b border-gray-100 sticky top-[73px] z-30">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Search Bar - Prominent */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search your entries, activities, notes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsExpanded(true)}
                className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
            >
              Search
            </button>
          </div>

          {/* Quick filters */}
          {isExpanded && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setQuery('workout')}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
              >
                Workouts
              </button>
              <button
                onClick={() => setQuery('travel')}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
              >
                Travel
              </button>
              <button
                onClick={() => setQuery('food')}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
              >
                Food
              </button>
              <button
                onClick={() => setQuery('work')}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
              >
                Work
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="ml-auto text-sm text-gray-400 hover:text-gray-600"
              >
                Collapse
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
