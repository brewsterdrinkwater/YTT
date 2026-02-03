import React, { useState } from 'react';
import { researchService } from '../../services/researchService';
import { ScrapedContentType } from '../../types/research';
import Card from '../common/Card';
import Button from '../common/Button';
import { Input } from '../common/Input';

// Scraper prompt for Claude
const buildScraperPrompt = (url: string): string => `You are a web content analyzer. Analyze the content from this URL and extract useful information.

URL: ${url}

Determine what type of content this is and extract items accordingly. Return ONLY valid JSON (no markdown, no backticks).

Return this exact JSON structure:
{
  "type": "recipe" | "restaurant" | "book" | "movie" | "article" | "unknown",
  "title": "Title of the content",
  "items": [
    {
      "name": "Item name",
      "quantity": 2,
      "unit": "cups",
      "url": "https://link-if-applicable.com",
      "notes": "Any relevant notes"
    }
  ],
  "sourceUrl": "${url}"
}

RULES BY TYPE:
- recipe: Extract ingredients with quantities and units. "name" is ingredient, include quantity/unit.
- restaurant: Extract restaurant names with locations. "name" is restaurant, "notes" for cuisine type, "url" for website/yelp/google.
- book: Extract book titles and authors. "name" is "Title by Author", "url" for purchase link.
- movie: Extract movie/show titles. "name" is title, "notes" for year/genre, "url" for streaming link.
- article: Extract key points or recommendations. "name" is the point, "notes" for context.
- unknown: Return empty items array.

For recipes specifically:
- Parse ingredient lists carefully
- Convert fractions to decimals (1/2 = 0.5, 1/4 = 0.25)
- Standardize units (tablespoon, teaspoon, cup, oz, lb, etc.)
- Include all ingredients even if quantity is not specified (use 1 as default)`;

interface ScrapedResult {
  type: ScrapedContentType;
  title: string;
  items: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    url?: string;
    notes?: string;
  }>;
  sourceUrl: string;
}

const WebScraper: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [result, setResult] = useState<ScrapedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  const apiKey = researchService.getApiKey();

  const doScrape = async () => {
    if (!url.trim()) return;

    if (!apiKey) {
      setError('Please add your Claude API key in the Deep Research Agent settings first.');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setAddedMessage(null);
    setLoadingStatus('Fetching and analyzing content...');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: buildScraperPrompt(url) }],
        }),
      });

      setLoadingStatus('Processing results...');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
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
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as ScrapedResult;
        setResult(parsed);
      } else {
        throw new Error('Could not parse scraper results');
      }
    } catch (e) {
      console.error('Scraping failed:', e);
      setError(e instanceof Error ? e.message : 'Scraping failed. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const addToList = () => {
    if (!result) return;

    let message = '';

    switch (result.type) {
      case 'recipe':
        // Add ingredients to grocery list
        result.items.forEach((item) => {
          researchService.addGroceryItem({
            name: item.name,
            quantity: item.quantity || 1,
            unit: item.unit || '',
            isStaple: false,
          });
        });
        // Also save as a recipe
        researchService.addRecipe({
          name: result.title,
          ingredients: result.items.map((item) => ({
            name: item.name,
            quantity: item.quantity || 1,
            unit: item.unit || '',
          })),
          sourceUrl: result.sourceUrl,
        });
        message = `Added ${result.items.length} ingredients to grocery list and saved recipe "${result.title}"`;
        break;

      case 'restaurant':
        result.items.forEach((item) => {
          researchService.addRestaurant({
            name: item.name,
            location: item.notes,
            url: item.url,
            notes: item.notes,
          });
        });
        message = `Added ${result.items.length} restaurants to your list`;
        break;

      case 'book':
        result.items.forEach((item) => {
          researchService.addToReadingList({
            name: item.name,
            works: [],
            kindleUrl: item.url || null,
            addedAt: new Date().toISOString(),
          });
        });
        message = `Added ${result.items.length} books to reading list`;
        break;

      case 'movie':
        result.items.forEach((item) => {
          researchService.addToWatchlist({
            name: item.name,
            works: item.notes ? [item.notes] : [],
            imdbUrl: item.url || null,
            addedAt: new Date().toISOString(),
          });
        });
        message = `Added ${result.items.length} titles to watchlist`;
        break;

      default:
        message = 'Content type not supported for auto-adding';
    }

    setAddedMessage(message);
  };

  const getTypeIcon = (type: ScrapedContentType) => {
    switch (type) {
      case 'recipe':
        return '🍳';
      case 'restaurant':
        return '🍽️';
      case 'book':
        return '📚';
      case 'movie':
        return '🎬';
      case 'article':
        return '📰';
      default:
        return '❓';
    }
  };

  const getTypeLabel = (type: ScrapedContentType) => {
    switch (type) {
      case 'recipe':
        return 'Recipe';
      case 'restaurant':
        return 'Restaurants';
      case 'book':
        return 'Books';
      case 'movie':
        return 'Movies/Shows';
      case 'article':
        return 'Article';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🔗</span>
        <div>
          <h3 className="font-semibold text-gray-900">Web Scraper</h3>
          <p className="text-xs text-gray-500">Paste a URL to extract recipes, restaurants, books, or movies</p>
        </div>
      </div>

      {/* URL Input */}
      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="https://example.com/recipe..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && doScrape()}
          className="flex-1"
        />
        <Button onClick={doScrape} disabled={isLoading || !url.trim()}>
          {isLoading ? '...' : 'Scrape'}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-gray-600">{loadingStatus}</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {addedMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-700">{addedMessage}</p>
        </div>
      )}

      {/* Results */}
      {result && !isLoading && (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getTypeIcon(result.type)}</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                {getTypeLabel(result.type)}
              </span>
            </div>
            <h4 className="font-bold text-gray-900">{result.title}</h4>
            <a
              href={result.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline truncate block mt-1"
            >
              {result.sourceUrl}
            </a>
          </div>

          {/* Items List */}
          {result.items.length > 0 && (
            <div>
              <h5 className="font-semibold text-sm text-gray-700 mb-2">
                Found {result.items.length} items:
              </h5>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {result.items.map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded p-2 text-sm flex justify-between items-start">
                    <div>
                      <strong>{item.name}</strong>
                      {item.quantity && item.unit && (
                        <span className="text-gray-500 ml-2">
                          ({item.quantity} {item.unit})
                        </span>
                      )}
                      {item.notes && <p className="text-xs text-gray-400">{item.notes}</p>}
                    </div>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline ml-2"
                      >
                        Link →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          {result.type !== 'unknown' && result.type !== 'article' && result.items.length > 0 && (
            <Button onClick={addToList} variant="primary" className="w-full">
              {result.type === 'recipe' && '🛒 Add Ingredients to Grocery List'}
              {result.type === 'restaurant' && '📍 Add to Restaurant List'}
              {result.type === 'book' && '📚 Add to Reading List'}
              {result.type === 'movie' && '🎬 Add to Watchlist'}
            </Button>
          )}

          {/* Clear Button */}
          <button
            onClick={() => {
              setResult(null);
              setUrl('');
              setAddedMessage(null);
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
          >
            Clear & Start Over
          </button>
        </div>
      )}

      {/* Help Text */}
      {!result && !isLoading && (
        <div className="text-center py-4 text-gray-500 text-sm">
          <p className="mb-2">Try pasting a URL like:</p>
          <ul className="text-xs space-y-1">
            <li>• Recipe page → Adds ingredients to grocery list</li>
            <li>• Restaurant article → Adds restaurants to your list</li>
            <li>• Book recommendations → Adds to reading list</li>
            <li>• Movie/TV lists → Adds to watchlist</li>
          </ul>
        </div>
      )}
    </Card>
  );
};

export default WebScraper;
