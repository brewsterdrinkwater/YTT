import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useLists } from '../../contexts/ListsContext';
import { RestaurantItem } from '../../types/research';
import { storageService } from '../../services/storageService';
import { STORAGE_KEYS } from '../../constants/config';

interface Filters {
  neighborhoods: string[];
  priceRanges: number[];
  cuisines: string[];
  notVisitedWeeks: number; // 0 = any
}

const DEFAULT_FILTERS: Filters = {
  neighborhoods: [],
  priceRanges: [],
  cuisines: [],
  notVisitedWeeks: 0,
};

type Step = 'filters' | 'swipe' | 'winner';

interface Props {
  onClose: () => void;
}

const DecideMode: React.FC<Props> = ({ onClose }) => {
  const { restaurantsList, markRestaurantVisited } = useLists();

  const activeRestaurants = useMemo(
    () => restaurantsList.filter((r) => (r.status || 'active') === 'active'),
    [restaurantsList]
  );

  const allNeighborhoods = useMemo(
    () => [...new Set(activeRestaurants.map((r) => r.neighborhood).filter(Boolean))] as string[],
    [activeRestaurants]
  );
  const allCuisines = useMemo(
    () => [...new Set(activeRestaurants.map((r) => r.cuisine).filter(Boolean))] as string[],
    [activeRestaurants]
  );

  const [filters, setFilters] = useState<Filters>(() => {
    const saved = storageService.get<Filters>(STORAGE_KEYS.DECIDE_FILTERS);
    return saved || DEFAULT_FILTERS;
  });

  // Persist filters on change
  useEffect(() => {
    storageService.set(STORAGE_KEYS.DECIDE_FILTERS, filters);
  }, [filters]);

  const [step, setStep] = useState<Step>('filters');
  const [deck, setDeck] = useState<RestaurantItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [keptIds, setKeptIds] = useState<string[]>([]);
  const [winner, setWinner] = useState<RestaurantItem | null>(null);
  const [swiping, setSwiping] = useState<'left' | 'right' | null>(null);

  const buildDeck = (f: Filters = filters): RestaurantItem[] => {
    let filtered = activeRestaurants;

    if (f.neighborhoods.length > 0) {
      filtered = filtered.filter(
        (r) => r.neighborhood && f.neighborhoods.includes(r.neighborhood)
      );
    }
    if (f.priceRanges.length > 0) {
      filtered = filtered.filter((r) => r.priceRange && f.priceRanges.includes(r.priceRange));
    }
    if (f.cuisines.length > 0) {
      filtered = filtered.filter((r) => r.cuisine && f.cuisines.includes(r.cuisine));
    }
    if (f.notVisitedWeeks > 0) {
      const cutoff = new Date(Date.now() - f.notVisitedWeeks * 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((r) => !r.lastVisited || new Date(r.lastVisited) < cutoff);
    }

    // Shuffle, cap at 15
    return [...filtered].sort(() => Math.random() - 0.5).slice(0, 15);
  };

  const filteredCount = useMemo(() => buildDeck(filters).length, [filters, activeRestaurants]);

  const startDecide = () => {
    const d = buildDeck();
    if (d.length === 0) return;
    setDeck(d);
    setCurrentIndex(0);
    setKeptIds([]);
    setWinner(null);
    setStep('swipe');
  };

  const resolveWinner = (kept: string[], d: RestaurantItem[]) => {
    const pool = kept.length > 0 ? kept : d.map((r) => r.id);
    const pickId = pool[Math.floor(Math.random() * pool.length)];
    return d.find((r) => r.id === pickId) || d[0];
  };

  const handleSwipe = (dir: 'left' | 'right') => {
    if (swiping || currentIndex >= deck.length) return;

    setSwiping(dir);

    setTimeout(() => {
      const current = deck[currentIndex];
      const nextKept = dir === 'right' ? [...keptIds, current.id] : keptIds;
      const nextIndex = currentIndex + 1;

      setSwiping(null);
      setKeptIds(nextKept);

      if (nextIndex >= deck.length) {
        setWinner(resolveWinner(nextKept, deck));
        setStep('winner');
      } else {
        setCurrentIndex(nextIndex);
      }
    }, 280);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 80) handleSwipe('right');
    else if (info.offset.x < -80) handleSwipe('left');
  };

  const toggleChip = <T,>(key: keyof Filters, value: T) => {
    setFilters((prev) => {
      const arr = prev[key] as T[];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [key]: next };
    });
  };

  const resetAndShuffle = () => {
    const d = buildDeck();
    setDeck(d);
    setCurrentIndex(0);
    setKeptIds([]);
    setWinner(null);
    setStep('swipe');
  };

  const priceLabel = (n: number) => '$'.repeat(n);

  const card = deck[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-end md:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="w-full md:max-w-md bg-white rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black shrink-0">
          <div className="flex items-center gap-2">
            {step !== 'filters' && (
              <button
                onClick={() => setStep(step === 'winner' ? 'swipe' : 'filters')}
                className="text-slate hover:text-black mr-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="font-bold text-black text-base">
              {step === 'filters' && 'What are you feeling?'}
              {step === 'swipe' && `${currentIndex + 1} of ${deck.length}`}
              {step === 'winner' && "Tonight you're going to…"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate hover:text-black p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── FILTERS ── */}
        {step === 'filters' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {allNeighborhoods.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate uppercase tracking-wider mb-2">
                  Neighborhood
                </p>
                <div className="flex flex-wrap gap-2">
                  {allNeighborhoods.map((n) => (
                    <button
                      key={n}
                      onClick={() => toggleChip('neighborhoods', n)}
                      className={`px-3 py-1.5 rounded-full text-sm border-2 font-medium transition-colors ${
                        filters.neighborhoods.includes(n)
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-black hover:bg-concrete'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-slate uppercase tracking-wider mb-2">Price</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((p) => (
                  <button
                    key={p}
                    onClick={() => toggleChip('priceRanges', p)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                      filters.priceRanges.includes(p)
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-black hover:bg-concrete'
                    }`}
                  >
                    {priceLabel(p)}
                  </button>
                ))}
              </div>
            </div>

            {allCuisines.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate uppercase tracking-wider mb-2">
                  Cuisine
                </p>
                <div className="flex flex-wrap gap-2">
                  {allCuisines.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggleChip('cuisines', c)}
                      className={`px-3 py-1.5 rounded-full text-sm border-2 font-medium transition-colors ${
                        filters.cuisines.includes(c)
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-black hover:bg-concrete'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-slate uppercase tracking-wider mb-2">
                Haven't been in
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Any', value: 0 },
                  { label: '2 wks', value: 2 },
                  { label: '4 wks', value: 4 },
                  { label: '2 mo', value: 8 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilters((prev) => ({ ...prev, notVisitedWeeks: opt.value }))}
                    className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-colors ${
                      filters.notVisitedWeeks === opt.value
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-black hover:bg-concrete'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset filters */}
            {(filters.neighborhoods.length > 0 ||
              filters.priceRanges.length > 0 ||
              filters.cuisines.length > 0 ||
              filters.notVisitedWeeks !== 0) && (
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-xs text-slate hover:text-black underline"
              >
                Clear all filters
              </button>
            )}

            <div className="text-center text-xs text-slate py-1">
              {filteredCount === 0
                ? 'No restaurants match — try removing some filters'
                : `${filteredCount} restaurant${filteredCount !== 1 ? 's' : ''} in the deck`}
            </div>

            <button
              onClick={startDecide}
              disabled={filteredCount === 0}
              className="w-full py-4 bg-black text-white font-bold text-base rounded-xl disabled:opacity-40 hover:bg-charcoal transition-colors"
            >
              Start Swiping →
            </button>
          </div>
        )}

        {/* ── SWIPE ── */}
        {step === 'swipe' && card && (
          <div className="flex-1 flex flex-col items-center p-4 overflow-hidden">
            {/* Progress bar */}
            <div className="w-full flex gap-1 mb-4 shrink-0">
              {deck.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < currentIndex
                      ? 'bg-black'
                      : i === currentIndex
                      ? 'bg-orange-400'
                      : 'bg-concrete'
                  }`}
                />
              ))}
            </div>

            {/* Swipe hint labels */}
            <div className="flex justify-between w-full mb-2 shrink-0">
              <span className="text-xs text-red-400 font-medium">← Skip</span>
              <span className="text-xs text-green-600 font-medium">Yes →</span>
            </div>

            {/* Card */}
            <div className="flex-1 flex items-center w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={card.id + currentIndex}
                  initial={{ scale: 0.92, opacity: 0, y: 8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{
                    x: swiping === 'right' ? 350 : swiping === 'left' ? -350 : 0,
                    opacity: 0,
                    rotate: swiping === 'right' ? 12 : swiping === 'left' ? -12 : 0,
                  }}
                  transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.6}
                  onDragEnd={handleDragEnd}
                  className="w-full cursor-grab active:cursor-grabbing select-none"
                >
                  <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-lg text-center">
                    {/* Status badges */}
                    <div className="flex justify-center gap-2 mb-3 min-h-[24px]">
                      {card.isOpenNow === false && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                          Closed now
                        </span>
                      )}
                      {card.isOpenNow === true && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
                          Open{card.closingTime ? ` until ${card.closingTime}` : ''}
                        </span>
                      )}
                      {card.requiresReservation && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          Needs reservation
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl font-bold text-black mb-2">{card.name}</h3>

                    <div className="flex justify-center flex-wrap gap-2 text-sm text-slate">
                      {card.cuisine && (
                        <span className="bg-concrete px-2 py-0.5 rounded-full">{card.cuisine}</span>
                      )}
                      {card.priceRange && (
                        <span className="bg-concrete px-2 py-0.5 rounded-full">
                          {'$'.repeat(card.priceRange)}
                        </span>
                      )}
                      {card.neighborhood && (
                        <span className="bg-concrete px-2 py-0.5 rounded-full">
                          {card.neighborhood}
                        </span>
                      )}
                    </div>

                    {card.lastVisited ? (
                      <p className="text-xs text-slate mt-3">
                        Last visited{' '}
                        {new Date(card.lastVisited).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    ) : (
                      <p className="text-xs text-orange-500 font-semibold mt-3">
                        Never been — try it!
                      </p>
                    )}

                    {card.notes && (
                      <p className="text-xs text-charcoal mt-2 italic line-clamp-2">
                        "{card.notes}"
                      </p>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mt-4 w-full max-w-xs shrink-0">
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => handleSwipe('left')}
                disabled={!!swiping}
                className="flex-1 py-4 border-2 border-red-300 text-red-500 rounded-2xl font-bold text-2xl hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                ✕
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => handleSwipe('right')}
                disabled={!!swiping}
                className="flex-1 py-4 border-2 border-green-300 text-green-600 rounded-2xl font-bold text-2xl hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                ✓
              </motion.button>
            </div>

            <button
              onClick={() => {
                const pick = deck[Math.floor(Math.random() * deck.length)];
                setWinner(pick);
                setStep('winner');
              }}
              className="mt-3 text-xs text-slate hover:text-black underline shrink-0"
            >
              Just pick one randomly
            </button>
          </div>
        )}

        {/* ── WINNER ── */}
        {step === 'winner' && winner && (
          <div className="flex-1 overflow-y-auto p-6 text-center">
            <div className="text-5xl mb-3">🎉</div>

            {/* Status badges */}
            <div className="flex justify-center flex-wrap gap-2 mb-3">
              {winner.isOpenNow === false && (
                <span className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full font-medium">
                  ⚠ Closed right now
                </span>
              )}
              {winner.isOpenNow === true && (
                <span className="text-sm bg-green-100 text-green-600 px-3 py-1 rounded-full font-medium">
                  Open{winner.closingTime ? ` until ${winner.closingTime}` : ''}
                </span>
              )}
              {winner.requiresReservation && (
                <span className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
                  📞 Call ahead
                </span>
              )}
            </div>

            <h2 className="text-3xl font-bold text-black mb-1">{winner.name}</h2>

            <div className="flex justify-center flex-wrap gap-2 text-slate text-sm mb-4">
              {winner.cuisine && (
                <span className="bg-concrete px-2 py-0.5 rounded-full">{winner.cuisine}</span>
              )}
              {winner.priceRange && (
                <span className="bg-concrete px-2 py-0.5 rounded-full">
                  {'$'.repeat(winner.priceRange)}
                </span>
              )}
              {winner.neighborhood && (
                <span className="bg-concrete px-2 py-0.5 rounded-full">{winner.neighborhood}</span>
              )}
            </div>

            {winner.notes && (
              <p className="text-sm text-charcoal italic mb-4">"{winner.notes}"</p>
            )}

            {/* Action links */}
            <div className="flex flex-col gap-2 mb-5">
              {winner.googleMapsUrl ? (
                <a
                  href={winner.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-charcoal transition-colors"
                >
                  Open in Maps
                </a>
              ) : (
                <a
                  href={`https://maps.google.com/maps?q=${encodeURIComponent(winner.name + (winner.neighborhood ? ' ' + winner.neighborhood : ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-charcoal transition-colors"
                >
                  Find on Maps
                </a>
              )}
              {winner.resyUrl && (
                <a
                  href={winner.resyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
                >
                  Book on Resy
                </a>
              )}
              {winner.openTableUrl && (
                <a
                  href={winner.openTableUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
                >
                  Book on OpenTable
                </a>
              )}
            </div>

            <button
              onClick={() => {
                markRestaurantVisited(winner.id);
                onClose();
              }}
              className="w-full py-3 border-2 border-black text-black font-medium rounded-xl hover:bg-concrete transition-colors mb-3"
            >
              We're going! Mark visited
            </button>

            <button
              onClick={resetAndShuffle}
              className="text-sm text-slate hover:text-black underline"
            >
              Try again with new picks
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default DecideMode;
