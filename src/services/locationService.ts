import { AutoDetectedLocation, Location } from '../types';

// HTML5 Geolocation API
export const detectViaGPS = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  });
};

// Google Geolocation API (WiFi-based)
export const detectViaWiFi = async (apiKey?: string): Promise<Location> => {
  if (!apiKey) {
    throw new Error('Google Geolocation API key is required');
  }

  const response = await fetch(
    `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ considerIp: true }),
    }
  );

  if (!response.ok) {
    throw new Error('WiFi-based location detection failed');
  }

  const data = await response.json();
  return {
    lat: data.location.lat,
    lng: data.location.lng,
    accuracy: data.accuracy,
  };
};

// IP-based location detection (fallback)
export const detectViaIP = async (): Promise<Location> => {
  // Using a free IP geolocation service
  const response = await fetch('https://ipapi.co/json/');

  if (!response.ok) {
    throw new Error('IP-based location detection failed');
  }

  const data = await response.json();
  return {
    lat: data.latitude,
    lng: data.longitude,
    accuracy: 10000, // IP-based is less accurate
  };
};

// Reverse geocoding
export const reverseGeocode = async (
  lat: number,
  lng: number,
  apiKey?: string
): Promise<string> => {
  if (!apiKey) {
    // Fallback: return coordinates-based guess
    return guessLocationFromCoords(lat, lng);
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
  );

  if (!response.ok) {
    return guessLocationFromCoords(lat, lng);
  }

  const data = await response.json();

  if (data.results && data.results.length > 0) {
    const city = data.results[0].address_components.find(
      (c: { types: string[]; long_name: string }) => c.types.includes('locality')
    );
    return city?.long_name || 'Unknown';
  }

  return 'Unknown';
};

// Fallback location guessing based on coordinates
const guessLocationFromCoords = (lat: number, lng: number): string => {
  // Nashville area
  if (lat > 35.9 && lat < 36.3 && lng > -87 && lng < -86.5) {
    return 'Nashville';
  }
  // NYC area
  if (lat > 40.5 && lat < 41 && lng > -74.5 && lng < -73.5) {
    return 'NYC';
  }
  return 'Unknown Location';
};

// Main detection function with fallbacks
export const detectLocation = async (
  googleApiKey?: string
): Promise<AutoDetectedLocation | null> => {
  let location: Location | null = null;
  let source: 'gps' | 'wifi' | 'ip' = 'gps';
  let confidence = 0.9;

  // Try GPS first
  try {
    location = await detectViaGPS();
    source = 'gps';
    confidence = 0.95;
  } catch (gpsError) {
    console.log('GPS detection failed, trying WiFi...');

    // Try WiFi next
    if (googleApiKey) {
      try {
        location = await detectViaWiFi(googleApiKey);
        source = 'wifi';
        confidence = 0.85;
      } catch (wifiError) {
        console.log('WiFi detection failed, trying IP...');
      }
    }

    // Fall back to IP
    if (!location) {
      try {
        location = await detectViaIP();
        source = 'ip';
        confidence = 0.5;
      } catch (ipError) {
        console.error('All location detection methods failed');
        return null;
      }
    }
  }

  if (!location) return null;

  // Get city name
  const cityName = await reverseGeocode(location.lat, location.lng, googleApiKey);

  return {
    name: cityName,
    coords: {
      latitude: location.lat,
      longitude: location.lng,
    },
    source,
    confidence,
    verified: false,
    timestamp: new Date().toISOString(),
  };
};

export default {
  detectLocation,
  detectViaGPS,
  detectViaWiFi,
  detectViaIP,
  reverseGeocode,
};
