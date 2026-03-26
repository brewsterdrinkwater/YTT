import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CityWeather, CityKey, fetchAllWeather } from '../../services/weatherService';

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<Record<CityKey, CityWeather> | null>(null);
  const [activeCity, setActiveCity] = useState<CityKey>('nashville');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllWeather()
      .then((data) => {
        setWeather(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[Weather] Error:', err);
        const msg = err?.message || '';
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ERR_CONNECTION_REFUSED')) {
          setError('Backend server offline. Start it with: cd api && npm start');
        } else if (msg.includes('API key not configured')) {
          setError('OPENWEATHER_API_KEY not set in api/.env');
        } else {
          setError('Weather unavailable');
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-brand-sky to-brand-ocean rounded-2xl p-4 text-white shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🌤️</span>
          <span className="font-bold text-sm">Weather</span>
        </div>
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-gradient-to-br from-brand-sky to-brand-ocean rounded-2xl p-4 text-white shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🌤️</span>
          <span className="font-bold text-sm">Weather</span>
        </div>
        <p className="text-white/80 text-xs leading-relaxed">
          {error || 'Weather unavailable'}
        </p>
      </div>
    );
  }

  const city = weather[activeCity];
  const formatHour = (dt: number) => {
    return new Date(dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
  };
  const formatDay = (dt: number) => {
    return new Date(dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <motion.div
      layout
      className="bg-gradient-to-br from-brand-sky to-brand-ocean rounded-2xl p-4 text-white overflow-hidden shadow-sm"
    >
      {/* City Toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌤️</span>
          <span className="font-bold text-sm">Weather</span>
        </div>
        <div className="flex bg-white/20 rounded-full p-0.5">
          {(['nashville', 'nyc'] as CityKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveCity(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeCity === key
                  ? 'bg-white text-brand-ocean'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {weather[key].cityIcon} {key === 'nyc' ? 'NYC' : 'Nash'}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCity}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Current */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold">{city.current.temp}°F</div>
              <div className="text-white/80 text-xs capitalize">
                {city.current.description}
              </div>
              <div className="text-white/60 text-xs mt-0.5">
                Feels {city.current.feelsLike}° · {city.current.humidity}% humidity
              </div>
            </div>
            <div className="text-4xl">{city.current.icon}</div>
          </div>

          {/* Hourly - next 4 periods */}
          <div className="grid grid-cols-4 gap-1 mb-3 bg-white/10 rounded-xl p-2">
            {city.hourly.map((hour, i) => (
              <div key={i} className="text-center">
                <div className="text-white/70 text-[10px]">
                  {i === 0 ? 'Now' : formatHour(hour.dt)}
                </div>
                <div className="text-lg my-0.5">{hour.icon}</div>
                <div className="text-xs font-medium">{hour.temp}°</div>
                {hour.pop > 0 && (
                  <div className="text-[10px] text-blue-200">💧{hour.pop}%</div>
                )}
              </div>
            ))}
          </div>

          {/* 5-Day */}
          <div className="space-y-1">
            {city.daily.map((day, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-white/70">
                  {i === 0 ? 'Today' : formatDay(day.dt)}
                </span>
                <span className="text-sm">{day.icon}</span>
                <div className="flex-1 flex items-center gap-1">
                  <span className="text-white/60 w-8 text-right">{day.tempMin}°</span>
                  <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-300 to-orange-300 rounded-full"
                      style={{
                        marginLeft: `${((day.tempMin - 20) / 80) * 100}%`,
                        width: `${((day.tempMax - day.tempMin) / 80) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-white w-8">{day.tempMax}°</span>
                </div>
                {day.pop > 0 && (
                  <span className="text-blue-200 w-8 text-right">💧{day.pop}%</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default WeatherWidget;
