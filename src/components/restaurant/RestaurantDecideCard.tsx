import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLists } from '../../contexts/ListsContext';
import { RestaurantItem } from '../../types/research';
import DecideMode from './DecideMode';

const RestaurantDecideCard: React.FC = () => {
  const {
    restaurantsList,
    weeklyPicks,
    weeklyPicksGeneratedAt,
    generateWeeklyPicks,
  } = useLists();

  const [showDecide, setShowDecide] = useState(false);
  const [picksExpanded, setPicksExpanded] = useState(false);

  const activeCount = useMemo(
    () => restaurantsList.filter((r) => (r.status || 'active') === 'active').length,
    [restaurantsList]
  );

  // Auto-generate picks on Monday or if never generated
  useEffect(() => {
    if (activeCount === 0) return;
    const now = new Date();
    const isMonday = now.getDay() === 1;

    if (!weeklyPicksGeneratedAt) {
      generateWeeklyPicks();
      return;
    }

    const generated = new Date(weeklyPicksGeneratedAt);
    const daysSince = (now.getTime() - generated.getTime()) / (24 * 60 * 60 * 1000);
    if (isMonday && daysSince >= 7) {
      generateWeeklyPicks();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCount]);

  const weeklyRestaurants = useMemo(
    () =>
      weeklyPicks
        .map((id) => restaurantsList.find((r) => r.id === id))
        .filter(Boolean) as RestaurantItem[],
    [weeklyPicks, restaurantsList]
  );

  if (activeCount === 0) return null;

  const picksToShow = picksExpanded ? weeklyRestaurants : weeklyRestaurants.slice(0, 3);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-warm-200 rounded-2xl overflow-hidden shadow-sm"
      >
        {/* Header row */}
        <div className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-sunset to-brand-coral rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">🍽️</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-warm-800 text-base leading-tight">
              Where should we eat?
            </h3>
            <p className="text-xs text-warm-500 mt-0.5">
              {activeCount} place{activeCount !== 1 ? 's' : ''} in your list
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDecide(true)}
            className="px-5 py-2.5 gradient-coral text-white font-bold rounded-xl hover:opacity-90 transition-all text-sm shrink-0 shadow-glow-coral"
          >
            Decide
          </motion.button>
        </div>

        {/* Weekly picks */}
        {weeklyRestaurants.length > 0 && (
          <div className="border-t border-warm-100">
            <div className="flex items-center justify-between px-4 py-2.5">
              <p className="text-xs font-bold text-warm-500 uppercase tracking-wider">
                This week's picks
              </p>
              <button
                onClick={generateWeeklyPicks}
                className="text-xs text-warm-400 hover:text-brand-ocean flex items-center gap-1 transition-colors"
                title="Refresh suggestions"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            <ul className="divide-y divide-warm-50">
              {picksToShow.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-warm-800 truncate">{r.name}</p>
                    <div className="flex gap-2 text-xs text-warm-500 mt-0.5 flex-wrap">
                      {r.city === 'nashville' && <span className="text-brand-ocean">🎸 Nashville</span>}
                      {r.city === 'nyc' && <span className="text-brand-lavender">🗽 NYC</span>}
                      {r.cuisine && <span>{r.cuisine}</span>}
                      {r.priceRange && <span>{'$'.repeat(r.priceRange)}</span>}
                      {r.neighborhood && <span>{r.neighborhood}</span>}
                    </div>
                  </div>
                  {!r.lastVisited && (
                    <span className="ml-2 shrink-0 text-xs bg-brand-coral/10 text-brand-coral px-2.5 py-0.5 rounded-full font-semibold">
                      New
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {weeklyRestaurants.length > 3 && (
              <button
                onClick={() => setPicksExpanded((v) => !v)}
                className="w-full text-xs text-warm-400 hover:text-warm-700 py-2.5 border-t border-warm-100 transition-colors"
              >
                {picksExpanded
                  ? 'Show less'
                  : `Show ${weeklyRestaurants.length - 3} more`}
              </button>
            )}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showDecide && <DecideMode onClose={() => setShowDecide(false)} />}
      </AnimatePresence>
    </>
  );
};

export default RestaurantDecideCard;
