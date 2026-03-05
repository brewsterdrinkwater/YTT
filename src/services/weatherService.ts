// OpenWeatherMap free API integration
// Free tier: 1000 calls/day, 5-day/3-hour forecast

const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

// City coordinates for NYC and Nashville
const CITIES = {
  nyc: { lat: 40.7128, lon: -74.006, name: 'New York City', icon: '🗽' },
  nashville: { lat: 36.1627, lon: -86.7816, name: 'Nashville', icon: '🎸' },
} as const;

export type CityKey = keyof typeof CITIES;

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  dt: number; // unix timestamp
}

export interface HourlyForecast {
  dt: number;
  temp: number;
  description: string;
  icon: string;
  pop: number; // probability of precipitation
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
  hourly: HourlyForecast[]; // next 4 hours
  daily: DailyForecast[]; // next 5 days
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

export const fetchWeatherForCity = async (
  cityKey: CityKey,
  apiKey: string
): Promise<CityWeather> => {
  const city = CITIES[cityKey];

  // Fetch 5-day/3-hour forecast (includes current-ish data)
  const forecastUrl = `${OPENWEATHER_BASE}/forecast?lat=${city.lat}&lon=${city.lon}&appid=${apiKey}&units=imperial`;

  const response = await fetch(forecastUrl);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  const list = data.list as Array<{
    dt: number;
    main: { temp: number; feels_like: number; humidity: number; temp_min: number; temp_max: number };
    weather: Array<{ description: string; icon: string }>;
    wind: { speed: number };
    pop: number;
  }>;

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

  // Next 4 hours (entries are 3-hour intervals, so take first 2 and interpolate display)
  const hourly: HourlyForecast[] = list.slice(0, 4).map((item) => ({
    dt: item.dt,
    temp: Math.round(item.main.temp),
    description: item.weather[0].description,
    icon: getWeatherEmoji(item.weather[0].icon),
    pop: Math.round(item.pop * 100),
  }));

  // 5-day forecast: group by day and take min/max
  const dayMap = new Map<string, { temps: number[]; minTemps: number[]; maxTemps: number[]; weather: { description: string; icon: string }; pop: number[]; dt: number }>();

  for (const item of list) {
    const dayKey = new Date(item.dt * 1000).toDateString();
    const existing = dayMap.get(dayKey);
    if (existing) {
      existing.temps.push(item.main.temp);
      existing.minTemps.push(item.main.temp_min);
      existing.maxTemps.push(item.main.temp_max);
      existing.pop.push(item.pop);
    } else {
      dayMap.set(dayKey, {
        temps: [item.main.temp],
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
    cityName: city.name,
    cityIcon: city.icon,
    current: currentWeather,
    hourly,
    daily,
  };
};

export const fetchAllWeather = async (apiKey: string): Promise<Record<CityKey, CityWeather>> => {
  // Check cache first
  const cached = getCachedWeather();
  if (cached) return cached;

  const [nyc, nashville] = await Promise.all([
    fetchWeatherForCity('nyc', apiKey),
    fetchWeatherForCity('nashville', apiKey),
  ]);

  const result = { nyc, nashville };
  setCachedWeather(result);
  return result;
};

export const CITY_INFO = CITIES;
