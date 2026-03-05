import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  shortLabel: string;
  icon: string;
}

export const LIST_OPTIONS: ListOption[] = [
  { value: 'grocery', label: 'Grocery List', shortLabel: 'Grocery', icon: '🛒' },
  { value: 'restaurants', label: 'Restaurants', shortLabel: 'Food', icon: '🍽️' },
  { value: 'watchlist', label: 'Watchlist', shortLabel: 'Watch', icon: '🎬' },
  { value: 'reading', label: 'Reading List', shortLabel: 'Read', icon: '📚' },
  { value: 'music', label: 'Listen List', shortLabel: 'Music', icon: '🎵' },
  { value: 'places', label: 'Places to Visit', shortLabel: 'Places', icon: '📍' },
];

interface ListPageProps {
  defaultList?: ListType;
}

const ListPage: React.FC<ListPageProps> = ({ defaultList = 'grocery' }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get list from URL params or default
  const listParam = searchParams.get('list') as ListType | null;
  const [activeList, setActiveList] = useState<ListType>(listParam || defaultList);
  const [direction, setDirection] = useState(0);

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
    const oldIndex = LIST_OPTIONS.findIndex(o => o.value === activeList);
    const newIndex = LIST_OPTIONS.findIndex(o => o.value === list);
    setDirection(newIndex > oldIndex ? 1 : -1);
    setActiveList(list);
  };

  const currentList = LIST_OPTIONS.find(o => o.value === activeList);
  const currentIndex = LIST_OPTIONS.findIndex(o => o.value === activeList);

  const renderListContent = () => {
    switch (activeList) {
      case 'grocery': return <GroceryList />;
      case 'watchlist': return <WatchlistList />;
      case 'reading': return <ReadingList />;
      case 'music': return <MusicList />;
      case 'places': return <PlacesList />;
      case 'restaurants': return <RestaurantList />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with scrollable tab bar */}
      <div className="sticky top-0 bg-white border-b-2 border-black z-20">
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="p-2 -ml-1 hover:bg-concrete rounded-lg flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Scrollable tab bar */}
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 min-w-max">
              {LIST_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleListChange(option.value)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    activeList === option.value
                      ? 'bg-black text-white shadow-md'
                      : 'text-charcoal hover:bg-concrete'
                  }`}
                >
                  <span className="text-base">{option.icon}</span>
                  <span className="hidden sm:inline">{option.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* List content with animation */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={activeList}
          custom={direction}
          initial={{ opacity: 0, x: direction * 200 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -200 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="px-4 py-4 pb-24 max-w-3xl mx-auto"
        >
          {/* List title */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{currentList?.icon}</span>
            <h1 className="text-xl font-bold text-black">{currentList?.label}</h1>
          </div>

          {renderListContent()}
        </motion.div>
      </AnimatePresence>

      {/* Swipe hint on mobile */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center md:hidden pointer-events-none">
        <div className="flex items-center gap-4 text-slate text-xs">
          {currentIndex > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {LIST_OPTIONS[currentIndex - 1].shortLabel}
            </span>
          )}
          <span className="w-1 h-1 bg-steel rounded-full" />
          {currentIndex < LIST_OPTIONS.length - 1 && (
            <span className="flex items-center gap-1">
              {LIST_OPTIONS[currentIndex + 1].shortLabel}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListPage;
