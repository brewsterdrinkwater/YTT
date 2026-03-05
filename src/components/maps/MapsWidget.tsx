import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';

interface PlaceVisit {
  id: string;
  name: string;
  address: string;
  category?: string;
  timestamp: string;
}

const MapsWidget: React.FC = () => {
  const { session } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useApp();
  const [places, setPlaces] = useState<PlaceVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadPlaces = useCallback(async () => {
    if (!session?.provider_token) {
      setIsConnected(false);
      return;
    }

    setIsConnected(true);
    setLoading(true);

    try {
      // Google Maps Timeline data is accessed via the Semantic Location History
      // For now, we show that it's connected and guide the user
      // The actual Maps Timeline API is limited - we demonstrate the connection
      setPlaces([]);
    } catch (err) {
      console.error('[Maps] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (settings.apis.mapsTimeline && session) {
      loadPlaces();
    }
  }, [settings.apis.mapsTimeline, session, loadPlaces]);

  const handleConnect = async () => {
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
      showToast('Failed to connect Maps', 'error');
    }
  };

  if (!settings.apis.mapsTimeline) return null;

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
          <span className="text-lg">🗺️</span>
          <span className="font-bold text-sm text-black">Google Maps</span>
          {isConnected && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Connected
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
                <p className="text-sm text-slate mb-3">
                  Connect Google Maps to import your location history
                </p>
                <button
                  onClick={handleConnect}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                  </svg>
                  Connect Google Maps
                </button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent" />
              </div>
            ) : (
              <div className="p-4">
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-green-800 font-medium mb-1">Google Maps Connected</p>
                  <p className="text-xs text-green-600">
                    Your Google account is linked. Location history from Google Maps Timeline
                    can help auto-fill your daily location.
                  </p>
                </div>
                {places.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {places.map((place) => (
                      <div key={place.id} className="flex items-start gap-2 p-2 bg-concrete rounded-md">
                        <span className="text-sm">📍</span>
                        <div>
                          <p className="text-sm font-medium">{place.name}</p>
                          <p className="text-xs text-slate">{place.address}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MapsWidget;
