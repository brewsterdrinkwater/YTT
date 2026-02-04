import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GroceryList from './GroceryList';
import WatchlistList from './WatchlistList';
import ReadingList from './ReadingList';
import MusicList from './MusicList';
import PlacesList from './PlacesList';
import RestaurantList from './RestaurantList';

// List type definitions
export type ListType = 'grocery' | 'watchlist' | 'reading' | 'music' | 'places' | 'restaurants';

interface ListOption {
  value: ListType;
  label: string;
  icon: string;
}

export const LIST_OPTIONS: ListOption[] = [
  { value: 'grocery', label: 'Grocery List', icon: '🛒' },
  { value: 'restaurants', label: 'Restaurants', icon: '🍽️' },
  { value: 'watchlist', label: 'Watchlist', icon: '🎬' },
  { value: 'reading', label: 'Reading List', icon: '📚' },
  { value: 'music', label: 'Listen List', icon: '🎵' },
  { value: 'places', label: 'Places to Visit', icon: '📍' },
];

interface ListPageProps {
  defaultList?: ListType;
}

/**
 * Mobile-optimized list page with dropdown navigation
 * Each list is a full page on mobile
 */
const ListPage: React.FC<ListPageProps> = ({ defaultList = 'grocery' }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showDropdown, setShowDropdown] = useState(false);

  // Get list from URL params or default
  const listParam = searchParams.get('list') as ListType | null;
  const [activeList, setActiveList] = useState<ListType>(listParam || defaultList);

  // Update URL when list changes
  useEffect(() => {
    if (listParam !== activeList) {
      setSearchParams({ list: activeList });
    }
  }, [activeList, listParam, setSearchParams]);

  // Update active list when URL changes
  useEffect(() => {
    if (listParam && listParam !== activeList && LIST_OPTIONS.some(o => o.value === listParam)) {
      setActiveList(listParam);
    }
  }, [listParam, activeList]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleListChange = (list: ListType) => {
    setActiveList(list);
    setShowDropdown(false);
  };

  const currentList = LIST_OPTIONS.find(o => o.value === activeList);

  return (
    <div className="min-h-screen bg-white">
      {/* Header with dropdown selector */}
      <div className="sticky top-0 bg-white border-b-2 border-black z-20">
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="p-2 -ml-2 hover:bg-concrete rounded-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Dropdown selector */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-concrete rounded-sm hover:bg-steel transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">{currentList?.icon}</span>
                <span className="font-bold text-black">{currentList?.label}</span>
              </span>
              <svg
                className={`w-5 h-5 text-charcoal transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                {/* Menu */}
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-black rounded-sm shadow-lg z-20 overflow-hidden">
                  {LIST_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleListChange(option.value)}
                      className={`w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-concrete transition-colors ${
                        activeList === option.value ? 'bg-concrete font-semibold' : ''
                      }`}
                    >
                      <span className="text-xl">{option.icon}</span>
                      <span className="text-black">{option.label}</span>
                      {activeList === option.value && (
                        <svg className="w-5 h-5 ml-auto text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* List content */}
      <div className="px-4 py-4 pb-24">
        {activeList === 'grocery' && <GroceryList />}
        {activeList === 'watchlist' && <WatchlistList />}
        {activeList === 'reading' && <ReadingList />}
        {activeList === 'music' && <MusicList />}
        {activeList === 'places' && <PlacesList />}
        {activeList === 'restaurants' && <RestaurantList />}
      </div>
    </div>
  );
};

export default ListPage;
