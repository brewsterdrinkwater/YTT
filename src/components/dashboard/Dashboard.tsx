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

// Import list components
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
    <div className="border-2 border-steel rounded-lg overflow-hidden">
      <div className="p-3 bg-white border-b border-steel">
        <span className="flex items-center gap-2 font-bold text-black text-sm">
          <span>🍳</span> Recipes
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
            {recipes.length}
          </span>
        </span>
      </div>
      <ul className="divide-y divide-steel">
        {recipes.slice(0, 3).map((recipe) => (
          <li key={recipe.id} className="bg-white">
            <button
              onClick={() => setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-concrete transition-colors"
            >
              <span className="font-medium text-sm">{recipe.name}</span>
              <span className="text-xs text-slate">{recipe.ingredients.length} items</span>
            </button>
            {expandedRecipe === recipe.id && (
              <div className="px-3 pb-3 border-t border-concrete">
                <ul className="text-sm text-charcoal mt-2 space-y-1">
                  {recipe.ingredients.slice(0, 5).map((ing, i) => (
                    <li key={i} className="text-xs">
                      • {ing.name} {ing.quantity > 0 && `(${ing.quantity} ${ing.unit})`}
                    </li>
                  ))}
                  {recipe.ingredients.length > 5 && (
                    <li className="text-xs text-slate">+{recipe.ingredients.length - 5} more</li>
                  )}
                </ul>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleAddToGrocery(recipe.id)}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                  >
                    + Grocery
                  </button>
                  <button
                    onClick={() => removeRecipe(recipe.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1 ml-auto"
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
      className="bg-white rounded-lg border-2 border-black p-4"
    >
      <h3 className="font-bold text-black mb-3 flex items-center gap-2">
        <span>🔍</span> Search Diary
      </h3>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search entries..."
        className="mb-2 text-sm"
      />
      {results.length > 0 && (
        <ul className="space-y-1">
          {results.map((entry) => (
            <li
              key={entry.id}
              onClick={() => handleEntryClick(entry)}
              className="p-2 bg-concrete rounded-md cursor-pointer hover:bg-steel transition-colors text-xs"
            >
              <p className="font-medium">{formatDisplayDate(entry.date)}</p>
              <p className="text-slate truncate">{entry.highlights || entry.location}</p>
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
}

const InsightCard: React.FC<InsightCardProps> = ({ title, icon, items }) => {
  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border-2 border-black p-4"
    >
      <h3 className="font-bold text-black mb-3 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      <ul className="space-y-2">
        {items.slice(0, 3).map((item, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-2 bg-concrete rounded-md"
          >
            <p className="text-sm text-black">{item.text}</p>
            <p className="text-xs text-slate mt-1">{formatDisplayDate(item.date)}</p>
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
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  children: React.ReactNode;
}

const ListCard: React.FC<ListCardProps> = ({
  title,
  icon,
  count,
  isExpanded,
  onToggle,
  onNavigate,
  children,
}) => {
  return (
    <motion.div
      layout
      className="bg-white rounded-lg border-2 border-steel overflow-hidden hover:border-charcoal transition-colors"
    >
      <div className="flex items-center">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-2 p-3 hover:bg-concrete transition-colors"
        >
          <span className="text-lg">{icon}</span>
          <span className="font-bold text-sm text-black">{title}</span>
          {count > 0 && (
            <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </button>
        <button
          onClick={onNavigate}
          className="px-3 py-2 text-xs text-slate hover:text-black transition-colors"
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
            className="border-t border-steel overflow-hidden"
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

// Mobile list card
interface MobileListCardProps {
  icon: string;
  label: string;
  count: number;
  color: string;
  onClick: () => void;
}

const MobileListCard: React.FC<MobileListCardProps> = ({ icon, label, count, color, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="p-4 rounded-xl border-2 border-steel hover:border-black transition-all text-left bg-white shadow-sm hover:shadow-md"
  >
    <span className="text-3xl block mb-2">{icon}</span>
    <span className="font-bold text-black text-sm block">{label}</span>
    {count > 0 && (
      <span className={`text-xs font-medium ${color} mt-1 inline-block`}>
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

  // Track which lists are expanded
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

  const listColors = {
    grocery: 'text-green-600',
    restaurants: 'text-orange-600',
    watchlist: 'text-purple-600',
    reading: 'text-blue-600',
    music: 'text-pink-600',
    places: 'text-teal-600',
  };

  return (
    <div className="w-full px-4 py-6 pb-24 md:pb-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 max-w-7xl mx-auto"
      >
        <h1 className="text-h2 font-bold text-black">Dashboard</h1>
        <p className="text-small text-slate mt-1">Your insights and lists at a glance</p>
      </motion.div>

      {/* ═══════════ MOBILE LAYOUT ═══════════ */}
      <div className="md:hidden space-y-6">
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
              <InsightCard title="Recent Workouts" icon="🏋️" items={workouts} />
            </div>
          )}
          {ideas.length > 0 && (
            <div className="px-1">
              <InsightCard title="Ideas" icon="💡" items={ideas} />
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

        {/* Lists grid */}
        <div>
          <h2 className="font-bold text-black text-lg mb-3">Your Lists</h2>
          <div className="grid grid-cols-3 gap-2">
            <MobileListCard icon="🛒" label="Grocery" count={listCounts.grocery} color={listColors.grocery} onClick={() => navigateToList('grocery')} />
            <MobileListCard icon="🍽️" label="Food" count={listCounts.restaurants} color={listColors.restaurants} onClick={() => navigateToList('restaurants')} />
            <MobileListCard icon="🎬" label="Watch" count={listCounts.watchlist} color={listColors.watchlist} onClick={() => navigateToList('watchlist')} />
            <MobileListCard icon="📚" label="Read" count={listCounts.reading} color={listColors.reading} onClick={() => navigateToList('reading')} />
            <MobileListCard icon="🎵" label="Music" count={listCounts.music} color={listColors.music} onClick={() => navigateToList('music')} />
            <MobileListCard icon="📍" label="Places" count={listCounts.places} color={listColors.places} onClick={() => navigateToList('places')} />
          </div>
        </div>
      </div>

      {/* ═══════════ DESKTOP LAYOUT: 3-column ═══════════ */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* LEFT COLUMN: Weather + Calendar + Maps + Insights */}
        <div className="space-y-4">
          <h2 className="font-bold text-black text-lg border-b-2 border-black pb-2">
            Today
          </h2>
          <WeatherWidget />
          <CalendarWidget />
          <MapsWidget />
          <LocationDaysCounter />
          <RecentlySavedWidget />
        </div>

        {/* CENTER COLUMN: Insights + Search */}
        <div className="space-y-4">
          <h2 className="font-bold text-black text-lg border-b-2 border-black pb-2">
            Insights
          </h2>
          <RestaurantDecideCard />
          <DiarySearchSection />
          <InsightCard title="Recent Workouts" icon="🏋️" items={workouts} />
          <InsightCard title="Ideas" icon="💡" items={ideas} />
        </div>

        {/* RIGHT COLUMN: All Lists */}
        <div className="space-y-3">
          <h2 className="font-bold text-black text-lg border-b-2 border-black pb-2">
            Lists
          </h2>

          <ListCard title="Grocery" icon="🛒" count={listCounts.grocery} isExpanded={expandedLists.has('grocery')} onToggle={() => toggleList('grocery')} onNavigate={() => navigateToList('grocery')}>
            <GroceryList />
          </ListCard>

          <ListCard title="Restaurants" icon="🍽️" count={listCounts.restaurants} isExpanded={expandedLists.has('restaurants')} onToggle={() => toggleList('restaurants')} onNavigate={() => navigateToList('restaurants')}>
            <RestaurantList />
          </ListCard>

          <ListCard title="Watchlist" icon="🎬" count={listCounts.watchlist} isExpanded={expandedLists.has('watchlist')} onToggle={() => toggleList('watchlist')} onNavigate={() => navigateToList('watchlist')}>
            <WatchlistList />
          </ListCard>

          <ListCard title="Reading" icon="📚" count={listCounts.reading} isExpanded={expandedLists.has('reading')} onToggle={() => toggleList('reading')} onNavigate={() => navigateToList('reading')}>
            <ReadingList />
          </ListCard>

          <ListCard title="Music" icon="🎵" count={listCounts.music} isExpanded={expandedLists.has('music')} onToggle={() => toggleList('music')} onNavigate={() => navigateToList('music')}>
            <MusicList />
          </ListCard>

          <ListCard title="Places" icon="📍" count={listCounts.places} isExpanded={expandedLists.has('places')} onToggle={() => toggleList('places')} onNavigate={() => navigateToList('places')}>
            <PlacesList />
          </ListCard>

          <RecipeListSection />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
