import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { getRelativeDayLabel, formatDisplayDate, navigateDate } from '../../utils/dateUtils';

const DateNavigator: React.FC = () => {
  const { currentDate, setCurrentDate } = useApp();

  const handlePrev = () => {
    setCurrentDate(navigateDate(currentDate, 'prev'));
  };

  const handleNext = () => {
    setCurrentDate(navigateDate(currentDate, 'next'));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const relativeLabel = getRelativeDayLabel(currentDate);
  const fullDate = formatDisplayDate(currentDate);
  const isToday = relativeLabel === 'Today';

  return (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={handlePrev}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Previous day"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="text-center">
        <button
          onClick={handleToday}
          className={`text-2xl font-bold transition-colors ${
            isToday ? 'text-primary' : 'text-gray-900 hover:text-primary'
          }`}
        >
          {relativeLabel}
        </button>
        <p className="text-sm text-gray-500">{fullDate}</p>
      </div>

      <button
        onClick={handleNext}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Next day"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default DateNavigator;
