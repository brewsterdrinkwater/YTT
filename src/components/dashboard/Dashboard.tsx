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

// Dashboard tab type
type DashboardTab = 'lists' | 'insights' | 'search';

// Recipe List Component (kept from original)
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

  if (recipes.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <span>🍳</span> Recipes
        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
          {recipes.length}
        </span>
      </h3>
      <ul className="space-y-2">
        {recipes.map((recipe) => (
          <li key={recipe.id} className="bg-orange-50 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)}
              className="w-full p-3 flex items-center justify-between text-left"
            >
              <span className="font-medium text-sm">{recipe.name}</span>
              <span className="text-xs text-gray-500">
                {recipe.ingredients.length} ingredients
                <span className="ml-2">{expandedRecipe === recipe.id ? '▲' : '▼'}</span>
              </span>
            </button>
            {expandedRecipe === recipe.id && (
              <div className="px-3 pb-3 border-t border-orange-100">
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i}>
                      • {ing.name} {ing.quantity > 0 && `(${ing.quantity} ${ing.unit})`}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAddToGrocery(recipe.id)}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                  >
                    🛒 Add to Grocery
                  </button>
                  {recipe.sourceUrl && (
                    <a
                      href={recipe.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline px-2 py-1"
                    >
                      View Source →
                    </a>
                  )}
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
    </Card>
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
      setResults(searchResults.slice(0, 5));
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
    <Card className="mb-4">
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <span>🔍</span> Search Diary
      </h3>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search entries, locations, activities..."
        className="mb-3 min-h-[52px] text-base"
      />
      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((entry) => (
            <li
              key={entry.id}
              onClick={() => handleEntryClick(entry)}
              className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <p className="text-sm font-medium">{formatDisplayDate(entry.date)}</p>
              <p className="text-xs text-gray-500 truncate">
                {entry.location} • {entry.highlights || 'No highlights'}
              </p>
            </li>
          ))}
        </ul>
      )}
      {query && results.length === 0 && (
        <p className="text-sm text-gray-400 italic">No entries found</p>
      )}
    </Card>
  );
};

// Dashboard Section for diary insights
interface DashboardSectionProps {
  title: string;
  icon: string;
  items: DashboardItem[];
  emptyMessage: string;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  icon,
  items,
}) => {
  if (items.length === 0) return null;
  return (
    <Card className="mb-4">
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h3>
      <ul className="space-y-2">
        {items.slice(0, 5).map((item, index) => (
          <li key={index} className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-900">{item.text}</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDisplayDate(item.date)} • {item.location}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
};

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

// Collapsible list section for desktop
interface CollapsibleListProps {
  title: string;
  icon: string;
  isExpanded: boolean;
  onToggle: () => void;
  itemCount: number;
  children: React.ReactNode;
}

const CollapsibleList: React.FC<CollapsibleListProps> = ({
  title,
  icon,
  isExpanded,
  onToggle,
  itemCount,
  children,
}) => {
  return (
    <div className="mb-4 border-2 border-steel rounded-sm overflow-hidden hover:border-charcoal transition-colors">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-concrete transition-colors"
      >
        <span className="flex items-center gap-2 font-bold text-black">
          <span className="text-xl">{icon}</span>
          {title}
          {itemCount > 0 && (
            <span className="text-xs bg-tab-orange/20 text-tab-orange px-2 py-1 rounded-full font-semibold">
              {itemCount}
            </span>
          )}
        </span>
        <svg
          className={`w-5 h-5 text-charcoal transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="border-t-2 border-steel">
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
  color: string;
}

const MobileListItem: React.FC<MobileListItemProps> = ({ icon, label, count, onClick, color }) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-sm border-2 border-steel hover:border-black transition-all text-left ${color}`}
  >
    <span className="text-3xl block mb-2">{icon}</span>
    <span className="font-bold text-black block">{label}</span>
    {count > 0 && (
      <span className="text-sm text-slate">{count} items</span>
    )}
  </button>
);

const Dashboard: React.FC = () => {
  const { entries } = useEntries();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>('lists');

  // Desktop: track which lists are expanded
  const [expandedLists, setExpandedLists] = useState<Set<ListType>>(new Set(['grocery']));

  // List counts for display
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
    setExpandedLists(prev => {
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
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-h2 font-bold text-black">Dashboard</h1>
        <p className="text-small text-slate mt-1">Your lists, insights, and search</p>
      </div>

      {/* Tabs - Walt-tab brutalist style with color accents */}
      <div className="flex gap-1 mb-6 border-b-2 border-black overflow-x-auto">
        <button
          onClick={() => setActiveTab('lists')}
          className={`px-5 py-3 font-semibold text-sm transition-all border-b-4 -mb-0.5 whitespace-nowrap ${
            activeTab === 'lists'
              ? 'bg-tab-orange/10 text-black border-tab-orange'
              : 'bg-transparent text-slate hover:text-black border-transparent hover:bg-concrete'
          }`}
        >
          📋 Lists
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-5 py-3 font-semibold text-sm transition-all border-b-4 -mb-0.5 whitespace-nowrap ${
            activeTab === 'insights'
              ? 'bg-tab-blue/10 text-black border-tab-blue'
              : 'bg-transparent text-slate hover:text-black border-transparent hover:bg-concrete'
          }`}
        >
          💡 Insights
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-5 py-3 font-semibold text-sm transition-all border-b-4 -mb-0.5 whitespace-nowrap ${
            activeTab === 'search'
              ? 'bg-success/10 text-black border-success'
              : 'bg-transparent text-slate hover:text-black border-transparent hover:bg-concrete'
          }`}
        >
          🔍 Search
        </button>
      </div>

      {/* Lists Tab */}
      {activeTab === 'lists' && (
        <>
          {/* Mobile: Grid of list links */}
          <div className="md:hidden grid grid-cols-2 gap-3 mb-6">
            <MobileListItem
              icon="🛒"
              label="Groceries"
              count={listCounts.grocery}
              onClick={() => navigateToList('grocery')}
              color="bg-tab-orange/5"
            />
            <MobileListItem
              icon="🍽️"
              label="Restaurants"
              count={listCounts.restaurants}
              onClick={() => navigateToList('restaurants')}
              color="bg-pink-50"
            />
            <MobileListItem
              icon="🎬"
              label="Watchlist"
              count={listCounts.watchlist}
              onClick={() => navigateToList('watchlist')}
              color="bg-tab-red/5"
            />
            <MobileListItem
              icon="📚"
              label="Reading"
              count={listCounts.reading}
              onClick={() => navigateToList('reading')}
              color="bg-tab-orange/5"
            />
            <MobileListItem
              icon="🎵"
              label="Music"
              count={listCounts.music}
              onClick={() => navigateToList('music')}
              color="bg-success/5"
            />
            <MobileListItem
              icon="📍"
              label="Places"
              count={listCounts.places}
              onClick={() => navigateToList('places')}
              color="bg-tab-blue/5"
            />
          </div>

          {/* Desktop: Collapsible lists */}
          <div className="hidden md:block">
            <CollapsibleList
              title="Grocery List"
              icon="🛒"
              isExpanded={expandedLists.has('grocery')}
              onToggle={() => toggleList('grocery')}
              itemCount={listCounts.grocery}
            >
              <GroceryList />
            </CollapsibleList>

            <CollapsibleList
              title="Restaurants"
              icon="🍽️"
              isExpanded={expandedLists.has('restaurants')}
              onToggle={() => toggleList('restaurants')}
              itemCount={listCounts.restaurants}
            >
              <RestaurantList />
            </CollapsibleList>

            <CollapsibleList
              title="Watchlist"
              icon="🎬"
              isExpanded={expandedLists.has('watchlist')}
              onToggle={() => toggleList('watchlist')}
              itemCount={listCounts.watchlist}
            >
              <WatchlistList />
            </CollapsibleList>

            <CollapsibleList
              title="Reading List"
              icon="📚"
              isExpanded={expandedLists.has('reading')}
              onToggle={() => toggleList('reading')}
              itemCount={listCounts.reading}
            >
              <ReadingList />
            </CollapsibleList>

            <CollapsibleList
              title="Listen List"
              icon="🎵"
              isExpanded={expandedLists.has('music')}
              onToggle={() => toggleList('music')}
              itemCount={listCounts.music}
            >
              <MusicList />
            </CollapsibleList>

            <CollapsibleList
              title="Places to Visit"
              icon="📍"
              isExpanded={expandedLists.has('places')}
              onToggle={() => toggleList('places')}
              itemCount={listCounts.places}
            >
              <PlacesList />
            </CollapsibleList>

            {/* Recipes Section */}
            <RecipeListSection />
          </div>
        </>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <>
          {entries.length === 0 ? (
            <Card className="text-center py-12">
              <span className="text-4xl mb-4 block">📊</span>
              <h2 className="text-xl font-semibold mb-2">No Data Yet</h2>
              <p className="text-gray-500">Start adding entries to see insights.</p>
            </Card>
          ) : (
            <>
              <DashboardSection title="Recent Workouts" icon="🏋️" items={workouts} emptyMessage="" />
              <DashboardSection title="Ideas & Insights" icon="💡" items={ideas} emptyMessage="" />
            </>
          )}
        </>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && <DiarySearchSection />}
    </div>
  );
};

export default Dashboard;
