/**
 * ListsContext
 *
 * Owns all list state for the app (music, reading, watchlist, places,
 * grocery, recipes, restaurants, saved items) and keeps it synced with
 * Supabase so it survives across devices and browser-cache clears.
 *
 * Architecture:
 *  - localStorage is the instant read/write cache (no loading flicker)
 *  - Supabase is the authoritative cloud store (loaded on login)
 *  - Every mutation writes to localStorage first, then syncs to Supabase
 *    in the background (fire-and-forget)
 *  - On login the Supabase copy wins (it is the most up-to-date cross-device)
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { storageService } from '../services/storageService';
import { STORAGE_KEYS } from '../constants/config';
import {
  SpotifyListItem,
  ReadingListItem,
  WatchlistItem,
  PlacesListItem,
  HistoryItem,
  ResearchResult,
  GroceryItem,
  Recipe,
  RestaurantItem,
} from '../types/research';
import { SavedItem, ListCategory } from '../services/quickShareService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

type SupabaseListType =
  | 'spotify'
  | 'reading'
  | 'watchlist'
  | 'places'
  | 'grocery'
  | 'recipes'
  | 'restaurants'
  | 'saved_items';

interface ListsContextType {
  // Data
  spotifyList: SpotifyListItem[];
  readingList: ReadingListItem[];
  watchlist: WatchlistItem[];
  placesList: PlacesListItem[];
  groceryList: GroceryItem[];
  recipesList: Recipe[];
  restaurantsList: RestaurantItem[];
  savedItems: SavedItem[];
  researchHistory: HistoryItem[];

  // Music
  addToSpotifyList: (item: SpotifyListItem) => void;
  removeFromSpotifyList: (name: string) => void;

  // Reading
  addToReadingList: (item: ReadingListItem) => void;
  removeFromReadingList: (name: string) => void;

  // Watchlist
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (name: string) => void;

  // Places
  addToPlacesList: (item: PlacesListItem) => void;
  removeFromPlacesList: (name: string) => void;
  togglePlaceVisited: (name: string) => void;

  // Grocery
  addGroceryItem: (item: Omit<GroceryItem, 'id' | 'addedAt' | 'checked'>) => void;
  updateGroceryItem: (id: string, updates: Partial<GroceryItem>) => void;
  removeGroceryItem: (id: string) => void;
  toggleGroceryItem: (id: string) => void;
  saveGroceryList: (list: GroceryItem[]) => void;
  clearCheckedGroceryItems: () => void;

  // Recipes
  addRecipe: (recipe: Omit<Recipe, 'id' | 'addedAt'>) => void;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  removeRecipe: (id: string) => void;
  addRecipeIngredientsToGrocery: (recipeId: string) => void;

  // Restaurants
  addRestaurant: (restaurant: Omit<RestaurantItem, 'id' | 'addedAt' | 'visited'>) => void;
  updateRestaurant: (id: string, updates: Partial<RestaurantItem>) => void;
  removeRestaurant: (id: string) => void;
  toggleRestaurantVisited: (id: string) => void;

  // Saved Items
  setSavedItems: (items: SavedItem[]) => void;
  removeSavedItem: (id: string) => void;
  addSavedItemToList: (itemId: string, category: ListCategory) => void;

  // Research History
  addToHistory: (result: ResearchResult) => void;
  clearHistory: () => void;
  getHistoryItem: (name: string) => HistoryItem | undefined;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ListsContext = createContext<ListsContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helper: load a list from localStorage
// ---------------------------------------------------------------------------

function loadLocal<T>(key: string): T[] {
  return storageService.get<T[]>(key) ?? [];
}

function saveLocal<T>(key: string, data: T[]): void {
  storageService.set(key, data);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const ListsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();

  // ---- State (initialised from localStorage for instant render) ----
  const [spotifyList, setSpotifyList] = useState<SpotifyListItem[]>(() =>
    loadLocal(STORAGE_KEYS.RESEARCH_SPOTIFY_LIST)
  );
  const [readingList, setReadingList] = useState<ReadingListItem[]>(() =>
    loadLocal(STORAGE_KEYS.RESEARCH_READING_LIST)
  );
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() =>
    loadLocal(STORAGE_KEYS.RESEARCH_WATCHLIST)
  );
  const [placesList, setPlacesList] = useState<PlacesListItem[]>(() =>
    loadLocal(STORAGE_KEYS.RESEARCH_PLACES_LIST)
  );
  const [groceryList, setGroceryList] = useState<GroceryItem[]>(() =>
    loadLocal(STORAGE_KEYS.GROCERY_LIST)
  );
  const [recipesList, setRecipesList] = useState<Recipe[]>(() =>
    loadLocal(STORAGE_KEYS.RECIPES_LIST)
  );
  const [restaurantsList, setRestaurantsList] = useState<RestaurantItem[]>(() =>
    loadLocal(STORAGE_KEYS.RESTAURANTS_LIST)
  );
  const [savedItems, setSavedItemsState] = useState<SavedItem[]>(() =>
    loadLocal(STORAGE_KEYS.SAVED_ITEMS)
  );
  const [researchHistory, setResearchHistory] = useState<HistoryItem[]>(() =>
    loadLocal(STORAGE_KEYS.RESEARCH_HISTORY)
  );

  // ---- Supabase helpers ----

  const saveListToSupabase = useCallback(
    (listType: SupabaseListType, items: unknown[], userId: string) => {
      supabase
        .from('research_lists')
        .upsert({ user_id: userId, list_type: listType, items }, { onConflict: 'user_id,list_type' })
        .then(({ error }) => {
          if (error) console.error(`[Lists] Supabase save error (${listType}):`, error);
        });
    },
    []
  );

  // ---- Load all lists from Supabase on login ----

  useEffect(() => {
    if (authLoading || !user) return;

    supabase
      .from('research_lists')
      .select('list_type, items')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (error) {
          console.error('[Lists] Error loading from Supabase:', error);
          return;
        }
        if (!data) return;

        // For each list type returned, override local state + localStorage
        data.forEach(({ list_type, items }) => {
          const serverItems = (items as unknown[]) ?? [];
          switch (list_type as SupabaseListType) {
            case 'spotify':
              setSpotifyList(serverItems as SpotifyListItem[]);
              saveLocal(STORAGE_KEYS.RESEARCH_SPOTIFY_LIST, serverItems);
              break;
            case 'reading':
              setReadingList(serverItems as ReadingListItem[]);
              saveLocal(STORAGE_KEYS.RESEARCH_READING_LIST, serverItems);
              break;
            case 'watchlist':
              setWatchlist(serverItems as WatchlistItem[]);
              saveLocal(STORAGE_KEYS.RESEARCH_WATCHLIST, serverItems);
              break;
            case 'places':
              setPlacesList(serverItems as PlacesListItem[]);
              saveLocal(STORAGE_KEYS.RESEARCH_PLACES_LIST, serverItems);
              break;
            case 'grocery':
              setGroceryList(serverItems as GroceryItem[]);
              saveLocal(STORAGE_KEYS.GROCERY_LIST, serverItems);
              break;
            case 'recipes':
              setRecipesList(serverItems as Recipe[]);
              saveLocal(STORAGE_KEYS.RECIPES_LIST, serverItems);
              break;
            case 'restaurants':
              setRestaurantsList(serverItems as RestaurantItem[]);
              saveLocal(STORAGE_KEYS.RESTAURANTS_LIST, serverItems);
              break;
            case 'saved_items':
              setSavedItemsState(serverItems as SavedItem[]);
              saveLocal(STORAGE_KEYS.SAVED_ITEMS, serverItems);
              break;
          }
        });

        // For any list type not yet on Supabase (first login), upload local data
        const existingTypes = new Set(data.map((r) => r.list_type));
        const allTypes: { type: SupabaseListType; local: unknown[] }[] = [
          { type: 'spotify', local: loadLocal(STORAGE_KEYS.RESEARCH_SPOTIFY_LIST) },
          { type: 'reading', local: loadLocal(STORAGE_KEYS.RESEARCH_READING_LIST) },
          { type: 'watchlist', local: loadLocal(STORAGE_KEYS.RESEARCH_WATCHLIST) },
          { type: 'places', local: loadLocal(STORAGE_KEYS.RESEARCH_PLACES_LIST) },
          { type: 'grocery', local: loadLocal(STORAGE_KEYS.GROCERY_LIST) },
          { type: 'recipes', local: loadLocal(STORAGE_KEYS.RECIPES_LIST) },
          { type: 'restaurants', local: loadLocal(STORAGE_KEYS.RESTAURANTS_LIST) },
          { type: 'saved_items', local: loadLocal(STORAGE_KEYS.SAVED_ITEMS) },
        ];
        allTypes
          .filter(({ type }) => !existingTypes.has(type))
          .forEach(({ type, local }) => {
            if (local.length > 0) saveListToSupabase(type, local, user.id);
          });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  // ---- Generic setter factory: update state + localStorage + Supabase ----

  function makeListSetter<T>(
    setState: React.Dispatch<React.SetStateAction<T[]>>,
    localKey: string,
    supabaseType: SupabaseListType
  ) {
    return (newList: T[]) => {
      setState(newList);
      saveLocal(localKey, newList);
      if (user) saveListToSupabase(supabaseType, newList, user.id);
    };
  }

  const persistSpotify = useCallback(
    makeListSetter(setSpotifyList, STORAGE_KEYS.RESEARCH_SPOTIFY_LIST, 'spotify'),
    [user]
  );
  const persistReading = useCallback(
    makeListSetter(setReadingList, STORAGE_KEYS.RESEARCH_READING_LIST, 'reading'),
    [user]
  );
  const persistWatchlist = useCallback(
    makeListSetter(setWatchlist, STORAGE_KEYS.RESEARCH_WATCHLIST, 'watchlist'),
    [user]
  );
  const persistPlaces = useCallback(
    makeListSetter(setPlacesList, STORAGE_KEYS.RESEARCH_PLACES_LIST, 'places'),
    [user]
  );
  const persistGrocery = useCallback(
    makeListSetter(setGroceryList, STORAGE_KEYS.GROCERY_LIST, 'grocery'),
    [user]
  );
  const persistRecipes = useCallback(
    makeListSetter(setRecipesList, STORAGE_KEYS.RECIPES_LIST, 'recipes'),
    [user]
  );
  const persistRestaurants = useCallback(
    makeListSetter(setRestaurantsList, STORAGE_KEYS.RESTAURANTS_LIST, 'restaurants'),
    [user]
  );
  const persistSaved = useCallback(
    makeListSetter(setSavedItemsState, STORAGE_KEYS.SAVED_ITEMS, 'saved_items'),
    [user]
  );
  const persistHistory = useCallback(
    (newHistory: HistoryItem[]) => {
      setResearchHistory(newHistory);
      saveLocal(STORAGE_KEYS.RESEARCH_HISTORY, newHistory);
      // Research history is high-frequency and large — skip Supabase sync
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Music / Spotify
  // ---------------------------------------------------------------------------

  const addToSpotifyList = useCallback(
    (item: SpotifyListItem) => {
      const newList = [item, ...spotifyList.filter((s) => s.name !== item.name)];
      persistSpotify(newList);
    },
    [spotifyList, persistSpotify]
  );

  const removeFromSpotifyList = useCallback(
    (name: string) => {
      persistSpotify(spotifyList.filter((s) => s.name !== name));
    },
    [spotifyList, persistSpotify]
  );

  // ---------------------------------------------------------------------------
  // Reading
  // ---------------------------------------------------------------------------

  const addToReadingList = useCallback(
    (item: ReadingListItem) => {
      const newList = [item, ...readingList.filter((r) => r.name !== item.name)];
      persistReading(newList);
    },
    [readingList, persistReading]
  );

  const removeFromReadingList = useCallback(
    (name: string) => {
      persistReading(readingList.filter((r) => r.name !== name));
    },
    [readingList, persistReading]
  );

  // ---------------------------------------------------------------------------
  // Watchlist
  // ---------------------------------------------------------------------------

  const addToWatchlist = useCallback(
    (item: WatchlistItem) => {
      const newList = [item, ...watchlist.filter((w) => w.name !== item.name)];
      persistWatchlist(newList);
    },
    [watchlist, persistWatchlist]
  );

  const removeFromWatchlist = useCallback(
    (name: string) => {
      persistWatchlist(watchlist.filter((w) => w.name !== name));
    },
    [watchlist, persistWatchlist]
  );

  // ---------------------------------------------------------------------------
  // Places
  // ---------------------------------------------------------------------------

  const addToPlacesList = useCallback(
    (item: PlacesListItem) => {
      const newList = [
        { ...item, visited: item.visited ?? false },
        ...placesList.filter((p) => p.name !== item.name),
      ];
      persistPlaces(newList);
    },
    [placesList, persistPlaces]
  );

  const removeFromPlacesList = useCallback(
    (name: string) => {
      persistPlaces(placesList.filter((p) => p.name !== name));
    },
    [placesList, persistPlaces]
  );

  const togglePlaceVisited = useCallback(
    (name: string) => {
      persistPlaces(
        placesList.map((p) => (p.name === name ? { ...p, visited: !p.visited } : p))
      );
    },
    [placesList, persistPlaces]
  );

  // ---------------------------------------------------------------------------
  // Grocery
  // ---------------------------------------------------------------------------

  const addGroceryItem = useCallback(
    (item: Omit<GroceryItem, 'id' | 'addedAt' | 'checked'>) => {
      const newItem: GroceryItem = {
        ...item,
        id: generateId(),
        checked: false,
        addedAt: new Date().toISOString(),
      };
      persistGrocery([newItem, ...groceryList]);
    },
    [groceryList, persistGrocery]
  );

  const updateGroceryItem = useCallback(
    (id: string, updates: Partial<GroceryItem>) => {
      persistGrocery(groceryList.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    },
    [groceryList, persistGrocery]
  );

  const removeGroceryItem = useCallback(
    (id: string) => {
      persistGrocery(groceryList.filter((g) => g.id !== id));
    },
    [groceryList, persistGrocery]
  );

  const toggleGroceryItem = useCallback(
    (id: string) => {
      persistGrocery(
        groceryList.map((g) => (g.id === id ? { ...g, checked: !g.checked } : g))
      );
    },
    [groceryList, persistGrocery]
  );

  const saveGroceryList = useCallback(
    (list: GroceryItem[]) => persistGrocery(list),
    [persistGrocery]
  );

  const clearCheckedGroceryItems = useCallback(() => {
    const filtered = groceryList.filter((g) => !g.checked || g.isStaple);
    persistGrocery(filtered.map((g) => (g.isStaple ? { ...g, checked: false } : g)));
  }, [groceryList, persistGrocery]);

  // ---------------------------------------------------------------------------
  // Recipes
  // ---------------------------------------------------------------------------

  const addRecipe = useCallback(
    (recipe: Omit<Recipe, 'id' | 'addedAt'>) => {
      const newRecipe: Recipe = {
        ...recipe,
        id: generateId(),
        addedAt: new Date().toISOString(),
      };
      persistRecipes([newRecipe, ...recipesList]);
    },
    [recipesList, persistRecipes]
  );

  const updateRecipe = useCallback(
    (id: string, updates: Partial<Recipe>) => {
      persistRecipes(recipesList.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    },
    [recipesList, persistRecipes]
  );

  const removeRecipe = useCallback(
    (id: string) => {
      persistRecipes(recipesList.filter((r) => r.id !== id));
    },
    [recipesList, persistRecipes]
  );

  const addRecipeIngredientsToGrocery = useCallback(
    (recipeId: string) => {
      const recipe = recipesList.find((r) => r.id === recipeId);
      if (!recipe) return;
      let updated = [...groceryList];
      recipe.ingredients.forEach((ing) => {
        const exists = updated.some(
          (g) => g.name.toLowerCase() === ing.name.toLowerCase()
        );
        if (!exists) {
          updated = [
            {
              id: generateId(),
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              checked: false,
              isStaple: false,
              addedAt: new Date().toISOString(),
            },
            ...updated,
          ];
        }
      });
      persistGrocery(updated);
    },
    [recipesList, groceryList, persistGrocery]
  );

  // ---------------------------------------------------------------------------
  // Restaurants
  // ---------------------------------------------------------------------------

  const addRestaurant = useCallback(
    (restaurant: Omit<RestaurantItem, 'id' | 'addedAt' | 'visited'>) => {
      const newItem: RestaurantItem = {
        ...restaurant,
        id: generateId(),
        visited: false,
        addedAt: new Date().toISOString(),
      };
      persistRestaurants([newItem, ...restaurantsList]);
    },
    [restaurantsList, persistRestaurants]
  );

  const updateRestaurant = useCallback(
    (id: string, updates: Partial<RestaurantItem>) => {
      persistRestaurants(
        restaurantsList.map((r) => (r.id === id ? { ...r, ...updates } : r))
      );
    },
    [restaurantsList, persistRestaurants]
  );

  const removeRestaurant = useCallback(
    (id: string) => {
      persistRestaurants(restaurantsList.filter((r) => r.id !== id));
    },
    [restaurantsList, persistRestaurants]
  );

  const toggleRestaurantVisited = useCallback(
    (id: string) => {
      persistRestaurants(
        restaurantsList.map((r) => (r.id === id ? { ...r, visited: !r.visited } : r))
      );
    },
    [restaurantsList, persistRestaurants]
  );

  // ---------------------------------------------------------------------------
  // Saved Items
  // ---------------------------------------------------------------------------

  const setSavedItems = useCallback(
    (items: SavedItem[]) => persistSaved(items),
    [persistSaved]
  );

  const removeSavedItem = useCallback(
    (id: string) => persistSaved(savedItems.filter((i) => i.id !== id)),
    [savedItems, persistSaved]
  );

  const addSavedItemToList = useCallback(
    (itemId: string, category: ListCategory) => {
      const item = savedItems.find((i) => i.id === itemId);
      if (!item) return;
      const now = new Date().toISOString();

      switch (category) {
        case 'grocery':
          addGroceryItem({ name: item.title, quantity: 1, unit: '', isStaple: false });
          break;
        case 'restaurants':
          addRestaurant({
            name: item.title,
            cuisine: item.description,
            location: '',
            notes: item.sourceReason,
            url: item.url,
          });
          break;
        case 'places':
          addToPlacesList({
            name: item.title,
            location: item.description || null,
            reason: item.sourceReason,
            visited: false,
            addedAt: now,
          });
          break;
        case 'watchlist':
          addToWatchlist({
            name: item.title,
            works: [item.description].filter(Boolean),
            imdbUrl: item.url.includes('imdb') ? item.url : null,
            addedAt: now,
          });
          break;
        case 'reading':
          addToReadingList({
            name: item.title,
            works: [item.description].filter(Boolean),
            kindleUrl: null,
            addedAt: now,
          });
          break;
        case 'music':
          addToSpotifyList({
            name: item.title,
            spotifyUrl: item.url.includes('spotify') ? item.url : null,
            addedAt: now,
          });
          break;
        case 'recipes':
          addRecipe({
            name: item.title,
            sourceUrl: item.url,
            ingredients: [],
            notes: item.sourceReason,
          });
          break;
        default:
          break;
      }

      persistSaved(
        savedItems.map((i) =>
          i.id === itemId
            ? { ...i, addedToLists: [...i.addedToLists, category], category }
            : i
        )
      );
    },
    [
      savedItems,
      persistSaved,
      addGroceryItem,
      addRestaurant,
      addToPlacesList,
      addToWatchlist,
      addToReadingList,
      addToSpotifyList,
      addRecipe,
    ]
  );

  // ---------------------------------------------------------------------------
  // Research History (localStorage only — high-frequency, large payloads)
  // ---------------------------------------------------------------------------

  const addToHistory = useCallback(
    (result: ResearchResult) => {
      const newHistory: HistoryItem[] = [
        {
          name: result.name,
          category: result.category,
          timestamp: new Date().toISOString(),
          cachedResult: result,
        },
        ...researchHistory.filter((h) => h.name !== result.name),
      ].slice(0, 50);
      persistHistory(newHistory);
    },
    [researchHistory, persistHistory]
  );

  const clearHistory = useCallback(() => persistHistory([]), [persistHistory]);

  const getHistoryItem = useCallback(
    (name: string) => researchHistory.find((h) => h.name === name),
    [researchHistory]
  );

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  return (
    <ListsContext.Provider
      value={{
        spotifyList,
        readingList,
        watchlist,
        placesList,
        groceryList,
        recipesList,
        restaurantsList,
        savedItems,
        researchHistory,
        addToSpotifyList,
        removeFromSpotifyList,
        addToReadingList,
        removeFromReadingList,
        addToWatchlist,
        removeFromWatchlist,
        addToPlacesList,
        removeFromPlacesList,
        togglePlaceVisited,
        addGroceryItem,
        updateGroceryItem,
        removeGroceryItem,
        toggleGroceryItem,
        saveGroceryList,
        clearCheckedGroceryItems,
        addRecipe,
        updateRecipe,
        removeRecipe,
        addRecipeIngredientsToGrocery,
        addRestaurant,
        updateRestaurant,
        removeRestaurant,
        toggleRestaurantVisited,
        setSavedItems,
        removeSavedItem,
        addSavedItemToList,
        addToHistory,
        clearHistory,
        getHistoryItem,
      }}
    >
      {children}
    </ListsContext.Provider>
  );
};

export const useLists = (): ListsContextType => {
  const ctx = useContext(ListsContext);
  if (!ctx) throw new Error('useLists must be used within a ListsProvider');
  return ctx;
};

export default ListsContext;
