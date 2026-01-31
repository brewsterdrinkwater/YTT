import React, { useState, useEffect, useCallback } from 'react';
import { researchService } from '../../services/researchService';
import {
  ResearchResult,
  SpotifyListItem,
  ReadingListItem,
  WatchlistItem,
  PlacesListItem,
  HistoryItem,
} from '../../types/research';
import Card from '../common/Card';
import Button from '../common/Button';
import { Input } from '../common/Input';

// Research prompt template
const buildResearchPrompt = (name: string): string => `You are a meticulous research assistant. Research "${name}" and return ONLY valid JSON (no markdown, no backticks, no explanation).

CRITICAL RULES:
- Return ONLY the JSON object, nothing else
- Use null for unknown values, not "Unknown"
- For controversies, ONLY include if documented in credible sources with specific evidence
- Prioritize primary sources (interviews, speeches, official records) and reputable secondary sources (NYT, WaPo, Guardian, peer-reviewed work)
- NO AI-generated content, listicles, or fluff pieces
- Verify facts from multiple sources before including

Return this exact JSON structure:
{
  "name": "Full Official Name",
  "category": "artist|author|actor|leader|scientist|athlete|other",
  "birthYear": 1950,
  "deathYear": null,
  "birthPlace": "City, State/Country",
  "summary": "One paragraph bio focusing on significance",

  "leaderInfo": {
    "include": true,
    "highSchool": "School Name, Location",
    "college": "University Name, Degree, Year",
    "fraternity": "Fraternity name or null",
    "positions": ["List of major positions held"]
  },

  "famousFor": ["Top 3-5 most notable accomplishments"],

  "controversies": {
    "sexualMisconduct": [{"allegation": "description", "year": 2020, "source": "credible source", "outcome": "resolved/ongoing/etc"}],
    "domesticViolence": [],
    "racism": []
  },

  "timeline": [
    {"year": 1970, "title": "Work Title", "type": "album|book|film|role|achievement", "significance": "Why it matters", "link": "official or reputable URL"}
  ],

  "deepCuts": [
    {"title": "Underrated Work", "year": 1975, "why": "Why this deserves more attention", "link": "URL"}
  ],

  "sources": [
    {"title": "Source Title", "type": "primary|secondary", "url": "URL", "description": "What this source provides"}
  ],

  "actionLinks": {
    "spotify": "https://open.spotify.com/artist/... or null",
    "kindle": "https://www.amazon.com/kindle-dbs/... or null",
    "imdb": "https://www.imdb.com/name/... or null",
    "wikipedia": "https://en.wikipedia.org/wiki/..."
  }
}

If the person is not a leader/CEO/president, set leaderInfo.include to false and leave other leaderInfo fields null.
For timeline, include 8-15 significant works/events in chronological order.
For deepCuts, include 3-5 underrated or overlooked works.
For sources, include 5-8 high-quality primary and secondary sources only.`;

type TabType = 'search' | 'lists' | 'history' | 'settings';

interface DeepResearchAgentProps {
  defaultExpanded?: boolean;
  showHistoryOnly?: boolean;
  onHistoryItemClick?: (item: HistoryItem) => void;
}

const DeepResearchAgent: React.FC<DeepResearchAgentProps> = ({
  defaultExpanded = false,
  showHistoryOnly = false,
  onHistoryItemClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [searchName, setSearchName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(showHistoryOnly ? 'history' : 'search');

  // API Key state
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Lists state
  const [spotifyList, setSpotifyList] = useState<SpotifyListItem[]>([]);
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [placesList, setPlacesList] = useState<PlacesListItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Place input state
  const [placeReason, setPlaceReason] = useState('');

  // Load lists from storage on mount
  useEffect(() => {
    setSpotifyList(researchService.getSpotifyList());
    setReadingList(researchService.getReadingList());
    setWatchlist(researchService.getWatchlist());
    setPlacesList(researchService.getPlacesList());
    setHistory(researchService.getHistory());
    setApiKey(researchService.getApiKey());
  }, []);

  const saveApiKey = () => {
    researchService.saveApiKey(apiKey);
  };

  const doResearch = useCallback(async () => {
    if (!searchName.trim()) return;

    if (!apiKey) {
      setError('Please add your Claude API key in the Settings tab first.');
      setActiveTab('settings');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setLoadingStatus('Initiating deep research...');

    try {
      setLoadingStatus('Searching primary sources...');

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
          messages: [{ role: 'user', content: buildResearchPrompt(searchName) }],
        }),
      });

      setLoadingStatus('Analyzing and verifying sources...');

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

      setLoadingStatus('Formatting results...');

      // Parse JSON from response
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as ResearchResult;
        setResult(parsed);

        // Add to history with cached result
        const newHistory = researchService.addToHistory(parsed);
        setHistory(newHistory);
      } else {
        throw new Error('Could not parse research results');
      }
    } catch (e) {
      console.error('Research failed:', e);
      setError(e instanceof Error ? e.message : 'Research failed. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  }, [searchName, apiKey]);

  const loadFromHistory = (item: HistoryItem) => {
    if (item.cachedResult) {
      setResult(item.cachedResult);
      setSearchName(item.name);
      setActiveTab('search');
    } else {
      // If no cached result, trigger new search
      setSearchName(item.name);
      setActiveTab('search');
    }
    if (onHistoryItemClick) {
      onHistoryItemClick(item);
    }
  };

  const addToSpotify = () => {
    if (!result) return;
    const newList = researchService.addToSpotifyList({
      name: result.name,
      spotifyUrl: result.actionLinks?.spotify || null,
      addedAt: new Date().toISOString(),
    });
    setSpotifyList(newList);
  };

  const addToReading = () => {
    if (!result) return;
    const works =
      result.timeline?.filter((t) => t.type === 'book' || t.type === 'novel').map((t) => t.title) || [];
    const newList = researchService.addToReadingList({
      name: result.name,
      works,
      kindleUrl: result.actionLinks?.kindle || null,
      addedAt: new Date().toISOString(),
    });
    setReadingList(newList);
  };

  const addToWatchlist = () => {
    if (!result) return;
    const works =
      result.timeline?.filter((t) => t.type === 'film' || t.type === 'role' || t.type === 'tv').map((t) => t.title) ||
      [];
    const newList = researchService.addToWatchlist({
      name: result.name,
      works,
      imdbUrl: result.actionLinks?.imdb || null,
      addedAt: new Date().toISOString(),
    });
    setWatchlist(newList);
  };

  const addToPlaces = () => {
    if (!result) return;
    const newList = researchService.addToPlacesList({
      name: result.name,
      location: result.birthPlace,
      reason: placeReason || `Visit places associated with ${result.name}`,
      addedAt: new Date().toISOString(),
    });
    setPlacesList(newList);
    setPlaceReason('');
  };

  const removeFromList = (listType: 'spotify' | 'reading' | 'watchlist' | 'places', name: string) => {
    switch (listType) {
      case 'spotify':
        setSpotifyList(researchService.removeFromSpotifyList(name));
        break;
      case 'reading':
        setReadingList(researchService.removeFromReadingList(name));
        break;
      case 'watchlist':
        setWatchlist(researchService.removeFromWatchlist(name));
        break;
      case 'places':
        setPlacesList(researchService.removeFromPlacesList(name));
        break;
    }
  };

  const hasControversies =
    result &&
    ((result.controversies?.sexualMisconduct?.length || 0) > 0 ||
      (result.controversies?.domesticViolence?.length || 0) > 0 ||
      (result.controversies?.racism?.length || 0) > 0);

  const totalListItems = spotifyList.length + readingList.length + watchlist.length + placesList.length;

  // If showing history only mode (for Search page)
  if (showHistoryOnly) {
    return (
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🔍</span>
          <div>
            <h3 className="font-semibold text-gray-900">Research History</h3>
            <p className="text-xs text-gray-500">Click to view past research results</p>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-4">
            No research history yet. Use the Deep Research Agent to search for people.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map((item, i) => (
              <div
                key={i}
                onClick={() => loadFromHistory(item)}
                className="bg-gray-50 rounded p-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div>
                  <strong className="text-sm">{item.name}</strong>
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    {item.category}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-blue-500 text-sm">View →</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }

  // Collapsed view
  if (!isExpanded) {
    return (
      <Card className="mb-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsExpanded(true)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔍</span>
            <div>
              <h3 className="font-semibold text-gray-900">Deep Research Agent</h3>
              <p className="text-sm text-gray-500">Research people, track artists, books & films</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalListItems > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                {totalListItems} saved
              </span>
            )}
            <span className="text-gray-400">▼</span>
          </div>
        </div>
      </Card>
    );
  }

  // Expanded view
  return (
    <Card className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔍</span>
          <div>
            <h3 className="font-semibold text-gray-900">Deep Research Agent</h3>
            <p className="text-xs text-gray-500">Primary sources only. No fluff.</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600 p-1"
          aria-label="Collapse"
        >
          ▲
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {(['search', 'lists', 'history', 'settings'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab === 'search' && '🔍 Research'}
            {tab === 'lists' && `📋 Lists (${totalListItems})`}
            {tab === 'history' && `🕐 History (${history.length})`}
            {tab === 'settings' && '⚙️ Settings'}
          </button>
        ))}
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div>
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="Enter a name (e.g., Toni Morrison)"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && doResearch()}
              className="flex-1"
            />
            <Button onClick={doResearch} disabled={isLoading || !searchName.trim()}>
              {isLoading ? '...' : 'Go'}
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3" />
              <p className="text-sm text-gray-600">{loadingStatus}</p>
              <p className="text-xs text-gray-400 mt-1">This may take 15-30 seconds...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                <h4 className="text-xl font-bold text-gray-900">{result.name}</h4>
                <div className="flex flex-wrap gap-2 mt-2 text-sm">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium uppercase">
                    {result.category}
                  </span>
                  <span className="text-gray-600">
                    {result.birthYear}
                    {result.deathYear ? ` – ${result.deathYear}` : ' – Present'}
                  </span>
                  {result.birthPlace && <span className="text-gray-500">📍 {result.birthPlace}</span>}
                </div>
                {result.summary && <p className="mt-3 text-sm text-gray-700 leading-relaxed">{result.summary}</p>}
              </div>

              {/* Leader Info */}
              {result.leaderInfo?.include && (
                <div className="border-l-4 border-purple-400 pl-4">
                  <h5 className="font-semibold text-sm text-purple-700 mb-2">🎓 Education & Background</h5>
                  <ul className="text-sm space-y-1 text-gray-700">
                    {result.leaderInfo.highSchool && (
                      <li>
                        <strong>High School:</strong> {result.leaderInfo.highSchool}
                      </li>
                    )}
                    {result.leaderInfo.college && (
                      <li>
                        <strong>College:</strong> {result.leaderInfo.college}
                      </li>
                    )}
                    {result.leaderInfo.fraternity && (
                      <li>
                        <strong>Fraternity:</strong> {result.leaderInfo.fraternity}
                      </li>
                    )}
                    {result.leaderInfo.positions && result.leaderInfo.positions.length > 0 && (
                      <li>
                        <strong>Positions:</strong> {result.leaderInfo.positions.join(' → ')}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Famous For */}
              {result.famousFor && result.famousFor.length > 0 && (
                <div>
                  <h5 className="font-semibold text-sm text-blue-700 mb-2">⭐ Most Famous For</h5>
                  <ul className="text-sm space-y-1 text-gray-700">
                    {result.famousFor.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Controversies */}
              <div>
                <h5 className="font-semibold text-sm text-amber-700 mb-2">⚠️ Controversies</h5>
                {!hasControversies ? (
                  <p className="text-sm text-green-600 italic">No documented controversies found in credible sources.</p>
                ) : (
                  <div className="space-y-2">
                    {result.controversies?.sexualMisconduct?.map((c, i) => (
                      <div key={`sex-${i}`} className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                        <strong className="text-red-700">Sexual Misconduct ({c.year}):</strong> {c.allegation}
                        <br />
                        <span className="text-xs text-gray-500">
                          Source: {c.source} | Outcome: {c.outcome}
                        </span>
                      </div>
                    ))}
                    {result.controversies?.domesticViolence?.map((c, i) => (
                      <div key={`dv-${i}`} className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                        <strong className="text-red-700">Domestic Violence ({c.year}):</strong> {c.allegation}
                        <br />
                        <span className="text-xs text-gray-500">
                          Source: {c.source} | Outcome: {c.outcome}
                        </span>
                      </div>
                    ))}
                    {result.controversies?.racism?.map((c, i) => (
                      <div key={`race-${i}`} className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                        <strong className="text-red-700">Racism ({c.year}):</strong> {c.allegation}
                        <br />
                        <span className="text-xs text-gray-500">
                          Source: {c.source} | Outcome: {c.outcome}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timeline */}
              {result.timeline && result.timeline.length > 0 && (
                <div>
                  <h5 className="font-semibold text-sm text-blue-700 mb-2">📅 Timeline of Work</h5>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.timeline.map((item, i) => (
                      <div key={i} className="flex gap-3 text-sm border-b border-gray-100 pb-2">
                        <span className="font-bold text-purple-600 w-12">{item.year}</span>
                        <div className="flex-1">
                          <strong>{item.title}</strong>
                          <span className="text-gray-400 ml-1">({item.type})</span>
                          {item.significance && <p className="text-xs text-gray-500">{item.significance}</p>}
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline"
                            >
                              View →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deep Cuts */}
              {result.deepCuts && result.deepCuts.length > 0 && (
                <div>
                  <h5 className="font-semibold text-sm text-indigo-700 mb-2">💎 Deep Cuts (Underrated Work)</h5>
                  <div className="space-y-2">
                    {result.deepCuts.map((item, i) => (
                      <div key={i} className="bg-indigo-50 rounded p-2 text-sm">
                        <strong>{item.title}</strong> {item.year && `(${item.year})`}
                        <p className="text-indigo-700 text-xs mt-1">{item.why}</p>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline"
                          >
                            Explore →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {result.sources && result.sources.length > 0 && (
                <div>
                  <h5 className="font-semibold text-sm text-gray-700 mb-2">📚 Primary & Secondary Sources</h5>
                  <div className="space-y-1">
                    {result.sources.map((source, i) => (
                      <div key={i} className="text-sm flex items-start gap-2">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            source.type === 'primary' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {source.type}
                        </span>
                        <div>
                          <strong>{source.title}</strong>
                          {source.description && <span className="text-gray-500"> — {source.description}</span>}
                          {source.url && (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline ml-2"
                            >
                              Read →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                {(result.category === 'artist' || result.category === 'musician') && (
                  <Button variant="secondary" onClick={addToSpotify}>
                    🎵 Add to Listen List
                  </Button>
                )}
                {result.actionLinks?.spotify && (
                  <a
                    href={result.actionLinks.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
                  >
                    🔗 Open Spotify
                  </a>
                )}

                {result.category === 'author' && (
                  <Button variant="secondary" onClick={addToReading}>
                    📖 Add to Reading List
                  </Button>
                )}
                {result.actionLinks?.kindle && (
                  <a
                    href={result.actionLinks.kindle}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200"
                  >
                    📱 Kindle Store
                  </a>
                )}

                {result.category === 'actor' && (
                  <Button variant="secondary" onClick={addToWatchlist}>
                    🎬 Add to Watchlist
                  </Button>
                )}
                {result.actionLinks?.imdb && (
                  <a
                    href={result.actionLinks.imdb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                  >
                    🎥 IMDB
                  </a>
                )}

                {result.actionLinks?.wikipedia && (
                  <a
                    href={result.actionLinks.wikipedia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    📖 Wikipedia
                  </a>
                )}

                {/* Places to Visit */}
                <div className="w-full mt-2 pt-2 border-t border-gray-100">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Why visit? (e.g., birthplace, museum)"
                      value={placeReason}
                      onChange={(e) => setPlaceReason(e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <Button variant="secondary" onClick={addToPlaces}>
                      📍 Add Place
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lists Tab */}
      {activeTab === 'lists' && (
        <div className="space-y-6">
          {/* Spotify/Listen List */}
          <div>
            <h5 className="font-semibold text-green-700 mb-2">🎵 Listen List (Spotify)</h5>
            {spotifyList.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No artists added yet.</p>
            ) : (
              <div className="space-y-2">
                {spotifyList.map((item, i) => (
                  <div key={i} className="bg-green-50 rounded p-2 flex justify-between items-center">
                    <div>
                      <strong className="text-sm">{item.name}</strong>
                      {item.spotifyUrl && (
                        <a
                          href={item.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:underline ml-2"
                        >
                          Open →
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromList('spotify', item.name)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reading List */}
          <div>
            <h5 className="font-semibold text-orange-700 mb-2">📚 Reading List (Kindle)</h5>
            {readingList.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No authors added yet.</p>
            ) : (
              <div className="space-y-2">
                {readingList.map((item, i) => (
                  <div key={i} className="bg-orange-50 rounded p-2 flex justify-between items-start">
                    <div>
                      <strong className="text-sm">{item.name}</strong>
                      {item.works.length > 0 && (
                        <p className="text-xs text-gray-500">Works: {item.works.join(', ')}</p>
                      )}
                      {item.kindleUrl && (
                        <a
                          href={item.kindleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-orange-600 hover:underline"
                        >
                          Kindle →
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromList('reading', item.name)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Watchlist */}
          <div>
            <h5 className="font-semibold text-red-700 mb-2">🎬 Watchlist</h5>
            {watchlist.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No actors added yet.</p>
            ) : (
              <div className="space-y-2">
                {watchlist.map((item, i) => (
                  <div key={i} className="bg-red-50 rounded p-2 flex justify-between items-start">
                    <div>
                      <strong className="text-sm">{item.name}</strong>
                      {item.works.length > 0 && <p className="text-xs text-gray-500">Films: {item.works.join(', ')}</p>}
                      {item.imdbUrl && (
                        <a
                          href={item.imdbUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-red-600 hover:underline"
                        >
                          IMDB →
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromList('watchlist', item.name)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Places to Visit */}
          <div>
            <h5 className="font-semibold text-blue-700 mb-2">📍 Places to Visit</h5>
            {placesList.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No places added yet.</p>
            ) : (
              <div className="space-y-2">
                {placesList.map((item, i) => (
                  <div key={i} className="bg-blue-50 rounded p-2 flex justify-between items-start">
                    <div>
                      <strong className="text-sm">{item.name}</strong>
                      {item.location && <span className="text-xs text-gray-500 ml-2">({item.location})</span>}
                      <p className="text-xs text-blue-600">{item.reason}</p>
                    </div>
                    <button
                      onClick={() => removeFromList('places', item.name)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500 italic text-center py-4">No research history yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((item, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded p-2 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                  onClick={() => loadFromHistory(item)}
                >
                  <div>
                    <strong className="text-sm">{item.name}</strong>
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                    {item.cachedResult && (
                      <span className="text-xs text-green-500 ml-2">• Cached</span>
                    )}
                  </div>
                  <span className="text-xs text-blue-500">View →</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div>
            <h5 className="font-semibold text-sm text-gray-700 mb-2">🔑 Claude API Key</h5>
            <p className="text-xs text-gray-500 mb-2">
              Required for research. Get your API key from{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                console.anthropic.com
              </a>
            </p>
            <div className="flex gap-2">
              <Input
                type={showApiKey ? 'text' : 'password'}
                placeholder="sk-ant-api..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 font-mono text-sm"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {showApiKey ? '🙈' : '👁️'}
              </button>
            </div>
            <Button onClick={saveApiKey} className="mt-2" variant="secondary">
              Save API Key
            </Button>
          </div>

          <div className="border-t pt-4">
            <h5 className="font-semibold text-sm text-gray-700 mb-2">⚠️ Important Notes</h5>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• API key is stored locally in your browser</li>
              <li>• Research uses Claude with web search for accurate results</li>
              <li>• Each search may take 15-30 seconds</li>
              <li>• CORS: You may need a browser extension or backend proxy</li>
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
};

export default DeepResearchAgent;
