import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { formatTime } from '../../utils/dateUtils';
import Card from '../common/Card';
import Button from '../common/Button';
import CalendarConnector from './CalendarConnector';

interface CalendarQuickViewProps {
  date: Date;
}

// Demo events for when calendar is not connected
const getDemoEvents = (date: Date): CalendarEvent[] => {
  const dateStr = date.toISOString().split('T')[0];
  return [
    {
      id: '1',
      title: 'Team Standup',
      start: `${dateStr}T09:00:00`,
      end: `${dateStr}T09:30:00`,
      location: 'Zoom',
      source: 'manual' as const,
    },
    {
      id: '2',
      title: 'Lunch with Alex',
      start: `${dateStr}T12:00:00`,
      end: `${dateStr}T13:00:00`,
      location: 'Cafe Milano',
      source: 'manual' as const,
    },
    {
      id: '3',
      title: 'Project Review',
      start: `${dateStr}T14:00:00`,
      end: `${dateStr}T15:30:00`,
      location: 'Conference Room A',
      source: 'manual' as const,
    },
  ];
};

const CalendarQuickView: React.FC<CalendarQuickViewProps> = ({ date }) => {
  const { settings } = useSettings();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showConnector, setShowConnector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if calendar is connected (would check for stored token in real implementation)
    const token = localStorage.getItem('ytt-calendar-token');
    setIsConnected(!!token);

    if (token) {
      // In real implementation, fetch events from Google Calendar API
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setEvents(getDemoEvents(date));
        setIsLoading(false);
      }, 500);
    } else {
      // Show demo events
      setEvents(getDemoEvents(date));
    }
  }, [date]);

  if (!settings.apis.calendar && settings.version === 'trust') {
    return null;
  }

  const formatEventTime = (start: string, end: string) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    return `${formatTime(startTime.toTimeString().slice(0, 5))} - ${formatTime(endTime.toTimeString().slice(0, 5))}`;
  };

  return (
    <>
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <h3 className="font-semibold">Today's Schedule</h3>
          </div>
          {!isConnected ? (
            <Button size="sm" variant="secondary" onClick={() => setShowConnector(true)}>
              Connect Calendar
            </Button>
          ) : (
            <span className="text-xs text-success flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Connected
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : events.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No events scheduled</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-1 bg-primary rounded-full" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500">
                    {formatEventTime(event.start, event.end)}
                  </p>
                  <p className="font-medium text-gray-900 truncate">{event.title}</p>
                  {event.location && (
                    <p className="text-sm text-gray-500 truncate">{event.location}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isConnected && (
          <p className="text-xs text-gray-400 text-center mt-3">
            Demo events shown. Connect your calendar for real data.
          </p>
        )}
      </Card>

      <CalendarConnector
        isOpen={showConnector}
        onClose={() => setShowConnector(false)}
        onConnect={() => {
          setIsConnected(true);
          setShowConnector(false);
        }}
      />
    </>
  );
};

export default CalendarQuickView;
