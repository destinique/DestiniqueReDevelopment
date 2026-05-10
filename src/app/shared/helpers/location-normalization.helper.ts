import { LocationData } from '../interfaces/search-state.interface';

/**
 * Lookup rules for normalizing Google Places / URL-derived location text.
 * Add new entries here to extend global find/replace behavior.
 */
export const LOCATION_TEXT_REPLACEMENTS: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
  // St Barthélemy → Saint Barthélemy (covers "St", "St.", and non-accented variants)
  { pattern: /\bSt\.?\s+Barth[eé]lemy\b/gi, replacement: 'Saint Barthélemy' },
  { pattern: /\bEivissa\b/gi, replacement: 'Ibiza' },  
  { pattern: /\bMetropolitan City of Rome Capital\b/gi, replacement: 'Rome' },
  { pattern: /\bCockburn Town TKCA 1ZZ\b/gi, replacement: 'Turks Islands' },
  { pattern: /\b8200 Albufeira\b/gi, replacement: 'Albufeira' },
  { pattern: /\b73040 Santa Maria di Leuca LE\b/gi, replacement: 'Santa Maria di Leuca' },
  { pattern: /\bCockburn Harbour TKCA 1ZZ\b/gi, replacement: 'Cockburn Harbour' },
  { pattern: /\b84400 Apt\b/gi, replacement: 'Apt' },
  { pattern: /\b6370 Kitzbuhel\b/gi, replacement: 'Kitzbuhel' },
  { pattern: /\bNord de Palma District\b/gi, replacement: 'Palma de Mallorca' },
  { pattern: /\b07840 Santa Eulària des Riu\b/gi, replacement: 'Santa Eulària des Riu' },
  { pattern: /\b50000 Saint-Lô\b/gi, replacement: 'Saint-Lô' },  
];

/**
 * In some destinations, Google returns city == country (e.g. islands/territories),
 * but the Destinique API expects city to be present.
 * Add such cases here (normalized strings).
 */
export const LOCATION_ALLOW_CITY_EQUALS_COUNTRY: ReadonlyArray<string> = [
  'Saint Barthélemy',
];

export function normalizeLocationString(value: string): string {
  let out = (value ?? '').toString();
  for (const rule of LOCATION_TEXT_REPLACEMENTS) {
    out = out.replace(rule.pattern, rule.replacement);
  }
  return out;
}

export function shouldKeepCityWhenEqualsCountry(country: string): boolean {
  const normalized = normalizeLocationString(country).trim();
  return LOCATION_ALLOW_CITY_EQUALS_COUNTRY.some((c) => c === normalized);
}

export function normalizeLocationData(location: LocationData): LocationData {
  return {
    ...location,
    text: normalizeLocationString(location.text),
    city: normalizeLocationString(location.city),
    state: normalizeLocationString(location.state),
    country: normalizeLocationString(location.country),
  };
}

