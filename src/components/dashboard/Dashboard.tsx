import React from 'react';
import { useEntries } from '../../contexts/EntriesContext';
import { Entry, DashboardItem } from '../../types';
import { DASHBOARD_KEYWORDS } from '../../constants/config';
import { formatDisplayDate } from '../../utils/dateUtils';
import Card from '../common/Card';

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

const Dashboard: React.FC = () => {
  const { entries } = useEntries();

  const workouts = extractWorkouts(entries);
  const foodRecs = extractFoodRecommendations(entries);
  const movies = extractMovies(entries);
  const travel = extractTravel(entries);
  const books = extractBooks(entries);
  const ideas = extractIdeas(entries);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {entries.length === 0 ? (
        <Card className="text-center py-12">
          <span className="text-4xl mb-4 block">📊</span>
          <h2 className="text-xl font-semibold mb-2">No Data Yet</h2>
          <p className="text-gray-500">
            Start adding entries to see insights and recommendations here.
          </p>
        </Card>
      ) : (
        <>
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
