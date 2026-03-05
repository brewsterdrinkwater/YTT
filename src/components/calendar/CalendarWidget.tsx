import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarEvent } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useApp } from '../../contexts/AppContext';
import { fetchCalendarEvents } from '../../services/calendarService';
import { supabase } from '../../lib/supabase';

const CalendarWidget: React.FC = () => {
  const { session } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useApp();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const getProviderToken = useCallback(async (): Promise<string | null> => {
    // Try to get the provider token from the current session
    if (session?.provider_token) {
      return session.provider_token;
    }

    // Try refreshing the session to get a new provider token
    const { data } = await supabase.auth.refreshSession();
    return data.session?.provider_token || null;
  }, [session]);

  const loadEvents = useCallback(async () => {
    const token = await getProviderToken();
    if (!token) {
      setIsConnected(false);
      return;
    }

    setIsConnected(true);
    setLoading(true);
    try {
      const todayEvents = await fetchCalendarEvents(new Date(), token);
      setEvents(todayEvents);
    } catch (err) {
      console.error('[Calendar] Failed to fetch events:', err);
      if (String(err).includes('expired')) {
        setIsConnected(false);
      }
    } finally {
      setLoading(false);
    }
  }, [getProviderToken]);

  useEffect(() => {
    if (settings.apis.calendar && session) {
      loadEvents();
    }
  }, [settings.apis.calendar, session, loadEvents]);

  const handleConnect = async () => {
    // Re-authenticate with Google and request calendar scope
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        scopes: 'https://www.googleapis.com/auth/calendar.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) {
      showToast('Failed to connect calendar', 'error');
    }
  };

  if (!settings.apis.calendar) return null;

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.end) >= now);
  const pastEvents = events.filter((e) => new Date(e.end) < now);

  return (
    <motion.div
      layout
      className="bg-white rounded-lg border-2 border-black overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-concrete transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <span className="font-bold text-sm text-black">Today's Schedule</span>
          {events.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {events.length}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-charcoal transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-steel overflow-hidden"
          >
            {!isConnected ? (
              <div className="p-4 text-center">
                <p className="text-sm text-slate mb-3">Connect your Google Calendar to see events</p>
                <button
                  onClick={handleConnect}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                  </svg>
                  Connect Google Calendar
                </button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : events.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate">
                No events scheduled for today
              </div>
            ) : (
              <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                {/* Upcoming events */}
                {upcomingEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 p-2 rounded-md hover:bg-concrete transition-colors"
                  >
                    <div className="w-1 h-full min-h-[40px] bg-blue-500 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-black truncate">{event.title}</p>
                      <p className="text-xs text-slate">
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </p>
                      {event.location && (
                        <p className="text-xs text-slate truncate">📍 {event.location}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
                {/* Past events */}
                {pastEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-2 p-2 rounded-md opacity-50"
                  >
                    <div className="w-1 h-full min-h-[40px] bg-steel rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-charcoal truncate line-through">
                        {event.title}
                      </p>
                      <p className="text-xs text-slate">
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CalendarWidget;
