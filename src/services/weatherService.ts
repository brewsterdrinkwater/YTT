// OpenWeatherMap weather integration via backend proxy
// API key is kept server-side for security

import { API_CONFIG } from '../constants/config';

// City metadata
const CITIES = {
  nyc: { name: 'New York City', icon: '🗽' },
  nashville: { name: 'Nashville', icon: '🎸' },
} as const;

export type CityKey = keyof typeof CITIES;

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  dt: number;
}

export interface HourlyForecast {
  dt: number;
  temp: number;
  description: string;
  icon: string;
  pop: number;
}

export interface DailyForecast {
  dt: number;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
  pop: number;
}

export interface CityWeather {
  city: CityKey;
  cityName: string;
  cityIcon: string;
  current: WeatherData;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

// Map OWM icon codes to emoji
const iconToEmoji: Record<string, string> = {
  '01d': '☀️', '01n': '🌙',
  '02d': '⛅', '02n': '☁️',
  '03d': '☁️', '03n': '☁️',
  '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '🌨️', '13n': '🌨️',
  '50d': '🌫️', '50n': '🌫️',
};

const getWeatherEmoji = (iconCode: string): string => {
  return iconToEmoji[iconCode] || '🌡️';
};

const CACHE_KEY = 'ytt-weather-cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CachedWeather {
  data: Record<CityKey, CityWeather>;
  timestamp: number;
}

const getCachedWeather = (): Record<CityKey, CityWeather> | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed: CachedWeather = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
};

const setCachedWeather = (data: Record<CityKey, CityWeather>): void => {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
};

// Parse OWM forecast response into our typed format
const parseWeatherResponse = (
  data: { list: Array<{
    dt: number;
    main: { temp: number; feels_like: number; humidity: number; temp_min: number; temp_max: number };
    weather: Array<{ description: string; icon: string }>;
    wind: { speed: number };
    pop: number;
  }> },
  cityKey: CityKey
): CityWeather => {
  const cityInfo = CITIES[cityKey];
  const list = data.list;

  // Current weather (first entry)
  const current = list[0];
  const currentWeather: WeatherData = {
    temp: Math.round(current.main.temp),
    feelsLike: Math.round(current.main.feels_like),
    humidity: current.main.humidity,
    description: current.weather[0].description,
    icon: getWeatherEmoji(current.weather[0].icon),
    windSpeed: Math.round(current.wind.speed),
    dt: current.dt,
  };

  // Next 4 forecast periods
  const hourly: HourlyForecast[] = list.slice(0, 4).map((item) => ({
    dt: item.dt,
    temp: Math.round(item.main.temp),
    description: item.weather[0].description,
    icon: getWeatherEmoji(item.weather[0].icon),
    pop: Math.round(item.pop * 100),
  }));

  // 5-day forecast: group by day
  const dayMap = new Map<string, {
    minTemps: number[];
    maxTemps: number[];
    weather: { description: string; icon: string };
    pop: number[];
    dt: number;
  }>();

  for (const item of list) {
    const dayKey = new Date(item.dt * 1000).toDateString();
    const existing = dayMap.get(dayKey);
    if (existing) {
      existing.minTemps.push(item.main.temp_min);
      existing.maxTemps.push(item.main.temp_max);
      existing.pop.push(item.pop);
    } else {
      dayMap.set(dayKey, {
        minTemps: [item.main.temp_min],
        maxTemps: [item.main.temp_max],
        weather: { description: item.weather[0].description, icon: item.weather[0].icon },
        pop: [item.pop],
        dt: item.dt,
      });
    }
  }

  const daily: DailyForecast[] = Array.from(dayMap.values())
    .slice(0, 5)
    .map((day) => ({
      dt: day.dt,
      tempMin: Math.round(Math.min(...day.minTemps)),
      tempMax: Math.round(Math.max(...day.maxTemps)),
      description: day.weather.description,
      icon: getWeatherEmoji(day.weather.icon),
      pop: Math.round(Math.max(...day.pop) * 100),
    }));

  return {
    city: cityKey,
    cityName: cityInfo.name,
    cityIcon: cityInfo.icon,
    current: currentWeather,
    hourly,
    daily,
  };
};

export const fetchWeatherForCity = async (cityKey: CityKey): Promise<CityWeather> => {
  const baseUrl = API_CONFIG.QUICK_SHARE_API_URL; // Same backend server
  const response = await fetch(`${baseUrl}/api/weather/${cityKey}`);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  return parseWeatherResponse(data, cityKey);
};

export const fetchAllWeather = async (): Promise<Record<CityKey, CityWeather>> => {
  // Check cache first
  const cached = getCachedWeather();
  if (cached) return cached;

  const [nyc, nashville] = await Promise.all([
    fetchWeatherForCity('nyc'),
    fetchWeatherForCity('nashville'),
  ]);

  const result = { nyc, nashville };
  setCachedWeather(result);
  return result;
};

export const CITY_INFO = CITIES;
