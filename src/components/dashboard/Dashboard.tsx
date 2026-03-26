import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEntries } from '../../contexts/EntriesContext';
import { useApp } from '../../contexts/AppContext';
import { Entry, DashboardItem } from '../../types';
import { DASHBOARD_KEYWORDS } from '../../constants/config';
import { formatDisplayDate, parseISO } from '../../utils/dateUtils';
import { useLists } from '../../contexts/ListsContext';
import { Input } from '../common/Input';
import LocationDaysCounter from './LocationDaysCounter';
import RecentlySavedWidget from '../saved/RecentlySavedWidget';
import WeatherWidget from '../weather/WeatherWidget';
import CalendarWidget from '../calendar/CalendarWidget';
import MapsWidget from '../maps/MapsWidget';
import SwipeableCards from '../common/SwipeableCards';
import RestaurantDecideCard from '../restaurant/RestaurantDecideCard';

import {
  GroceryList,
  WatchlistList,
  ReadingList,
  MusicList,
  PlacesList,
  RestaurantList,
} from '../lists';
import { ListType } from '../lists/ListPage';

// Recipe List Component (compact version)
const RecipeListSection: React.FC = () => {
  const { showToast } = useApp();
  const { recipesList: recipes, addRecipeIngredientsToGrocery, removeRecipe } = useLists();
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  const handleAddToGrocery = (recipeId: string) => {
    addRecipeIngredientsToGrocery(recipeId);
    showToast('Recipe ingredients added to grocery list!', 'success');
  };

  if (recipes.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-warm-200">
      <div className="p-3 border-b border-warm-100">
        <span className="flex items-center gap-2 font-bold text-warm-800 text-sm">
          <span className="text-lg">🍳</span> Recipes
          <span className="text-xs bg-brand-sunset/10 text-brand-sunset px-2 py-0.5 rounded-full font-semibold">
            {recipes.length}
          </span>
        </span>
      </div>
      <ul className="divide-y divide-warm-100">
        {recipes.slice(0, 3).map((recipe) => (
          <li key={recipe.id}>
            <button
              onClick={() => setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-warm-50 transition-colors"
            >
              <span className="font-medium text-sm text-warm-800">{recipe.name}</span>
              <span className="text-xs text-warm-500">{recipe.ingredients.length} items</span>
            </button>
            {expandedRecipe === recipe.id && (
              <div className="px-3 pb-3 border-t border-warm-100">
                <ul className="text-sm text-warm-600 mt-2 space-y-1">
                  {recipe.ingredients.slice(0, 5).map((ing, i) => (
                    <li key={i} className="text-xs">
                      • {ing.name} {ing.quantity > 0 && `(${ing.quantity} ${ing.unit})`}
                    </li>
                  ))}
                  {recipe.ingredients.length > 5 && (
                    <li className="text-xs text-warm-400">+{recipe.ingredients.length - 5} more</li>
                  )}
                </ul>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleAddToGrocery(recipe.id)}
                    className="text-xs bg-brand-mint/10 text-brand-mint px-3 py-1.5 rounded-lg font-semibold hover:bg-brand-mint/20 transition-colors"
                  >
                    + Add to Grocery
                  </button>
                  <button
                    onClick={() => removeRecipe(recipe.id)}
                    className="text-xs text-brand-coral hover:text-brand-coral/80 px-2 py-1 ml-auto"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Diary Search Component
const DiarySearchSection: React.FC = () => {
  const { searchEntries } = useEntries();
  const { setCurrentDate } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Entry[]>([]);

  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }
      const searchResults = searchEntries(searchQuery);
      setResults(searchResults.slice(0, 3));
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
    navigate('/entry');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-warm-200 p-4 shadow-sm"
    >
      <h3 className="font-bold text-warm-800 mb-3 flex items-center gap-2">
        <span className="text-lg">🔍</span> Search Diary
      </h3>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search entries..."
        className="mb-2 text-sm"
      />
      {results.length > 0 && (
        <ul className="space-y-1.5">
          {results.map((entry) => (
            <li
              key={entry.id}
              onClick={() => handleEntryClick(entry)}
              className="p-2.5 bg-warm-50 rounded-xl cursor-pointer hover:bg-warm-100 transition-colors text-xs"
            >
              <p className="font-medium text-warm-800">{formatDisplayDate(entry.date)}</p>
              <p className="text-warm-500 truncate mt-0.5">{entry.highlights || entry.location}</p>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
};

// Insight card with animation
interface InsightCardProps {
  title: string;
  icon: string;
  items: DashboardItem[];
  accentColor?: string;
}

const InsightCard: React.FC<InsightCardProps> = ({ title, icon, items, accentColor = 'bg-brand-sky/10' }) => {
  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-warm-200 p-4 shadow-sm"
    >
      <h3 className="font-bold text-warm-800 mb-3 flex items-center gap-2">
        <span className="text-lg">{icon}</span> {title}
      </h3>
      <ul className="space-y-2">
        {items.slice(0, 3).map((item, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-xl ${accentColor}`}
          >
            <p className="text-sm text-warm-800">{item.text}</p>
            <p className="text-xs text-warm-500 mt-1">{formatDisplayDate(item.date)}</p>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
};

// Expandable list card for desktop
interface ListCardProps {
  title: string;
  icon: string;
  count: number;
  accentColor: string;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  children: React.ReactNode;
}

const ListCard: React.FC<ListCardProps> = ({
  title,
  icon,
  count,
  accentColor,
  isExpanded,
  onToggle,
  onNavigate,
  children,
}) => {
  return (
    <motion.div
      layout
      className="bg-white rounded-2xl border border-warm-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-2.5 p-3.5 hover:bg-warm-50 transition-colors"
        >
          <span className="text-xl">{icon}</span>
          <span className="font-bold text-sm text-warm-800">{title}</span>
          {count > 0 && (
            <span className={`text-xs ${accentColor} px-2.5 py-0.5 rounded-full font-semibold`}>
              {count}
            </span>
          )}
        </button>
        <button
          onClick={onNavigate}
          className="px-3 py-2 text-warm-400 hover:text-warm-700 transition-colors"
          title="Open full list"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-warm-100 overflow-hidden"
          >
            <div className="max-h-72 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Mobile list card - colorful
interface MobileListCardProps {
  icon: string;
  label: string;
  count: number;
  gradient: string;
  onClick: () => void;
}

const MobileListCard: React.FC<MobileListCardProps> = ({ icon, label, count, gradient, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`p-4 rounded-2xl transition-all text-left shadow-sm hover:shadow-md ${gradient} relative overflow-hidden`}
  >
    <span className="text-3xl block mb-2">{icon}</span>
    <span className="font-bold text-warm-800 text-sm block">{label}</span>
    {count > 0 && (
      <span className="text-xs font-semibold text-warm-600 mt-1 inline-block">
        {count} item{count !== 1 ? 's' : ''}
      </span>
    )}
  </motion.button>
);

// Extract functions
const extractWorkouts = (entries: Entry[]): DashboardItem[] => {
  return entries
    .filter((e) => e.activities.workout)
    .map((e) => ({
      text: `${e.activities.workout!.type} - ${e.activities.workout!.duration}min`,
      date: e.date,
      location: e.location === 'other' ? e.otherLocationName || 'Other' : e.location,
      entryId: e.id,
    }))
    .slice(0, 5);
};

const extractIdeas = (entries: Entry[]): DashboardItem[] => {
  const keywords = DASHBOARD_KEYWORDS.ideas;
  return entries
    .filter((e) => e.highlights && keywords.some((kw) => e.highlights!.toLowerCase().includes(kw)))
    .map((e) => ({
      text: e.highlights!,
      date: e.date,
      location: e.location === 'other' ? e.otherLocationName || 'Other' : e.location,
      entryId: e.id,
    }))
    .slice(0, 5);
};

const Dashboard: React.FC = () => {
  const { entries } = useEntries();
  const navigate = useNavigate();
  const { groceryList, watchlist: watchlistItems, readingList, spotifyList, placesList, restaurantsList } = useLists();

  const [expandedLists, setExpandedLists] = useState<Set<ListType>>(new Set(['grocery']));

  const listCounts = {
    grocery: groceryList.length,
    watchlist: watchlistItems.length,
    reading: readingList.length,
    music: spotifyList.length,
    places: placesList.length,
    restaurants: restaurantsList.length,
  };

  const toggleList = (list: ListType) => {
    setExpandedLists((prev) => {
      const next = new Set(prev);
      if (next.has(list)) next.delete(list);
      else next.add(list);
      return next;
    });
  };

  const navigateToList = (list: ListType) => {
    navigate(`/lists?list=${list}`);
  };

  const workouts = extractWorkouts(entries);
  const ideas = extractIdeas(entries);

  const listAccents = {
    grocery: 'bg-brand-mint/10 text-brand-mint',
    restaurants: 'bg-brand-sunset/10 text-brand-sunset',
    watchlist: 'bg-brand-lavender/10 text-brand-lavender',
    reading: 'bg-brand-ocean/10 text-brand-ocean',
    music: 'bg-brand-rose/10 text-brand-rose',
    places: 'bg-brand-sky/10 text-brand-sky',
  };

  const mobileGradients = {
    grocery: 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100',
    restaurants: 'bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100',
    watchlist: 'bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100',
    reading: 'bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100',
    music: 'bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100',
    places: 'bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-100',
  };

  return (
    <div className="w-full px-4 py-6 pb-28 md:pb-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 max-w-7xl mx-auto"
      >
        <h1 className="text-h2 font-bold text-warm-800">Dashboard</h1>
        <p className="text-small text-warm-500 mt-1">Your insights and lists at a glance</p>
      </motion.div>

      {/* ═══════════ MOBILE LAYOUT ═══════════ */}
      <div className="md:hidden space-y-5">
        {/* Restaurant decision card */}
        <RestaurantDecideCard />

        {/* Swipeable insight cards */}
        <SwipeableCards>
          <div className="px-1">
            <WeatherWidget />
          </div>
          <div className="px-1">
            <LocationDaysCounter />
          </div>
          {workouts.length > 0 && (
            <div className="px-1">
              <InsightCard title="Recent Workouts" icon="🏋️" items={workouts} accentColor="bg-brand-mint/10" />
            </div>
          )}
          {ideas.length > 0 && (
            <div className="px-1">
              <InsightCard title="Ideas" icon="💡" items={ideas} accentColor="bg-brand-peach/30" />
            </div>
          )}
        </SwipeableCards>

        {/* Calendar & Maps */}
        <div className="space-y-3">
          <CalendarWidget />
          <MapsWidget />
        </div>

        {/* Recently saved */}
        <RecentlySavedWidget />

        {/* Search */}
        <DiarySearchSection />

        {/* Lists grid - colorful cards */}
        <div>
          <h2 className="font-bold text-warm-800 text-lg mb-3">Your Lists</h2>
          <div className="grid grid-cols-3 gap-3">
            <MobileListCard icon="🛒" label="Grocery" count={listCounts.grocery} gradient={mobileGradients.grocery} onClick={() => navigateToList('grocery')} />
            <MobileListCard icon="🍽️" label="Food" count={listCounts.restaurants} gradient={mobileGradients.restaurants} onClick={() => navigateToList('restaurants')} />
            <MobileListCard icon="🎬" label="Watch" count={listCounts.watchlist} gradient={mobileGradients.watchlist} onClick={() => navigateToList('watchlist')} />
            <MobileListCard icon="📚" label="Read" count={listCounts.reading} gradient={mobileGradients.reading} onClick={() => navigateToList('reading')} />
            <MobileListCard icon="🎵" label="Music" count={listCounts.music} gradient={mobileGradients.music} onClick={() => navigateToList('music')} />
            <MobileListCard icon="📍" label="Places" count={listCounts.places} gradient={mobileGradients.places} onClick={() => navigateToList('places')} />
          </div>
        </div>
      </div>

      {/* ═══════════ DESKTOP LAYOUT: 3-column ═══════════ */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          <h2 className="font-bold text-warm-800 text-lg border-b-2 border-brand-coral/20 pb-2">
            Today
          </h2>
          <WeatherWidget />
          <CalendarWidget />
          <MapsWidget />
          <LocationDaysCounter />
          <RecentlySavedWidget />
        </div>

        {/* CENTER COLUMN */}
        <div className="space-y-4">
          <h2 className="font-bold text-warm-800 text-lg border-b-2 border-brand-ocean/20 pb-2">
            Insights
          </h2>
          <RestaurantDecideCard />
          <DiarySearchSection />
          <InsightCard title="Recent Workouts" icon="🏋️" items={workouts} accentColor="bg-brand-mint/10" />
          <InsightCard title="Ideas" icon="💡" items={ideas} accentColor="bg-brand-peach/30" />
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-3">
          <h2 className="font-bold text-warm-800 text-lg border-b-2 border-brand-lavender/20 pb-2">
            Lists
          </h2>

          <ListCard title="Grocery" icon="🛒" count={listCounts.grocery} accentColor={listAccents.grocery} isExpanded={expandedLists.has('grocery')} onToggle={() => toggleList('grocery')} onNavigate={() => navigateToList('grocery')}>
            <GroceryList />
          </ListCard>

          <ListCard title="Restaurants" icon="🍽️" count={listCounts.restaurants} accentColor={listAccents.restaurants} isExpanded={expandedLists.has('restaurants')} onToggle={() => toggleList('restaurants')} onNavigate={() => navigateToList('restaurants')}>
            <RestaurantList />
          </ListCard>

          <ListCard title="Watchlist" icon="🎬" count={listCounts.watchlist} accentColor={listAccents.watchlist} isExpanded={expandedLists.has('watchlist')} onToggle={() => toggleList('watchlist')} onNavigate={() => navigateToList('watchlist')}>
            <WatchlistList />
          </ListCard>

          <ListCard title="Reading" icon="📚" count={listCounts.reading} accentColor={listAccents.reading} isExpanded={expandedLists.has('reading')} onToggle={() => toggleList('reading')} onNavigate={() => navigateToList('reading')}>
            <ReadingList />
          </ListCard>

          <ListCard title="Music" icon="🎵" count={listCounts.music} accentColor={listAccents.music} isExpanded={expandedLists.has('music')} onToggle={() => toggleList('music')} onNavigate={() => navigateToList('music')}>
            <MusicList />
          </ListCard>

          <ListCard title="Places" icon="📍" count={listCounts.places} accentColor={listAccents.places} isExpanded={expandedLists.has('places')} onToggle={() => toggleList('places')} onNavigate={() => navigateToList('places')}>
            <PlacesList />
          </ListCard>

          <RecipeListSection />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
