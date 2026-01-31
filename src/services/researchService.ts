import { storageService } from './storageService';
import { STORAGE_KEYS } from '../constants/config';
import {
  SpotifyListItem,
  ReadingListItem,
  WatchlistItem,
  PlacesListItem,
  HistoryItem,
  ResearchResult,
} from '../types/research';

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
    const newList = [item, ...list.filter((p) => p.name !== item.name)];
    researchService.savePlacesList(newList);
    return newList;
  },

  removeFromPlacesList: (name: string): PlacesListItem[] => {
    const newList = researchService.getPlacesList().filter((p) => p.name !== name);
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

  // Get all lists summary for dashboard
  getAllListsCounts: () => {
    return {
      spotify: researchService.getSpotifyList().length,
      reading: researchService.getReadingList().length,
      watchlist: researchService.getWatchlist().length,
      places: researchService.getPlacesList().length,
      history: researchService.getHistory().length,
    };
  },
};
