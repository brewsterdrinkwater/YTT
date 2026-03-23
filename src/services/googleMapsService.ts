/**
 * Google Maps Places API (New) Service
 *
 * Uses Places API v1 (places.googleapis.com/v1) which supports CORS
 * requests directly from the browser with an API key.
 *
 * Requires: VITE_GOOGLE_MAPS_API_KEY in .env
 * Enable in Google Cloud Console: Places API (New)
 */

import { API_CONFIG } from '../constants/config';

const BASE = API_CONFIG.GOOGLE_PLACES_API_URL;

// --------------------------------------------------------------------------
// Response shape helpers
// --------------------------------------------------------------------------

interface PlacesApiPlace {
  id?: string;
  displayName?: { text: string };
  googleMapsUri?: string;
  formattedAddress?: string;
  priceLevel?: string;
  primaryTypeDisplayName?: { text: string };
  currentOpeningHours?: {
    openNow?: boolean;
    periods?: Array<{
      open?: { day: number; hour: number; minute?: number };
      close?: { day: number; hour: number; minute?: number };
    }>;
    weekdayDescriptions?: string[];
  };
  addressComponents?: Array<{
    longText: string;
    types: string[];
  }>;
}

// What we expose to the app
export interface PlaceLookupResult {
  placeId: string;
  googleMapsUri: string;
  priceLevel?: 1 | 2 | 3 | 4;
  isOpenNow?: boolean;
  closingTime?: string; // e.g. "10:00 PM"
  primaryCuisine?: string;
  neighborhood?: string;
  formattedAddress?: string;
}

export interface PlaceHours {
  isOpenNow: boolean;
  closingTime?: string;
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

const mapPriceLevel = (level?: string): 1 | 2 | 3 | 4 | undefined => {
  switch (level) {
    case 'PRICE_LEVEL_FREE':
    case 'PRICE_LEVEL_INEXPENSIVE':
      return 1;
    case 'PRICE_LEVEL_MODERATE':
      return 2;
    case 'PRICE_LEVEL_EXPENSIVE':
      return 3;
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return 4;
    default:
      return undefined;
  }
};

const formatHour = (hour: number, minute = 0): string => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h12}:${minute.toString().padStart(2, '0')} ${ampm}`;
};

const extractClosingTime = (
  openingHours: PlacesApiPlace['currentOpeningHours']
): string | undefined => {
  if (!openingHours?.openNow || !openingHours.periods) return undefined;

  const dayOfWeek = new Date().getDay(); // 0=Sun
  const todayPeriod = openingHours.periods.find((p) => p.open?.day === dayOfWeek);
  if (!todayPeriod?.close) return undefined;

  return formatHour(todayPeriod.close.hour, todayPeriod.close.minute);
};

const extractNeighborhood = (components?: PlacesApiPlace['addressComponents']): string | undefined => {
  if (!components) return undefined;
  // Try neighborhood, then sublocality, then locality
  const types = ['neighborhood', 'sublocality', 'sublocality_level_1'];
  for (const type of types) {
    const comp = components.find((c) => c.types.includes(type));
    if (comp) return comp.longText;
  }
  return undefined;
};

const parsePlaceResult = (place: PlacesApiPlace): PlaceLookupResult | null => {
  if (!place.id) return null;
  return {
    placeId: place.id,
    googleMapsUri: place.googleMapsUri || '',
    priceLevel: mapPriceLevel(place.priceLevel),
    isOpenNow: place.currentOpeningHours?.openNow,
    closingTime: extractClosingTime(place.currentOpeningHours),
    primaryCuisine: place.primaryTypeDisplayName?.text,
    neighborhood: extractNeighborhood(place.addressComponents),
    formattedAddress: place.formattedAddress,
  };
};

// --------------------------------------------------------------------------
// API calls
// --------------------------------------------------------------------------

const SEARCH_FIELDS = [
  'places.id',
  'places.displayName',
  'places.googleMapsUri',
  'places.formattedAddress',
  'places.priceLevel',
  'places.primaryTypeDisplayName',
  'places.currentOpeningHours',
  'places.addressComponents',
].join(',');

const HOURS_FIELDS = 'currentOpeningHours';

/**
 * Search for a restaurant by name (+ optional location hint).
 * Returns the top result with all metadata.
 */
export const searchRestaurant = async (
  name: string,
  locationHint?: string
): Promise<PlaceLookupResult | null> => {
  const key = API_CONFIG.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const query = locationHint ? `${name} restaurant ${locationHint}` : `${name} restaurant`;

  try {
    const res = await fetch(`${BASE}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': SEARCH_FIELDS,
      },
      body: JSON.stringify({ textQuery: query }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const place: PlacesApiPlace | undefined = data.places?.[0];
    if (!place) return null;

    return parsePlaceResult(place);
  } catch {
    return null;
  }
};

/**
 * Fetch only the current opening hours for a known place ID.
 * Lightweight — use this when the deck is loaded to refresh open/closed status.
 */
export const getPlaceHours = async (placeId: string): Promise<PlaceHours | null> => {
  const key = API_CONFIG.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(`${BASE}/places/${placeId}?fields=${HOURS_FIELDS}`, {
      headers: { 'X-Goog-Api-Key': key },
    });

    if (!res.ok) return null;
    const data: PlacesApiPlace = await res.json();
    const hours = data.currentOpeningHours;
    if (!hours) return null;

    return {
      isOpenNow: hours.openNow ?? false,
      closingTime: extractClosingTime(hours),
    };
  } catch {
    return null;
  }
};

/**
 * Batch fetch hours for multiple places in parallel (capped at 8 concurrent).
 * Returns a map of placeId → hours.
 */
export const batchGetHours = async (
  placeIds: string[]
): Promise<Record<string, PlaceHours>> => {
  const key = API_CONFIG.GOOGLE_MAPS_API_KEY;
  if (!key || placeIds.length === 0) return {};

  const chunks: string[][] = [];
  for (let i = 0; i < placeIds.length; i += 8) {
    chunks.push(placeIds.slice(i, i + 8));
  }

  const result: Record<string, PlaceHours> = {};

  for (const chunk of chunks) {
    const settled = await Promise.allSettled(
      chunk.map(async (id) => {
        const hours = await getPlaceHours(id);
        return { id, hours };
      })
    );

    settled.forEach((s) => {
      if (s.status === 'fulfilled' && s.value.hours) {
        result[s.value.id] = s.value.hours;
      }
    });
  }

  return result;
};

export const googleMapsService = { searchRestaurant, getPlaceHours, batchGetHours };
