import React from 'react';
import { Entry } from '../../types';
import { formatDisplayDate } from '../../utils/dateUtils';
import { getFeelingLabel, getFeelingColor } from '../../constants/feelings';
import { getActiveActivities, getActivityIcon } from '../../utils/formatters';
import Card from '../common/Card';

interface SearchResultsProps {
  results: Entry[];
  query: string;
  onEntryClick: (entry: Entry) => void;
}

const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={index} className="bg-yellow-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const SearchResults: React.FC<SearchResultsProps> = ({ results, query, onEntryClick }) => {
  if (results.length === 0) {
    return (
      <Card className="text-center py-12">
        <span className="text-4xl mb-4 block">🤷</span>
        <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
        <p className="text-gray-500">
          No entries match "<span className="font-medium">{query}</span>"
        </p>
        <p className="text-sm text-gray-400 mt-2">Try different keywords or check spelling</p>
      </Card>
    );
  }

  const getLocationDisplay = (entry: Entry) => {
    switch (entry.location) {
      case 'nashville':
        return { icon: '🎸', name: 'Nashville' };
      case 'nyc':
        return { icon: '🗽', name: 'NYC' };
      case 'other':
        return { icon: '🌍', name: entry.otherLocationName || 'Other' };
      default:
        return { icon: '📍', name: entry.location };
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        {results.length} {results.length === 1 ? 'result' : 'results'} found
      </p>

      <div className="space-y-3">
        {results.map((entry) => {
          const location = getLocationDisplay(entry);
          const feeling = getFeelingLabel(entry.feeling);
          const feelingColor = getFeelingColor(entry.feeling);
          const activeActivities = getActiveActivities(entry.activities);

          return (
            <Card
              key={entry.id}
              onClick={() => onEntryClick(entry)}
              hover
              className="cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span>{location.icon}</span>
                    <span className="font-semibold">
                      {highlightMatch(location.name, query)}
                    </span>
                    {entry.tripType && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                        {entry.tripType}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{formatDisplayDate(entry.date)}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold" style={{ color: feelingColor }}>
                    {entry.feeling}
                  </span>
                  <p className="text-xs text-gray-500">{feeling.label}</p>
                </div>
              </div>

              {entry.highlights && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {highlightMatch(entry.highlights, query)}
                </p>
              )}

              {activeActivities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {activeActivities.map((type) => (
                    <span
                      key={type}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                    >
                      {getActivityIcon(type)}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResults;
