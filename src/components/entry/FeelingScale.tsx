import React from 'react';
import { getFeelingLabel, getFeelingColor } from '../../constants/feelings';

interface FeelingScaleProps {
  value: number;
  onChange: (value: number) => void;
}

const FeelingScale: React.FC<FeelingScaleProps> = ({ value, onChange }) => {
  const isUnset = value === 0;
  const displayValue = isUnset ? 5 : value; // Show 5 on slider when unset
  const feeling = getFeelingLabel(value);
  const color = getFeelingColor(value);

  const handleSliderChange = (newValue: number) => {
    onChange(newValue);
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        How are you feeling?
      </label>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {/* Large number display */}
        <div className="text-center mb-4">
          {isUnset ? (
            <>
              <span className="text-6xl font-bold text-gray-300">?</span>
              <p className="text-xl mt-2 font-medium text-gray-400">
                {feeling.emoji} {feeling.label}
              </p>
            </>
          ) : (
            <>
              <span
                className="text-6xl font-bold transition-colors"
                style={{ color }}
              >
                {value}
              </span>
              <p className="text-xl mt-2 font-medium" style={{ color }}>
                {feeling.emoji} {feeling.label}
              </p>
            </>
          )}
        </div>

        {/* Slider */}
        <div className="relative pt-2">
          <input
            type="range"
            min="1"
            max="10"
            value={displayValue}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="w-full h-3 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${getFeelingColor(1)} 0%, ${getFeelingColor(5)} 50%, ${getFeelingColor(10)} 100%)`,
            }}
          />

          {/* Scale labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>

        {/* Quick select buttons */}
        <div className="flex justify-center gap-1 mt-4 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              onClick={() => onChange(num)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                value === num
                  ? 'text-white shadow-md scale-110'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={value === num ? { backgroundColor: getFeelingColor(num) } : {}}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeelingScale;
