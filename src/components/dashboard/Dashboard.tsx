import React, { useState, useEffect } from 'react';
import { useEntries } from '../../contexts/EntriesContext';
import { Entry, DashboardItem } from '../../types';
import { SpotifyListItem, ReadingListItem, WatchlistItem, PlacesListItem } from '../../types/research';
import { DASHBOARD_KEYWORDS } from '../../constants/config';
import { formatDisplayDate } from '../../utils/dateUtils';
import { researchService } from '../../services/researchService';
import Card from '../common/Card';
import DeepResearchAgent from '../research/DeepResearchAgent';

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
  return (
    <Card className="mb-4">
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm italic">{emptyMessage}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={index}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <p className="text-gray-900">{item.text}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDisplayDate(item.date)} • {item.location}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

// Extract workouts from entries
const extractWorkouts = (entries: Entry[]): DashboardItem[] => {
  const items: DashboardItem[] = [];

  entries.forEach((entry) => {
    if (entry.activities.workout) {
      const workout = entry.activities.workout;
      const text = `${workout.type} - ${workout.duration}min (${workout.intensity})`;
      items.push({
        text,
        date: entry.date,
        location: entry.location === 'other' ? entry.otherLocationName || 'Other' : entry.location,
        entryId: entry.id,
      });
    }
  });

  return items.slice(0, 10);
};

// Extract food recommendations
const extractFoodRecommendations = (entries: Entry[]): DashboardItem[] => {
  const keywords = DASHBOARD_KEYWORDS.food;
  const items: DashboardItem[] = [];

  entries.forEach((entry) => {
    const location = entry.location === 'other' ? entry.otherLocationName || 'Other' : entry.location;

    // Check food activity
    if (entry.activities.food) {
      const food = entry.activities.food;
      const meals = [food.breakfast, food.lunch, food.dinner, food.notes].filter(Boolean);

      meals.forEach((meal) => {
        if (meal && keywords.some((kw) => meal.toLowerCase().includes(kw))) {
          items.push({ text: meal, date: entry.date, location, entryId: entry.id });
        }
      });
    }

    // Check social activity for restaurant mentions
    if (entry.activities.social) {
      const social = entry.activities.social;
      const text = [social.location, social.notes].filter(Boolean).join(' ');
      if (keywords.some((kw) => text.toLowerCase().includes(kw))) {
        items.push({ text: social.location || text, date: entry.date, location, entryId: entry.id });
      }
    }

    // Check highlights
    if (entry.highlights) {
      const lowerHighlights = entry.highlights.toLowerCase();
      if (
        keywords.some((kw) => lowerHighlights.includes(kw)) &&
        (lowerHighlights.includes('food') || lowerHighlights.includes('restaurant') || lowerHighlights.includes('eat'))
      ) {
        items.push({ text: entry.highlights, date: entry.date, location, entryId: entry.id });
      }
    }
  });

  return items.slice(0, 10);
};

// Extract movies & entertainment
const extractMovies = (entries: Entry[]): DashboardItem[] => {
  const keywords = DASHBOARD_KEYWORDS.movies;
  const items: DashboardItem[] = [];

  entries.forEach((entry) => {
    const location = entry.location === 'other' ? entry.otherLocationName || 'Other' : entry.location;

    // Check creative activity
    if (entry.activities.creative) {
      const creative = entry.activities.creative;
      if (keywords.some((kw) => creative.type?.toLowerCase().includes(kw))) {
        items.push({
          text: `${creative.type}: ${creative.project}`,
          date: entry.date,
          location,
          entryId: entry.id,
        });
      }
    }

    // Check highlights
    if (entry.highlights && keywords.some((kw) => entry.highlights!.toLowerCase().includes(kw))) {
      items.push({ text: entry.highlights, date: entry.date, location, entryId: entry.id });
    }

    // Check social activity
    if (entry.activities.social) {
      const social = entry.activities.social;
      if (keywords.some((kw) => social.activity?.toLowerCase().includes(kw))) {
        items.push({
          text: social.activity,
          date: entry.date,
          location,
          entryId: entry.id,
        });
      }
    }
  });

  return items.slice(0, 10);
};

// Extract travel recommendations
const extractTravel = (entries: Entry[]): DashboardItem[] => {
  const items: DashboardItem[] = [];

  entries.forEach((entry) => {
    const location = entry.location === 'other' ? entry.otherLocationName || 'Other' : entry.location;

    if (entry.activities.travel) {
      const travel = entry.activities.travel;
      const text = `${travel.destination} (${travel.purpose}) - ${travel.transport}`;
      items.push({ text, date: entry.date, location, entryId: entry.id });
    }

    // Include trip type entries
    if (entry.tripType && entry.location === 'other') {
      items.push({
        text: `${entry.otherLocationName} - ${entry.tripType} trip`,
        date: entry.date,
        location,
        entryId: entry.id,
      });
    }
  });

  return items.slice(0, 10);
};

// Extract books & reading
const extractBooks = (entries: Entry[]): DashboardItem[] => {
  const keywords = DASHBOARD_KEYWORDS.books;
  const items: DashboardItem[] = [];

  entries.forEach((entry) => {
    const location = entry.location === 'other' ? entry.otherLocationName || 'Other' : entry.location;

    // Check creative activity
    if (entry.activities.creative) {
      const creative = entry.activities.creative;
      if (keywords.some((kw) => creative.type?.toLowerCase().includes(kw))) {
        items.push({
          text: `${creative.type}: ${creative.project}`,
          date: entry.date,
          location,
          entryId: entry.id,
        });
      }
    }

    // Check highlights
    if (entry.highlights && keywords.some((kw) => entry.highlights!.toLowerCase().includes(kw))) {
      items.push({ text: entry.highlights, date: entry.date, location, entryId: entry.id });
    }
  });

  return items.slice(0, 10);
};

// Extract ideas & insights
const extractIdeas = (entries: Entry[]): DashboardItem[] => {
  const keywords = DASHBOARD_KEYWORDS.ideas;
  const items: DashboardItem[] = [];

  entries.forEach((entry) => {
    const location = entry.location === 'other' ? entry.otherLocationName || 'Other' : entry.location;

    // Check highlights
    if (entry.highlights && keywords.some((kw) => entry.highlights!.toLowerCase().includes(kw))) {
      items.push({ text: entry.highlights, date: entry.date, location, entryId: entry.id });
    }

    // Check work activity notes
    if (entry.activities.work?.notes) {
      if (keywords.some((kw) => entry.activities.work!.notes!.toLowerCase().includes(kw))) {
        items.push({
          text: entry.activities.work.notes,
          date: entry.date,
          location,
          entryId: entry.id,
        });
      }
    }

    // Check creative activity
    if (entry.activities.creative?.notes) {
      if (keywords.some((kw) => entry.activities.creative!.notes!.toLowerCase().includes(kw))) {
        items.push({
          text: entry.activities.creative.notes,
          date: entry.date,
          location,
          entryId: entry.id,
        });
      }
    }
  });

  return items.slice(0, 10);
};

// Research list section component
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
    <Card className="mb-4">
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h3>
      {isEmpty ? (
        <p className="text-gray-400 text-sm italic">{emptyMessage}</p>
      ) : (
        children
      )}
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { entries, exportToCSV, migrateFromLocalStorage } = useEntries();

  // Research lists state
  const [spotifyList, setSpotifyList] = useState<SpotifyListItem[]>([]);
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [placesList, setPlacesList] = useState<PlacesListItem[]>([]);
  const [migrating, setMigrating] = useState(false);
  const [migrateMessage, setMigrateMessage] = useState('');

  // Load research lists
  useEffect(() => {
    setSpotifyList(researchService.getSpotifyList());
    setReadingList(researchService.getReadingList());
    setWatchlist(researchService.getWatchlist());
    setPlacesList(researchService.getPlacesList());
  }, []);

  const handleExport = () => {
    exportToCSV();
  };

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrateMessage('');
    try {
      const count = await migrateFromLocalStorage();
      if (count > 0) {
        setMigrateMessage(`Migrated ${count} entries from local storage!`);
      } else {
        setMigrateMessage('No new entries to migrate.');
      }
    } catch (err) {
      setMigrateMessage('Migration failed. Please try again.');
    }
    setMigrating(false);
  };

  const workouts = extractWorkouts(entries);
  const foodRecs = extractFoodRecommendations(entries);
  const movies = extractMovies(entries);
  const travel = extractTravel(entries);
  const books = extractBooks(entries);
  const ideas = extractIdeas(entries);

  const hasResearchLists = spotifyList.length > 0 || readingList.length > 0 || watchlist.length > 0 || placesList.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
            title="Export all entries to CSV"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
            title="Import entries from browser storage"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {migrating ? 'Migrating...' : 'Import Local'}
          </button>
        </div>
      </div>

      {migrateMessage && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${migrateMessage.includes('failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {migrateMessage}
        </div>
      )}

      {/* Deep Research Agent */}
      <DeepResearchAgent />

      {/* Research Lists Section */}
      {hasResearchLists && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span>🔍</span> Research Lists
          </h2>

          {/* Listen List */}
          <ResearchListSection
            title="Listen List"
            icon="🎵"
            isEmpty={spotifyList.length === 0}
            emptyMessage="No artists to listen to yet"
          >
            <ul className="space-y-2">
              {spotifyList.map((item, i) => (
                <li key={i} className="p-2 bg-green-50 rounded-lg flex justify-between items-center">
                  <span className="font-medium text-sm">{item.name}</span>
                  {item.spotifyUrl && (
                    <a
                      href={item.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:underline"
                    >
                      Open Spotify →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </ResearchListSection>

          {/* Reading List */}
          <ResearchListSection
            title="Reading List"
            icon="📚"
            isEmpty={readingList.length === 0}
            emptyMessage="No books to read yet"
          >
            <ul className="space-y-2">
              {readingList.map((item, i) => (
                <li key={i} className="p-2 bg-orange-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-sm">{item.name}</span>
                      {item.works.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">{item.works.join(', ')}</p>
                      )}
                    </div>
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
                </li>
              ))}
            </ul>
          </ResearchListSection>

          {/* Watchlist */}
          <ResearchListSection
            title="Watchlist"
            icon="🎬"
            isEmpty={watchlist.length === 0}
            emptyMessage="No films to watch yet"
          >
            <ul className="space-y-2">
              {watchlist.map((item, i) => (
                <li key={i} className="p-2 bg-red-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-sm">{item.name}</span>
                      {item.works.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">{item.works.join(', ')}</p>
                      )}
                    </div>
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
                </li>
              ))}
            </ul>
          </ResearchListSection>

          {/* Places to Visit */}
          <ResearchListSection
            title="Places to Visit"
            icon="📍"
            isEmpty={placesList.length === 0}
            emptyMessage="No places to visit yet"
          >
            <ul className="space-y-2">
              {placesList.map((item, i) => (
                <li key={i} className="p-2 bg-blue-50 rounded-lg">
                  <span className="font-medium text-sm">{item.name}</span>
                  {item.location && (
                    <span className="text-xs text-gray-500 ml-2">({item.location})</span>
                  )}
                  <p className="text-xs text-blue-600 mt-1">{item.reason}</p>
                </li>
              ))}
            </ul>
          </ResearchListSection>
        </div>
      )}

      {/* Diary Insights */}
      {entries.length === 0 && !hasResearchLists ? (
        <Card className="text-center py-12">
          <span className="text-4xl mb-4 block">📊</span>
          <h2 className="text-xl font-semibold mb-2">No Data Yet</h2>
          <p className="text-gray-500">
            Start adding entries to see insights and recommendations here.
          </p>
        </Card>
      ) : entries.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span>📝</span> Diary Insights
          </h2>

          <DashboardSection
            title="Workouts"
            icon="🏋️"
            items={workouts}
            emptyMessage="No workouts logged yet"
          />

          <DashboardSection
            title="Food Recommendations"
            icon="🍽️"
            items={foodRecs}
            emptyMessage="No food recommendations found"
          />

          <DashboardSection
            title="Movies & Entertainment"
            icon="🎬"
            items={movies}
            emptyMessage="No movies or entertainment logged"
          />

          <DashboardSection
            title="Travel"
            icon="✈️"
            items={travel}
            emptyMessage="No travel activities logged"
          />

          <DashboardSection
            title="Books & Reading"
            icon="📚"
            items={books}
            emptyMessage="No books or reading logged"
          />

          <DashboardSection
            title="Ideas & Insights"
            icon="💡"
            items={ideas}
            emptyMessage="No ideas or insights captured"
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
