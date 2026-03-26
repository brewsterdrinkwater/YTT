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
  color: string;
  isCustom?: boolean;
}

export const BUILT_IN_LIST_OPTIONS: ListOption[] = [
  { value: 'grocery', label: 'Grocery List', shortLabel: 'Grocery', icon: '🛒', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'restaurants', label: 'Restaurants', shortLabel: 'Food', icon: '🍽️', color: 'bg-red-50 text-red-600 border-red-200' },
  { value: 'watchlist', label: 'Watchlist', shortLabel: 'Watch', icon: '🎬', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'reading', label: 'Reading List', shortLabel: 'Read', icon: '📚', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'music', label: 'Listen List', shortLabel: 'Music', icon: '🎵', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { value: 'places', label: 'Places to Visit', shortLabel: 'Places', icon: '📍', color: 'bg-blue-50 text-blue-700 border-blue-200' },
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

  const allListOptions: ListOption[] = [
    ...BUILT_IN_LIST_OPTIONS,
    ...customLists.map((cl) => ({
      value: `custom-${cl.id}`,
      label: cl.name,
      shortLabel: cl.name.length > 8 ? cl.name.slice(0, 8) + '...' : cl.name,
      icon: cl.icon,
      color: 'bg-warm-100 text-warm-700 border-warm-200',
      isCustom: true,
    })),
  ];

  const listParam = searchParams.get('list') as ListType | null;
  const [activeList, setActiveList] = useState<ListType>(listParam || defaultList);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (listParam !== activeList) {
      setSearchParams({ list: activeList });
    }
  }, [activeList, listParam, setSearchParams]);

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
    if (activeList.startsWith('custom-')) {
      const customListId = activeList.replace('custom-', '');
      const customList = customLists.find((cl) => cl.id === customListId);
      if (!customList) {
        return (
          <div className="text-center py-8">
            <p className="text-warm-500">List not found.</p>
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
    <div className="min-h-screen bg-warm-50">
      {/* Header with scrollable tab bar */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-lg border-b border-warm-200 z-20">
        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="p-2 -ml-1 hover:bg-warm-100 rounded-xl flex-shrink-0 transition-colors"
          >
            <svg className="w-5 h-5 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Scrollable tab bar */}
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1.5 min-w-max">
              {allListOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleListChange(option.value)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
                    activeList === option.value
                      ? `${option.color} shadow-sm font-semibold`
                      : 'text-warm-500 border-transparent hover:bg-warm-100 hover:text-warm-700'
                  }`}
                >
                  <span className="text-base">{option.icon}</span>
                  <span className="hidden sm:inline">{option.shortLabel}</span>
                </button>
              ))}

              {/* + New List button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-warm-400 hover:bg-warm-100 hover:text-warm-700 transition-all whitespace-nowrap border border-dashed border-warm-300"
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
          className="px-4 py-4 pb-28 max-w-3xl mx-auto"
        >
          {/* List title */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{currentList?.icon}</span>
              <h1 className="text-xl font-bold text-warm-800">{currentList?.label}</h1>
            </div>
            {currentList?.isCustom && (
              <button
                onClick={() => setShowDeleteConfirm(activeList.replace('custom-', ''))}
                className="p-2 text-warm-400 hover:text-brand-coral transition-colors rounded-xl"
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
      <div className="fixed bottom-24 left-0 right-0 flex justify-center md:hidden pointer-events-none">
        <div className="flex items-center gap-4 text-warm-400 text-xs bg-white/80 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-sm">
          {currentIndex > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {allListOptions[currentIndex - 1]?.shortLabel}
            </span>
          )}
          <span className="w-1 h-1 bg-warm-300 rounded-full" />
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
          <div className="fixed inset-0 bg-warm-900/50 backdrop-blur-sm z-50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-warm-200 rounded-2xl p-6 z-50 w-80 shadow-lg">
            <h3 className="font-bold text-warm-800 mb-2">Delete this list?</h3>
            <p className="text-sm text-warm-500 mb-5">This will permanently delete the list and all its items.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-warm-200 rounded-xl font-semibold text-sm text-warm-600 hover:bg-warm-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteList(showDeleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-brand-coral text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all"
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
