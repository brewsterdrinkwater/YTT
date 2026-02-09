import { storageService } from './storageService';
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

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Research service for managing lists and history
export const researchService = {
  // Spotify List
  getSpotifyList: (): SpotifyListItem[] => {
    return storageService.get<SpotifyListItem[]>(STORAGE_KEYS.RESEARCH_SPOTIFY_LIST) || [];
  },

  saveSpotifyList: (list: SpotifyListItem[]): void => {
    storageService.set(STORAGE_KEYS.RESEARCH_SPOTIFY_LIST, list);
  },

  addToSpotifyList: (item: SpotifyListItem): SpotifyListItem[] => {
    const list = researchService.getSpotifyList();
    const newList = [item, ...list.filter((s) => s.name !== item.name)];
    researchService.saveSpotifyList(newList);
    return newList;
  },

  removeFromSpotifyList: (name: string): SpotifyListItem[] => {
    const newList = researchService.getSpotifyList().filter((s) => s.name !== name);
    researchService.saveSpotifyList(newList);
    return newList;
  },

  // Reading List
  getReadingList: (): ReadingListItem[] => {
    return storageService.get<ReadingListItem[]>(STORAGE_KEYS.RESEARCH_READING_LIST) || [];
  },

  saveReadingList: (list: ReadingListItem[]): void => {
    storageService.set(STORAGE_KEYS.RESEARCH_READING_LIST, list);
  },

  addToReadingList: (item: ReadingListItem): ReadingListItem[] => {
    const list = researchService.getReadingList();
    const newList = [item, ...list.filter((r) => r.name !== item.name)];
    researchService.saveReadingList(newList);
    return newList;
  },

  removeFromReadingList: (name: string): ReadingListItem[] => {
    const newList = researchService.getReadingList().filter((r) => r.name !== name);
    researchService.saveReadingList(newList);
    return newList;
  },

  // Watchlist
  getWatchlist: (): WatchlistItem[] => {
    return storageService.get<WatchlistItem[]>(STORAGE_KEYS.RESEARCH_WATCHLIST) || [];
  },

  saveWatchlist: (list: WatchlistItem[]): void => {
    storageService.set(STORAGE_KEYS.RESEARCH_WATCHLIST, list);
  },

  addToWatchlist: (item: WatchlistItem): WatchlistItem[] => {
    const list = researchService.getWatchlist();
    const newList = [item, ...list.filter((w) => w.name !== item.name)];
    researchService.saveWatchlist(newList);
    return newList;
  },

  removeFromWatchlist: (name: string): WatchlistItem[] => {
    const newList = researchService.getWatchlist().filter((w) => w.name !== name);
    researchService.saveWatchlist(newList);
    return newList;
  },

  // Places List
  getPlacesList: (): PlacesListItem[] => {
    return storageService.get<PlacesListItem[]>(STORAGE_KEYS.RESEARCH_PLACES_LIST) || [];
  },

  savePlacesList: (list: PlacesListItem[]): void => {
    storageService.set(STORAGE_KEYS.RESEARCH_PLACES_LIST, list);
  },

  addToPlacesList: (item: PlacesListItem): PlacesListItem[] => {
    const list = researchService.getPlacesList();
    const newList = [{ ...item, visited: item.visited ?? false }, ...list.filter((p) => p.name !== item.name)];
    researchService.savePlacesList(newList);
    return newList;
  },

  removeFromPlacesList: (name: string): PlacesListItem[] => {
    const newList = researchService.getPlacesList().filter((p) => p.name !== name);
    researchService.savePlacesList(newList);
    return newList;
  },

  togglePlaceVisited: (name: string): PlacesListItem[] => {
    const list = researchService.getPlacesList();
    const newList = list.map((place) =>
      place.name === name ? { ...place, visited: !place.visited } : place
    );
    researchService.savePlacesList(newList);
    return newList;
  },

  // Research History
  getHistory: (): HistoryItem[] => {
    return storageService.get<HistoryItem[]>(STORAGE_KEYS.RESEARCH_HISTORY) || [];
  },

  saveHistory: (history: HistoryItem[]): void => {
    storageService.set(STORAGE_KEYS.RESEARCH_HISTORY, history);
  },

  addToHistory: (result: ResearchResult): HistoryItem[] => {
    const history = researchService.getHistory();
    const newHistory: HistoryItem[] = [
      {
        name: result.name,
        category: result.category,
        timestamp: new Date().toISOString(),
        cachedResult: result,
      },
      ...history.filter((h) => h.name !== result.name),
    ].slice(0, 50); // Keep last 50 searches
    researchService.saveHistory(newHistory);
    return newHistory;
  },

  getHistoryItem: (name: string): HistoryItem | undefined => {
    const history = researchService.getHistory();
    return history.find((h) => h.name === name);
  },

  clearHistory: (): void => {
    researchService.saveHistory([]);
  },

  // API Key
  getApiKey: (): string => {
    return storageService.get<string>(STORAGE_KEYS.RESEARCH_API_KEY) || '';
  },

  saveApiKey: (key: string): void => {
    storageService.set(STORAGE_KEYS.RESEARCH_API_KEY, key);
  },

  // Grocery List
  getGroceryList: (): GroceryItem[] => {
    return storageService.get<GroceryItem[]>(STORAGE_KEYS.GROCERY_LIST) || [];
  },

  saveGroceryList: (list: GroceryItem[]): void => {
    storageService.set(STORAGE_KEYS.GROCERY_LIST, list);
  },

  addGroceryItem: (item: Omit<GroceryItem, 'id' | 'addedAt' | 'checked'>): GroceryItem[] => {
    const list = researchService.getGroceryList();
    const newItem: GroceryItem = {
      ...item,
      id: generateId(),
      checked: false,
      addedAt: new Date().toISOString(),
    };
    const newList = [newItem, ...list];
    researchService.saveGroceryList(newList);
    return newList;
  },

  updateGroceryItem: (id: string, updates: Partial<GroceryItem>): GroceryItem[] => {
    const list = researchService.getGroceryList();
    const newList = list.map((item) => (item.id === id ? { ...item, ...updates } : item));
    researchService.saveGroceryList(newList);
    return newList;
  },

  removeGroceryItem: (id: string): GroceryItem[] => {
    const newList = researchService.getGroceryList().filter((item) => item.id !== id);
    researchService.saveGroceryList(newList);
    return newList;
  },

  toggleGroceryItem: (id: string): GroceryItem[] => {
    const list = researchService.getGroceryList();
    const newList = list.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
    researchService.saveGroceryList(newList);
    return newList;
  },

  clearCheckedGroceryItems: (): GroceryItem[] => {
    const list = researchService.getGroceryList();
    const newList = list.filter((item) => !item.checked || item.isStaple);
    // Reset staple items to unchecked
    const resetList = newList.map((item) => (item.isStaple ? { ...item, checked: false } : item));
    researchService.saveGroceryList(resetList);
    return resetList;
  },

  getStapleItems: (): GroceryItem[] => {
    return researchService.getGroceryList().filter((item) => item.isStaple);
  },

  addStaplesToList: (): GroceryItem[] => {
    const list = researchService.getGroceryList();
    const staples = list.filter((item) => item.isStaple);
    // Reset checked status for staples
    const newList = list.map((item) => (item.isStaple ? { ...item, checked: false } : item));
    researchService.saveGroceryList(newList);
    return newList;
  },

  // Recipes List
  getRecipes: (): Recipe[] => {
    return storageService.get<Recipe[]>(STORAGE_KEYS.RECIPES_LIST) || [];
  },

  saveRecipes: (list: Recipe[]): void => {
    storageService.set(STORAGE_KEYS.RECIPES_LIST, list);
  },

  addRecipe: (recipe: Omit<Recipe, 'id' | 'addedAt'>): Recipe[] => {
    const list = researchService.getRecipes();
    const newRecipe: Recipe = {
      ...recipe,
      id: generateId(),
      addedAt: new Date().toISOString(),
    };
    const newList = [newRecipe, ...list];
    researchService.saveRecipes(newList);
    return newList;
  },

  updateRecipe: (id: string, updates: Partial<Recipe>): Recipe[] => {
    const list = researchService.getRecipes();
    const newList = list.map((recipe) => (recipe.id === id ? { ...recipe, ...updates } : recipe));
    researchService.saveRecipes(newList);
    return newList;
  },

  removeRecipe: (id: string): Recipe[] => {
    const newList = researchService.getRecipes().filter((recipe) => recipe.id !== id);
    researchService.saveRecipes(newList);
    return newList;
  },

  addRecipeIngredientsToGrocery: (recipeId: string): GroceryItem[] => {
    const recipes = researchService.getRecipes();
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return researchService.getGroceryList();

    let groceryList = researchService.getGroceryList();
    recipe.ingredients.forEach((ingredient) => {
      // Check if item already exists
      const existingIndex = groceryList.findIndex(
        (g) => g.name.toLowerCase() === ingredient.name.toLowerCase()
      );
      if (existingIndex === -1) {
        const newItem: GroceryItem = {
          id: generateId(),
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          checked: false,
          isStaple: false,
          addedAt: new Date().toISOString(),
        };
        groceryList = [newItem, ...groceryList];
      }
    });
    researchService.saveGroceryList(groceryList);
    return groceryList;
  },

  // Restaurant List
  getRestaurants: (): RestaurantItem[] => {
    return storageService.get<RestaurantItem[]>(STORAGE_KEYS.RESTAURANTS_LIST) || [];
  },

  saveRestaurants: (list: RestaurantItem[]): void => {
    storageService.set(STORAGE_KEYS.RESTAURANTS_LIST, list);
  },

  addRestaurant: (restaurant: Omit<RestaurantItem, 'id' | 'addedAt' | 'visited'>): RestaurantItem[] => {
    const list = researchService.getRestaurants();
    const newRestaurant: RestaurantItem = {
      ...restaurant,
      id: generateId(),
      visited: false,
      addedAt: new Date().toISOString(),
    };
    const newList = [newRestaurant, ...list];
    researchService.saveRestaurants(newList);
    return newList;
  },

  updateRestaurant: (id: string, updates: Partial<RestaurantItem>): RestaurantItem[] => {
    const list = researchService.getRestaurants();
    const newList = list.map((restaurant) =>
      restaurant.id === id ? { ...restaurant, ...updates } : restaurant
    );
    researchService.saveRestaurants(newList);
    return newList;
  },

  removeRestaurant: (id: string): RestaurantItem[] => {
    const newList = researchService.getRestaurants().filter((restaurant) => restaurant.id !== id);
    researchService.saveRestaurants(newList);
    return newList;
  },

  toggleRestaurantVisited: (id: string): RestaurantItem[] => {
    const list = researchService.getRestaurants();
    const newList = list.map((restaurant) =>
      restaurant.id === id ? { ...restaurant, visited: !restaurant.visited } : restaurant
    );
    researchService.saveRestaurants(newList);
    return newList;
  },

  // Get all lists summary for dashboard
  getAllListsCounts: () => {
    return {
      spotify: researchService.getSpotifyList().length,
      reading: researchService.getReadingList().length,
      watchlist: researchService.getWatchlist().length,
      places: researchService.getPlacesList().length,
      history: researchService.getHistory().length,
      grocery: researchService.getGroceryList().length,
      recipes: researchService.getRecipes().length,
      restaurants: researchService.getRestaurants().length,
    };
  },
};
