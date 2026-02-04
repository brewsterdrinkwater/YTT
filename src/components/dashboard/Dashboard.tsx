import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntries } from '../../contexts/EntriesContext';
import { useApp } from '../../contexts/AppContext';
import { Entry, DashboardItem } from '../../types';
import {
  SpotifyListItem,
  ReadingListItem,
  WatchlistItem,
  PlacesListItem,
  GroceryItem,
  Recipe,
  RestaurantItem,
} from '../../types/research';
import { DASHBOARD_KEYWORDS } from '../../constants/config';
import { formatDisplayDate, parseISO } from '../../utils/dateUtils';
import { researchService } from '../../services/researchService';
import Card from '../common/Card';
import Button from '../common/Button';
import { Input } from '../common/Input';

// Dashboard tab type
type DashboardTab = 'lists' | 'insights' | 'search';

// Grocery List Component with Shopping Mode
const GroceryListSection: React.FC = () => {
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [shoppingMode, setShoppingMode] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    setGroceryList(researchService.getGroceryList());
  }, []);

  const handleAddItem = () => {
    if (!newItem.name.trim()) return;
    const updated = researchService.addGroceryItem({
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      isStaple: false,
    });
    setGroceryList(updated);
    setNewItem({ name: '', quantity: 1, unit: '' });
    setShowAddForm(false);
  };

  const handleToggle = (id: string) => {
    const updated = researchService.toggleGroceryItem(id);
    setGroceryList(updated);
  };

  const handleRemove = (id: string) => {
    const updated = researchService.removeGroceryItem(id);
    setGroceryList(updated);
  };

  const handleToggleStaple = (id: string) => {
    const item = groceryList.find((g) => g.id === id);
    if (item) {
      const updated = researchService.updateGroceryItem(id, { isStaple: !item.isStaple });
      setGroceryList(updated);
    }
  };

  const handleClearChecked = () => {
    const updated = researchService.clearCheckedGroceryItems();
    setGroceryList(updated);
  };

  const uncheckedCount = groceryList.filter((g) => !g.checked).length;
  const checkedCount = groceryList.filter((g) => g.checked).length;

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <span>🛒</span> Grocery List
          {uncheckedCount > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {uncheckedCount} items
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShoppingMode(!shoppingMode)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              shoppingMode
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {shoppingMode ? '✓ Shopping' : '🛍️ Shop Mode'}
          </button>
        </div>
      </div>

      {groceryList.length === 0 ? (
        <p className="text-gray-400 text-sm italic mb-3">No items in your grocery list</p>
      ) : (
        <ul className={`space-y-1 mb-3 ${shoppingMode ? 'divide-y divide-gray-100' : ''}`}>
          {groceryList
            .sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1))
            .map((item) => (
              <li
                key={item.id}
                className={`flex items-center gap-3 py-2 ${shoppingMode ? 'px-2 rounded-lg' : ''} ${
                  item.checked ? 'opacity-50' : ''
                } ${shoppingMode && !item.checked ? 'bg-yellow-50' : ''}`}
              >
                {shoppingMode ? (
                  <button
                    onClick={() => handleToggle(item.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      item.checked
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {item.checked && '✓'}
                  </button>
                ) : (
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggle(item.id)}
                    className="w-4 h-4 rounded"
                  />
                )}
                <span className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-400' : ''}`}>
                  {item.name}
                  {item.quantity > 0 && (
                    <span className="text-gray-400 ml-1">
                      ({item.quantity}{item.unit ? ` ${item.unit}` : ''})
                    </span>
                  )}
                  {item.isStaple && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
                      staple
                    </span>
                  )}
                </span>
                {!shoppingMode && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleStaple(item.id)}
                      className="text-xs text-gray-400 hover:text-purple-600 p-1"
                      title={item.isStaple ? 'Remove from staples' : 'Mark as staple'}
                    >
                      {item.isStaple ? '★' : '☆'}
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-xs text-red-400 hover:text-red-600 p-1"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </li>
            ))}
        </ul>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add item
          </button>
        ) : (
          <div className="w-full space-y-2">
            {/* Item name - full width */}
            <div className="flex gap-2">
              <Input
                placeholder="Item name (e.g., Apples)"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              />
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600 px-2"
              >
                ✕
              </button>
            </div>
            {/* Quantity and unit - second row */}
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Qty"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                className="w-20"
                min={1}
              />
              <Input
                placeholder="Unit (lbs, oz, bags...)"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                className="flex-1"
              />
              <Button onClick={handleAddItem}>Add</Button>
            </div>
          </div>
        )}
        {checkedCount > 0 && (
          <button
            onClick={handleClearChecked}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear checked ({checkedCount})
          </button>
        )}
      </div>
    </Card>
  );
};

// Recipe List Component
const RecipeListSection: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  useEffect(() => {
    setRecipes(researchService.getRecipes());
  }, []);

  const handleAddToGrocery = (recipeId: string) => {
    researchService.addRecipeIngredientsToGrocery(recipeId);
    // Trigger a notification or feedback
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

// Restaurant List Component
const RestaurantListSection: React.FC = () => {
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);

  useEffect(() => {
    setRestaurants(researchService.getRestaurants());
  }, []);

  const handleToggleVisited = (id: string) => {
    const updated = researchService.toggleRestaurantVisited(id);
    setRestaurants(updated);
  };

  const handleRemove = (id: string) => {
    const updated = researchService.removeRestaurant(id);
    setRestaurants(updated);
  };

  if (restaurants.length === 0) {
    return null;
  }

  const unvisited = restaurants.filter((r) => !r.visited);
  const visited = restaurants.filter((r) => r.visited);

  return (
    <Card className="mb-4">
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <span>🍽️</span> Restaurants to Try
        {unvisited.length > 0 && (
          <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
            {unvisited.length} to visit
          </span>
        )}
      </h3>
      <ul className="space-y-2">
        {[...unvisited, ...visited].map((restaurant) => (
          <li
            key={restaurant.id}
            className={`p-2 rounded-lg flex items-start justify-between ${
              restaurant.visited ? 'bg-gray-50 opacity-60' : 'bg-pink-50'
            }`}
          >
            <div className="flex items-start gap-2">
              <button
                onClick={() => handleToggleVisited(restaurant.id)}
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                  restaurant.visited
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-400'
                }`}
              >
                {restaurant.visited && '✓'}
              </button>
              <div>
                <span className={`font-medium text-sm ${restaurant.visited ? 'line-through' : ''}`}>
                  {restaurant.name}
                </span>
                {restaurant.cuisine && (
                  <span className="text-xs text-gray-500 ml-2">{restaurant.cuisine}</span>
                )}
                {restaurant.location && (
                  <p className="text-xs text-gray-400">{restaurant.location}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {restaurant.url && (
                <a
                  href={restaurant.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  View →
                </a>
              )}
              <button
                onClick={() => handleRemove(restaurant.id)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
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
        className="mb-3"
      />
      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((entry) => (
            <li
              key={entry.id}
              onClick={() => handleEntryClick(entry)}
              className="p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
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

// Research List Section (existing)
interface ResearchListSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  emptyMessage: string;
  isEmpty: boolean;
}

const ResearchListSection: React.FC<ResearchListSectionProps> = ({
  title,
  icon,
  children,
  emptyMessage,
  isEmpty,
}) => {
  return (
    <Card className="mb-4 border-2 border-steel hover:border-charcoal transition-colors">
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-black">
        <span>{icon}</span>
        {title}
      </h3>
      {isEmpty ? (
        <p className="text-slate text-sm italic py-2">{emptyMessage || `No items yet. Add some ${title.toLowerCase()}!`}</p>
      ) : (
        children
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
  emptyMessage,
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
          <li key={index} className="p-2 bg-gray-50 rounded-lg">
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

// Extract functions (simplified)
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
  const [activeTab, setActiveTab] = useState<DashboardTab>('lists');

  // Research lists state
  const [spotifyList, setSpotifyList] = useState<SpotifyListItem[]>([]);
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [placesList, setPlacesList] = useState<PlacesListItem[]>([]);

  useEffect(() => {
    setSpotifyList(researchService.getSpotifyList());
    setReadingList(researchService.getReadingList());
    setWatchlist(researchService.getWatchlist());
    setPlacesList(researchService.getPlacesList());
  }, []);

  const workouts = extractWorkouts(entries);
  const ideas = extractIdeas(entries);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-h2 font-bold text-black">Dashboard</h1>
        <p className="text-small text-slate mt-1">Your lists, insights, and search</p>
      </div>

      {/* Tabs - Walt-tab brutalist style with color accents */}
      <div className="flex gap-1 mb-6 border-b-2 border-black">
        <button
          onClick={() => setActiveTab('lists')}
          className={`px-5 py-3 font-semibold text-sm transition-all border-b-4 -mb-0.5 ${
            activeTab === 'lists'
              ? 'bg-tab-orange/10 text-black border-tab-orange'
              : 'bg-transparent text-slate hover:text-black border-transparent hover:bg-concrete'
          }`}
        >
          📋 Lists
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-5 py-3 font-semibold text-sm transition-all border-b-4 -mb-0.5 ${
            activeTab === 'insights'
              ? 'bg-tab-blue/10 text-black border-tab-blue'
              : 'bg-transparent text-slate hover:text-black border-transparent hover:bg-concrete'
          }`}
        >
          💡 Insights
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-5 py-3 font-semibold text-sm transition-all border-b-4 -mb-0.5 ${
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
          <GroceryListSection />
          <RecipeListSection />
          <RestaurantListSection />

          {/* Research Lists */}
          <ResearchListSection title="Listen List" icon="🎵" isEmpty={spotifyList.length === 0} emptyMessage="Add music, podcasts, or albums to listen to">
            <ul className="space-y-1">
              {spotifyList.map((item, i) => (
                <li key={i} className="p-3 bg-success/5 border border-success/20 rounded-sm flex justify-between items-center text-sm">
                  <span className="font-medium">{item.name}</span>
                  {item.spotifyUrl && (
                    <a href={item.spotifyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-success font-semibold hover:underline">
                      Spotify →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </ResearchListSection>

          <ResearchListSection title="Reading List" icon="📚" isEmpty={readingList.length === 0} emptyMessage="Add books, articles, or papers to read">
            <ul className="space-y-1">
              {readingList.map((item, i) => (
                <li key={i} className="p-3 bg-tab-orange/5 border border-tab-orange/20 rounded-sm flex justify-between items-center text-sm">
                  <span className="font-medium">{item.name}</span>
                  {item.kindleUrl && (
                    <a href={item.kindleUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-tab-orange font-semibold hover:underline">
                      Kindle →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </ResearchListSection>

          <ResearchListSection title="Watchlist" icon="🎬" isEmpty={watchlist.length === 0} emptyMessage="Add movies or shows to watch">
            <ul className="space-y-1">
              {watchlist.map((item, i) => (
                <li key={i} className="p-3 bg-tab-red/5 border border-tab-red/20 rounded-sm flex justify-between items-center text-sm">
                  <span className="font-medium">{item.name}</span>
                  {item.imdbUrl && (
                    <a href={item.imdbUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-tab-red font-semibold hover:underline">
                      IMDB →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </ResearchListSection>

          <ResearchListSection title="Places to Visit" icon="📍" isEmpty={placesList.length === 0} emptyMessage="Add destinations, restaurants, or attractions">
            <ul className="space-y-1">
              {placesList.map((item, i) => (
                <li key={i} className="p-3 bg-tab-blue/5 border border-tab-blue/20 rounded-sm text-sm">
                  <span className="font-semibold">{item.name}</span>
                  {item.location && <span className="text-slate ml-2">({item.location})</span>}
                  <p className="text-xs text-tab-blue mt-1">{item.reason}</p>
                </li>
              ))}
            </ul>
          </ResearchListSection>
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
