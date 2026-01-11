import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntries } from '../../contexts/EntriesContext';
import { useApp } from '../../contexts/AppContext';
import { Entry } from '../../types';
import { exportToCSV } from '../../utils/exportCSV';
import { formatDisplayDate, parseISO } from '../../utils/dateUtils';
import { getFeelingLabel, getFeelingColor } from '../../constants/feelings';
import { getActiveActivities, getActivityIcon } from '../../utils/formatters';
import Card from '../common/Card';
import Button from '../common/Button';
import FilterBar from './FilterBar';

const Timeline: React.FC = () => {
  const { entries } = useEntries();
  const { showToast, setCurrentDate } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('all');

  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Apply location filter
    if (filter !== 'all') {
      result = result.filter((entry) => {
        if (filter === 'nashville') return entry.location === 'nashville';
        if (filter === 'nyc') return entry.location === 'nyc';
        if (filter === 'other') return entry.location === 'other';
        return true;
      });
    }

    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [entries, filter]);

  const stats = useMemo(() => {
    const lastWorkout = entries.find((e) => e.activities.workout);
    return {
      totalEntries: entries.length,
      lastWorkoutDate: lastWorkout ? formatDisplayDate(lastWorkout.date) : 'N/A',
    };
  }, [entries]);

  const handleExport = () => {
    if (entries.length === 0) {
      showToast('No entries to export', 'warning');
      return;
    }
    exportToCSV(entries);
    showToast(`Exported ${entries.length} entries`, 'success');
  };

  const handleEntryClick = (entry: Entry) => {
    setCurrentDate(parseISO(entry.date));
    navigate('/');
  };

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
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Timeline</h1>
        <Button size="sm" variant="secondary" onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="text-center">
          <p className="text-3xl font-bold text-primary">{stats.totalEntries}</p>
          <p className="text-sm text-gray-500">Total Entries</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm font-medium text-gray-700">Last Workout</p>
          <p className="text-sm text-gray-500">{stats.lastWorkoutDate}</p>
        </Card>
      </div>

      {/* Filter */}
      <FilterBar currentFilter={filter} onFilterChange={setFilter} />

      {/* Entries */}
      {filteredEntries.length === 0 ? (
        <Card className="text-center py-12">
          <span className="text-4xl mb-4 block">📝</span>
          <h2 className="text-xl font-semibold mb-2">No Entries Yet</h2>
          <p className="text-gray-500">
            {filter === 'all'
              ? 'Start tracking your days to see them here.'
              : `No entries found for ${filter}.`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const location = getLocationDisplay(entry);
            const feeling = getFeelingLabel(entry.feeling);
            const feelingColor = getFeelingColor(entry.feeling);
            const activeActivities = getActiveActivities(entry.activities);

            return (
              <Card
                key={entry.id}
                onClick={() => handleEntryClick(entry)}
                hover
                className="cursor-pointer"
              >
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
                    <span
                      className="text-2xl font-bold"
                      style={{ color: feelingColor }}
                    >
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
          })}
        </div>
      )}
    </div>
  );
};

export default Timeline;
