import { storageService } from './storageService';
import { researchService } from './researchService';
import { STORAGE_KEYS, API_CONFIG } from '../constants/config';

// List types that content can be categorized into
export type ListCategory =
  | 'grocery'
  | 'recipes'
  | 'restaurants'
  | 'places'
  | 'watchlist'
  | 'reading'
  | 'music'
  | 'uncategorized';

// A saved item with metadata
export interface SavedItem {
  id: string;
  url: string;
  title: string;
  description: string;
  source: string; // instagram, youtube, website, etc.
  sourceReason: string; // why it was saved / who recommended
  thumbnail?: string;
  category: ListCategory;
  addedToLists: ListCategory[]; // which lists it was added to
  savedAt: string;
  processed: boolean;
  needsUserInput: boolean; // true if LLM couldn't auto-categorize
}

// Result from LLM analysis
export interface AnalysisResult {
  title: string;
  description: string;
  source: string;
  sourceReason: string;
  thumbnail?: string;
  suggestedCategory: ListCategory;
  confidence: 'high' | 'medium' | 'low';
  extractedItems: ExtractedItem[];
}

// Items extracted from the URL (recipes might have multiple ingredients, etc.)
export interface ExtractedItem {
  type: ListCategory;
  name: string;
  details?: string;
  quantity?: string;
  unit?: string;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Detect source from URL
const detectSource = (url: string): string => {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes('instagram')) return 'instagram';
  if (hostname.includes('youtube') || hostname.includes('youtu.be')) return 'youtube';
  if (hostname.includes('tiktok')) return 'tiktok';
  if (hostname.includes('twitter') || hostname.includes('x.com')) return 'twitter';
  if (hostname.includes('spotify')) return 'spotify';
  if (hostname.includes('goodreads')) return 'goodreads';
  if (hostname.includes('imdb')) return 'imdb';
  if (hostname.includes('yelp')) return 'yelp';
  if (hostname.includes('tripadvisor')) return 'tripadvisor';
  if (hostname.includes('allrecipes') || hostname.includes('recipe')) return 'recipe-site';
  return 'website';
};

// Build the analysis prompt
const buildAnalysisPrompt = (url: string, source: string): string => {
  return `Analyze this ${source} URL and extract relevant information for a personal life-tracking app.

URL: ${url}

The app has these list categories:
- grocery: Food items to buy
- recipes: Recipes with ingredients
- restaurants: Restaurants, cafes, bars to visit
- places: Travel destinations, attractions, landmarks
- watchlist: Movies, TV shows, documentaries
- reading: Books, articles, blogs
- music: Songs, albums, artists, playlists
- uncategorized: If none of the above fit

Please analyze the content and respond with JSON:
{
  "title": "Clear, concise title",
  "description": "Brief description of what this is",
  "sourceReason": "Why this might have been saved (e.g., 'Food recommendation from Instagram', 'Travel inspiration video')",
  "suggestedCategory": "one of the categories above",
  "confidence": "high/medium/low - how confident are you this is the right category?",
  "extractedItems": [
    {
      "type": "category",
      "name": "item name",
      "details": "optional details",
      "quantity": "for groceries",
      "unit": "for groceries"
    }
  ]
}

For recipes, extract individual ingredients as grocery items.
For restaurant/place videos, extract the specific venue.
For watchlists, extract the movie/show name.
For music, extract artist and song/album.

If you can't determine the category with reasonable confidence, use "uncategorized" and set confidence to "low".`;
};

export const quickShareService = {
  // Get all saved items
  getSavedItems: (): SavedItem[] => {
    return storageService.get<SavedItem[]>(STORAGE_KEYS.SAVED_ITEMS) || [];
  },

  // Save items to storage
  saveSavedItems: (items: SavedItem[]): void => {
    storageService.set(STORAGE_KEYS.SAVED_ITEMS, items);
  },

  // Analyze a URL using LLM
  analyzeUrl: async (url: string, apiKey: string): Promise<AnalysisResult> => {
    const source = detectSource(url);

    const response = await fetch(API_CONFIG.CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [
          {
            role: 'user',
            content: buildAnalysisPrompt(url, source),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Extract text from response
    let fullText = '';
    if (data.content) {
      for (const block of data.content) {
        if (block.type === 'text') {
          fullText += block.text;
        }
      }
    }

    // Parse JSON from response
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse analysis result');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title: parsed.title || 'Untitled',
      description: parsed.description || '',
      source,
      sourceReason: parsed.sourceReason || `Saved from ${source}`,
      thumbnail: parsed.thumbnail,
      suggestedCategory: parsed.suggestedCategory || 'uncategorized',
      confidence: parsed.confidence || 'low',
      extractedItems: parsed.extractedItems || [],
    };
  },

  // Quick save a URL (creates pending item, analyzes in background)
  quickSave: async (
    url: string,
    apiKey: string
  ): Promise<{ item: SavedItem; analysis: AnalysisResult }> => {
    const source = detectSource(url);

    // Create initial saved item
    const item: SavedItem = {
      id: generateId(),
      url,
      title: 'Analyzing...',
      description: '',
      source,
      sourceReason: '',
      category: 'uncategorized',
      addedToLists: [],
      savedAt: new Date().toISOString(),
      processed: false,
      needsUserInput: false,
    };

    // Save immediately
    const items = quickShareService.getSavedItems();
    quickShareService.saveSavedItems([item, ...items]);

    // Analyze
    const analysis = await quickShareService.analyzeUrl(url, apiKey);

    // Update item with analysis
    item.title = analysis.title;
    item.description = analysis.description;
    item.sourceReason = analysis.sourceReason;
    item.thumbnail = analysis.thumbnail;
    item.category = analysis.suggestedCategory;
    item.processed = true;
    item.needsUserInput = analysis.confidence === 'low';

    // Save updated item
    const updatedItems = quickShareService.getSavedItems().map((i) =>
      i.id === item.id ? item : i
    );
    quickShareService.saveSavedItems(updatedItems);

    return { item, analysis };
  },

  // Add a saved item to a specific list
  addToList: (itemId: string, category: ListCategory): void => {
    const items = quickShareService.getSavedItems();
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const now = new Date().toISOString();

    // Add to the appropriate list based on category
    switch (category) {
      case 'grocery':
        researchService.addGroceryItem({
          name: item.title,
          quantity: 1,
          unit: '',
          isStaple: false,
        });
        break;
      case 'restaurants':
        researchService.addRestaurant({
          name: item.title,
          cuisine: item.description,
          location: '',
          notes: item.sourceReason,
          url: item.url,
        });
        break;
      case 'places':
        researchService.addToPlacesList({
          name: item.title,
          location: item.description || null,
          reason: item.sourceReason,
          visited: false,
          addedAt: now,
        });
        break;
      case 'watchlist':
        researchService.addToWatchlist({
          name: item.title,
          works: [item.description].filter(Boolean),
          imdbUrl: item.url.includes('imdb') ? item.url : null,
          addedAt: now,
        });
        break;
      case 'reading':
        researchService.addToReadingList({
          name: item.title,
          works: [item.description].filter(Boolean),
          kindleUrl: null,
          addedAt: now,
        });
        break;
      case 'music':
        researchService.addToSpotifyList({
          name: item.title,
          spotifyUrl: item.url.includes('spotify') ? item.url : null,
          addedAt: now,
        });
        break;
      case 'recipes':
        researchService.addRecipe({
          name: item.title,
          sourceUrl: item.url,
          ingredients: [],
          notes: item.sourceReason,
        });
        break;
    }

    // Update saved item
    const updatedItems = items.map((i) =>
      i.id === itemId
        ? { ...i, addedToLists: [...i.addedToLists, category], category }
        : i
    );
    quickShareService.saveSavedItems(updatedItems);
  },

  // Add extracted items to lists (for batch operations like recipe ingredients)
  addExtractedItems: (extractedItems: ExtractedItem[]): void => {
    const now = new Date().toISOString();

    extractedItems.forEach((item) => {
      switch (item.type) {
        case 'grocery':
          researchService.addGroceryItem({
            name: item.name,
            quantity: parseInt(item.quantity || '1', 10) || 1,
            unit: item.unit || '',
            isStaple: false,
          });
          break;
        case 'restaurants':
          researchService.addRestaurant({
            name: item.name,
            cuisine: item.details || '',
            location: '',
            notes: '',
          });
          break;
        case 'places':
          researchService.addToPlacesList({
            name: item.name,
            location: item.details || null,
            reason: '',
            visited: false,
            addedAt: now,
          });
          break;
        case 'watchlist':
          researchService.addToWatchlist({
            name: item.name,
            works: item.details ? [item.details] : [],
            imdbUrl: null,
            addedAt: now,
          });
          break;
        case 'reading':
          researchService.addToReadingList({
            name: item.name,
            works: item.details ? [item.details] : [],
            kindleUrl: null,
            addedAt: now,
          });
          break;
        case 'music':
          researchService.addToSpotifyList({
            name: item.name,
            spotifyUrl: null,
            addedAt: now,
          });
          break;
      }
    });
  },

  // Update a saved item's category
  updateCategory: (itemId: string, category: ListCategory): void => {
    const items = quickShareService.getSavedItems();
    const updatedItems = items.map((i) =>
      i.id === itemId ? { ...i, category, needsUserInput: false } : i
    );
    quickShareService.saveSavedItems(updatedItems);
  },

  // Remove a saved item
  removeSavedItem: (itemId: string): void => {
    const items = quickShareService.getSavedItems();
    quickShareService.saveSavedItems(items.filter((i) => i.id !== itemId));
  },

  // Get items that need user input
  getItemsNeedingInput: (): SavedItem[] => {
    return quickShareService.getSavedItems().filter((i) => i.needsUserInput);
  },

  // Get recent saved items (for dashboard widget)
  getRecentItems: (limit = 5): SavedItem[] => {
    return quickShareService.getSavedItems().slice(0, limit);
  },

  // Batch save multiple URLs
  batchSave: async (
    urls: string[],
    apiKey: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<SavedItem[]> => {
    const results: SavedItem[] = [];

    for (let i = 0; i < urls.length; i++) {
      try {
        const { item } = await quickShareService.quickSave(urls[i], apiKey);
        results.push(item);
      } catch (error) {
        // Create a failed item
        const failedItem: SavedItem = {
          id: generateId(),
          url: urls[i],
          title: 'Failed to analyze',
          description: String(error),
          source: detectSource(urls[i]),
          sourceReason: '',
          category: 'uncategorized',
          addedToLists: [],
          savedAt: new Date().toISOString(),
          processed: true,
          needsUserInput: true,
        };
        results.push(failedItem);
      }

      onProgress?.(i + 1, urls.length);
    }

    return results;
  },
};
