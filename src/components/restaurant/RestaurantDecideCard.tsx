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

  // Don't render until user has restaurants
  if (activeCount === 0) return null;

  const picksToShow = picksExpanded ? weeklyRestaurants : weeklyRestaurants.slice(0, 3);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-black rounded-xl overflow-hidden"
      >
        {/* Header row */}
        <div className="flex items-center gap-3 p-4">
          <div className="flex-1">
            <h3 className="font-bold text-black text-base leading-tight">
              Where should we eat?
            </h3>
            <p className="text-xs text-slate mt-0.5">
              {activeCount} place{activeCount !== 1 ? 's' : ''} in your list
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDecide(true)}
            className="px-5 py-2.5 bg-black text-white font-bold rounded-xl hover:bg-charcoal transition-colors text-sm shrink-0"
          >
            Decide
          </motion.button>
        </div>

        {/* Weekly picks */}
        {weeklyRestaurants.length > 0 && (
          <div className="border-t border-concrete">
            <div className="flex items-center justify-between px-4 py-2">
              <p className="text-xs font-bold text-slate uppercase tracking-wider">
                This week's picks
              </p>
              <button
                onClick={generateWeeklyPicks}
                className="text-xs text-slate hover:text-black flex items-center gap-1"
                title="Refresh suggestions"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            <ul className="divide-y divide-concrete/60">
              {picksToShow.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-black truncate">{r.name}</p>
                    <div className="flex gap-2 text-xs text-slate mt-0.5 flex-wrap">
                      {r.city === 'nashville' && <span className="text-blue-600">🎸 Nashville</span>}
                      {r.city === 'nyc' && <span className="text-purple-600">🗽 NYC</span>}
                      {r.cuisine && <span>{r.cuisine}</span>}
                      {r.priceRange && <span>{'$'.repeat(r.priceRange)}</span>}
                      {r.neighborhood && <span>{r.neighborhood}</span>}
                    </div>
                  </div>
                  {!r.lastVisited && (
                    <span className="ml-2 shrink-0 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                      New
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {weeklyRestaurants.length > 3 && (
              <button
                onClick={() => setPicksExpanded((v) => !v)}
                className="w-full text-xs text-slate hover:text-black py-2 border-t border-concrete/60"
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
