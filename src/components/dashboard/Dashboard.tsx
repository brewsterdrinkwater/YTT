import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntries } from '../../contexts/EntriesContext';
import { useApp } from '../../contexts/AppContext';
import { Entry, DashboardItem } from '../../types';
import { Recipe } from '../../types/research';
import { DASHBOARD_KEYWORDS } from '../../constants/config';
import { formatDisplayDate, parseISO } from '../../utils/dateUtils';
import { researchService } from '../../services/researchService';
import Card from '../common/Card';
import { Input } from '../common/Input';
import LocationDaysCounter from './LocationDaysCounter';
import RecentlySavedWidget from '../saved/RecentlySavedWidget';

// Import new list components
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
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  useEffect(() => {
    setRecipes(researchService.getRecipes());
  }, []);

  const handleAddToGrocery = (recipeId: string) => {
    researchService.addRecipeIngredientsToGrocery(recipeId);
    showToast('Recipe ingredients added to grocery list!', 'success');
  };

  const handleRemove = (id: string) => {
    const updated = researchService.removeRecipe(id);
    setRecipes(updated);
  };

  if (recipes.length === 0) return null;

  return (
    <div className="border-2 border-steel rounded-sm overflow-hidden">
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
              <span className="text-xs text-slate">
                {recipe.ingredients.length} items
              </span>
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
                    onClick={() => handleRemove(recipe.id)}
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

// Diary Search Component (compact)
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
    <div className="border-2 border-black rounded-sm p-4 bg-white">
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
              className="p-2 bg-concrete rounded-sm cursor-pointer hover:bg-steel transition-colors text-xs"
            >
              <p className="font-medium">{formatDisplayDate(entry.date)}</p>
              <p className="text-slate truncate">{entry.highlights || entry.location}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Insight card for workouts/ideas
interface InsightCardProps {
  title: string;
  icon: string;
  items: DashboardItem[];
}

const InsightCard: React.FC<InsightCardProps> = ({ title, icon, items }) => {
  if (items.length === 0) return null;

  return (
    <div className="border-2 border-black rounded-sm p-4 bg-white">
      <h3 className="font-bold text-black mb-3 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      <ul className="space-y-2">
        {items.slice(0, 3).map((item, index) => (
          <li key={index} className="p-2 bg-concrete rounded-sm">
            <p className="text-sm text-black">{item.text}</p>
            <p className="text-xs text-slate mt-1">
              {formatDisplayDate(item.date)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Collapsible list for the right column
interface ListSectionProps {
  title: string;
  icon: string;
  itemCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const ListSection: React.FC<ListSectionProps> = ({
  title,
  icon,
  itemCount,
  isExpanded,
  onToggle,
  children,
}) => {
  return (
    <div className="border-2 border-steel rounded-sm overflow-hidden hover:border-charcoal transition-colors">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-white hover:bg-concrete transition-colors"
      >
        <span className="flex items-center gap-2 font-bold text-black text-sm">
          <span>{icon}</span>
          {title}
          {itemCount > 0 && (
            <span className="text-xs bg-tab-orange/20 text-tab-orange px-2 py-0.5 rounded-full">
              {itemCount}
            </span>
          )}
        </span>
        <svg
          className={`w-4 h-4 text-charcoal transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="border-t border-steel max-h-64 overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );
};

// Mobile list grid item
interface MobileListItemProps {
  icon: string;
  label: string;
  count: number;
  onClick: () => void;
}

const MobileListItem: React.FC<MobileListItemProps> = ({ icon, label, count, onClick }) => (
  <button
    onClick={onClick}
    className="p-3 rounded-sm border-2 border-steel hover:border-black transition-all text-left bg-white"
  >
    <span className="text-2xl block mb-1">{icon}</span>
    <span className="font-bold text-black text-sm block">{label}</span>
    {count > 0 && <span className="text-xs text-slate">{count}</span>}
  </button>
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

  // Track which lists are expanded (default: grocery)
  const [expandedLists, setExpandedLists] = useState<Set<ListType>>(new Set(['grocery']));

  // List counts
  const [listCounts, setListCounts] = useState({
    grocery: 0,
    watchlist: 0,
    reading: 0,
    music: 0,
    places: 0,
    restaurants: 0,
  });

  useEffect(() => {
    const counts = researchService.getAllListsCounts();
    setListCounts({
      grocery: counts.grocery,
      watchlist: counts.watchlist,
      reading: counts.reading,
      music: counts.spotify,
      places: counts.places,
      restaurants: counts.restaurants,
    });
  }, []);

  const toggleList = (list: ListType) => {
    setExpandedLists((prev) => {
      const next = new Set(prev);
      if (next.has(list)) {
        next.delete(list);
      } else {
        next.add(list);
      }
      return next;
    });
  };

  const navigateToList = (list: ListType) => {
    navigate(`/lists?list=${list}`);
  };

  const workouts = extractWorkouts(entries);
  const ideas = extractIdeas(entries);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-h2 font-bold text-black">Dashboard</h1>
        <p className="text-small text-slate mt-1">Your insights and lists at a glance</p>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="md:hidden space-y-6">
        {/* Insights section */}
        <div className="space-y-4">
          <h2 className="font-bold text-black border-b-2 border-black pb-2">Insights</h2>
          <LocationDaysCounter />
          <RecentlySavedWidget />
          <DiarySearchSection />
          <InsightCard title="Recent Workouts" icon="🏋️" items={workouts} />
          <InsightCard title="Ideas" icon="💡" items={ideas} />
        </div>

        {/* Lists grid */}
        <div>
          <h2 className="font-bold text-black border-b-2 border-black pb-2 mb-4">Lists</h2>
          <div className="grid grid-cols-3 gap-2">
            <MobileListItem
              icon="🛒"
              label="Grocery"
              count={listCounts.grocery}
              onClick={() => navigateToList('grocery')}
            />
            <MobileListItem
              icon="🍽️"
              label="Food"
              count={listCounts.restaurants}
              onClick={() => navigateToList('restaurants')}
            />
            <MobileListItem
              icon="🎬"
              label="Watch"
              count={listCounts.watchlist}
              onClick={() => navigateToList('watchlist')}
            />
            <MobileListItem
              icon="📚"
              label="Read"
              count={listCounts.reading}
              onClick={() => navigateToList('reading')}
            />
            <MobileListItem
              icon="🎵"
              label="Music"
              count={listCounts.music}
              onClick={() => navigateToList('music')}
            />
            <MobileListItem
              icon="📍"
              label="Places"
              count={listCounts.places}
              onClick={() => navigateToList('places')}
            />
          </div>
        </div>
      </div>

      {/* Desktop: Two-column layout */}
      <div className="hidden md:grid md:grid-cols-2 gap-6">
        {/* Left column: Insights */}
        <div className="space-y-4">
          <h2 className="font-bold text-black border-b-2 border-black pb-2">Insights</h2>
          <LocationDaysCounter />
          <RecentlySavedWidget />
          <DiarySearchSection />
          <InsightCard title="Recent Workouts" icon="🏋️" items={workouts} />
          <InsightCard title="Ideas" icon="💡" items={ideas} />
        </div>

        {/* Right column: Lists */}
        <div className="space-y-3">
          <h2 className="font-bold text-black border-b-2 border-black pb-2">Lists</h2>

          <ListSection
            title="Grocery"
            icon="🛒"
            itemCount={listCounts.grocery}
            isExpanded={expandedLists.has('grocery')}
            onToggle={() => toggleList('grocery')}
          >
            <GroceryList />
          </ListSection>

          <ListSection
            title="Restaurants"
            icon="🍽️"
            itemCount={listCounts.restaurants}
            isExpanded={expandedLists.has('restaurants')}
            onToggle={() => toggleList('restaurants')}
          >
            <RestaurantList />
          </ListSection>

          <ListSection
            title="Watchlist"
            icon="🎬"
            itemCount={listCounts.watchlist}
            isExpanded={expandedLists.has('watchlist')}
            onToggle={() => toggleList('watchlist')}
          >
            <WatchlistList />
          </ListSection>

          <ListSection
            title="Reading"
            icon="📚"
            itemCount={listCounts.reading}
            isExpanded={expandedLists.has('reading')}
            onToggle={() => toggleList('reading')}
          >
            <ReadingList />
          </ListSection>

          <ListSection
            title="Music"
            icon="🎵"
            itemCount={listCounts.music}
            isExpanded={expandedLists.has('music')}
            onToggle={() => toggleList('music')}
          >
            <MusicList />
          </ListSection>

          <ListSection
            title="Places"
            icon="📍"
            itemCount={listCounts.places}
            isExpanded={expandedLists.has('places')}
            onToggle={() => toggleList('places')}
          >
            <PlacesList />
          </ListSection>

          <RecipeListSection />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
