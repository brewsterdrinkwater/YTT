import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GroceryList from './GroceryList';
import WatchlistList from './WatchlistList';
import ReadingList from './ReadingList';
import MusicList from './MusicList';
import PlacesList from './PlacesList';
import RestaurantList from './RestaurantList';
import CustomListView from './CustomListView';
import CreateListModal from './CreateListModal';
import { useLists } from '../../contexts/ListsContext';

// List type definitions
export type ListType = 'grocery' | 'watchlist' | 'reading' | 'music' | 'places' | 'restaurants' | string;

interface ListOption {
  value: ListType;
  label: string;
  shortLabel: string;
  icon: string;
  isCustom?: boolean;
}

export const BUILT_IN_LIST_OPTIONS: ListOption[] = [
  { value: 'grocery', label: 'Grocery List', shortLabel: 'Grocery', icon: '🛒' },
  { value: 'restaurants', label: 'Restaurants', shortLabel: 'Food', icon: '🍽️' },
  { value: 'watchlist', label: 'Watchlist', shortLabel: 'Watch', icon: '🎬' },
  { value: 'reading', label: 'Reading List', shortLabel: 'Read', icon: '📚' },
  { value: 'music', label: 'Listen List', shortLabel: 'Music', icon: '🎵' },
  { value: 'places', label: 'Places to Visit', shortLabel: 'Places', icon: '📍' },
];

// Keep backward compat export
export const LIST_OPTIONS = BUILT_IN_LIST_OPTIONS;

interface ListPageProps {
  defaultList?: ListType;
}

const ListPage: React.FC<ListPageProps> = ({ defaultList = 'grocery' }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { customLists, deleteCustomList } = useLists();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Build combined list options (built-in + custom)
  const allListOptions: ListOption[] = [
    ...BUILT_IN_LIST_OPTIONS,
    ...customLists.map((cl) => ({
      value: `custom-${cl.id}`,
      label: cl.name,
      shortLabel: cl.name.length > 8 ? cl.name.slice(0, 8) + '...' : cl.name,
      icon: cl.icon,
      isCustom: true,
    })),
  ];

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
    if (listParam && listParam !== activeList && allListOptions.some(o => o.value === listParam)) {
      setActiveList(listParam);
    }
  }, [listParam, activeList, allListOptions]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleListChange = (list: ListType) => {
    const oldIndex = allListOptions.findIndex(o => o.value === activeList);
    const newIndex = allListOptions.findIndex(o => o.value === list);
    setDirection(newIndex > oldIndex ? 1 : -1);
    setActiveList(list);
  };

  const handleListCreated = (listId: string) => {
    setActiveList(`custom-${listId}`);
  };

  const handleDeleteList = (listId: string) => {
    deleteCustomList(listId);
    setShowDeleteConfirm(null);
    setActiveList('grocery');
  };

  const currentList = allListOptions.find(o => o.value === activeList);
  const currentIndex = allListOptions.findIndex(o => o.value === activeList);

  const renderListContent = () => {
    // Check if it's a custom list
    if (activeList.startsWith('custom-')) {
      const customListId = activeList.replace('custom-', '');
      const customList = customLists.find((cl) => cl.id === customListId);
      if (!customList) {
        return (
          <div className="text-center py-8">
            <p className="text-slate">List not found.</p>
          </div>
        );
      }
      return <CustomListView list={customList} />;
    }

    switch (activeList) {
      case 'grocery': return <GroceryList />;
      case 'watchlist': return <WatchlistList />;
      case 'reading': return <ReadingList />;
      case 'music': return <MusicList />;
      case 'places': return <PlacesList />;
      case 'restaurants': return <RestaurantList />;
      default: return null;
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
              {allListOptions.map((option) => (
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

              {/* + New List button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-slate hover:bg-concrete hover:text-black transition-all whitespace-nowrap border-2 border-dashed border-steel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">New List</span>
              </button>
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentList?.icon}</span>
              <h1 className="text-xl font-bold text-black">{currentList?.label}</h1>
            </div>
            {/* Delete button for custom lists */}
            {currentList?.isCustom && (
              <button
                onClick={() => setShowDeleteConfirm(activeList.replace('custom-', ''))}
                className="p-2 text-slate hover:text-red-500 transition-colors"
                title="Delete list"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
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
              {allListOptions[currentIndex - 1]?.shortLabel}
            </span>
          )}
          <span className="w-1 h-1 bg-steel rounded-full" />
          {currentIndex < allListOptions.length - 1 && (
            <span className="flex items-center gap-1">
              {allListOptions[currentIndex + 1]?.shortLabel}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* Create List Modal */}
      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleListCreated}
      />

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-black rounded-sm p-6 z-50 w-80">
            <h3 className="font-bold text-black mb-2">Delete this list?</h3>
            <p className="text-sm text-slate mb-4">This will permanently delete the list and all its items.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border-2 border-steel rounded-sm font-semibold text-sm hover:border-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteList(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-sm font-semibold text-sm hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ListPage;
