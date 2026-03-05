import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface SwipeableCardsProps {
  children: React.ReactNode[];
  onSwipe?: (direction: 'left' | 'right', index: number) => void;
  showIndicators?: boolean;
  className?: string;
}

const SwipeableCards: React.FC<SwipeableCardsProps> = ({
  children,
  onSwipe,
  showIndicators = true,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const validChildren = children.filter(Boolean);

  const swipeThreshold = 50;

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > swipeThreshold) {
      if (info.offset.x > 0 && currentIndex > 0) {
        setDirection(-1);
        setCurrentIndex(currentIndex - 1);
        onSwipe?.('right', currentIndex - 1);
      } else if (info.offset.x < 0 && currentIndex < validChildren.length - 1) {
        setDirection(1);
        setCurrentIndex(currentIndex + 1);
        onSwipe?.('left', currentIndex + 1);
      }
    }
  };

  const goTo = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  if (validChildren.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -300 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="cursor-grab active:cursor-grabbing"
          >
            {validChildren[currentIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      {validChildren.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={() => goTo(currentIndex - 1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center text-charcoal hover:text-black hover:shadow-lg transition-all z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {currentIndex < validChildren.length - 1 && (
            <button
              onClick={() => goTo(currentIndex + 1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center text-charcoal hover:text-black hover:shadow-lg transition-all z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </>
      )}

      {/* Dot indicators */}
      {showIndicators && validChildren.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {validChildren.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex
                  ? 'bg-black w-6'
                  : 'bg-steel hover:bg-charcoal'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SwipeableCards;
