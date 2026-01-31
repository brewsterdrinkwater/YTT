import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntries } from '../../contexts/EntriesContext';
import { useApp } from '../../contexts/AppContext';
import { Entry } from '../../types';
import { parseISO } from '../../utils/dateUtils';
import SearchResults from './SearchResults';
import Card from '../common/Card';
import DeepResearchAgent from '../research/DeepResearchAgent';

const SearchBar: React.FC = () => {
  const { searchEntries } = useEntries();
  const { setCurrentDate } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Entry[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      // Small delay to simulate search and show loading state
      setTimeout(() => {
        const searchResults = searchEntries(searchQuery);
        setResults(searchResults);
        setIsSearching(false);
      }, 100);
    },
    [searchEntries]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const handleEntryClick = (entry: Entry) => {
    setCurrentDate(parseISO(entry.date));
    navigate('/');
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold mb-6">Search</h1>

      {/* Search Input */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
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
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search entries, locations, activities..."
          className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors text-lg"
          autoFocus
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Loading State */}
      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Results */}
      {!isSearching && query && (
        <SearchResults
          results={results}
          query={query}
          onEntryClick={handleEntryClick}
        />
      )}

      {/* Empty State - Show Research History */}
      {!query && (
        <>
          {/* Research History */}
          <DeepResearchAgent showHistoryOnly />

          {/* Entry Search Help */}
          <Card className="text-center py-12">
            <span className="text-4xl mb-4 block">📝</span>
            <h2 className="text-xl font-semibold mb-2">Search Your Entries</h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              Search across locations, highlights, activities, and notes to find any entry.
            </p>
            <div className="mt-6 text-left max-w-xs mx-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">Try searching for:</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li
                  onClick={() => setQuery('Nashville')}
                  className="cursor-pointer hover:text-primary"
                >
                  • Nashville
                </li>
                <li onClick={() => setQuery('workout')} className="cursor-pointer hover:text-primary">
                  • workout
                </li>
                <li
                  onClick={() => setQuery('restaurant')}
                  className="cursor-pointer hover:text-primary"
                >
                  • restaurant
                </li>
              </ul>
            </div>
          </Card>
        </>
      )}

      {/* Deep Research Agent - Full (when searching) */}
      {query && (
        <div className="mt-6">
          <DeepResearchAgent />
        </div>
      )}
    </div>
  );
};

export default SearchBar;
