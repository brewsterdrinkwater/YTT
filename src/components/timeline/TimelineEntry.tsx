import React from 'react';
import { Entry } from '../../types';
import { formatDisplayDate } from '../../utils/dateUtils';
import { getFeelingLabel, getFeelingColor } from '../../constants/feelings';
import { getActiveActivities, getActivityIcon } from '../../utils/formatters';
import Card from '../common/Card';

interface TimelineEntryProps {
  entry: Entry;
  onClick: () => void;
}

const TimelineEntry: React.FC<TimelineEntryProps> = ({ entry, onClick }) => {
  const getLocationDisplay = () => {
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

  const location = getLocationDisplay();
  const feeling = getFeelingLabel(entry.feeling);
  const feelingColor = getFeelingColor(entry.feeling);
  const activeActivities = getActiveActivities(entry.activities);

  return (
    <Card onClick={onClick} hover className="cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span>{location.icon}</span>
            <span className="font-semibold">{location.name}</span>
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
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{entry.highlights}</p>
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
};

export default TimelineEntry;
