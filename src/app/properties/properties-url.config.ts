import { SearchState } from '../shared/interfaces/search-state.interface';

/**
 * Configuration for building shareable URLs from search state.
 * Controls which defaults are omitted and optional features like list ID in URL.
 */
export interface PropertiesUrlConfig {
  /** Default page - omit from query when value equals this */
  defaultPage: number;
  /** Default pageSize - omit from query when value equals this */
  defaultPageSize: number;
  /** Default sortBy - omit from query when value equals this */
  defaultSortBy: string;
  /** Whether to include listId in URL when list ID search is active (future use) */
  includeListIdInUrl: boolean;
}

export const DEFAULT_PROPERTIES_URL_CONFIG: PropertiesUrlConfig = {
  defaultPage: 1,
  defaultPageSize: 12,
  defaultSortBy: 'newest',
  includeListIdInUrl: false
};

/**
 * Result of building a URL from search state.
 * pathCommands: for Router.navigate(pathCommands, { queryParams, replaceUrl })
 */
export interface PropertiesUrlResult {
  pathCommands: (string | number)[];
  queryParams: Record<string, string>;
}

/**
 * Build URL path and query params from SearchState for sharing.
 * Uses config to omit default values and keep URLs minimal.
 */
export function buildUrlFromState(
  state: SearchState,
  config: PropertiesUrlConfig = DEFAULT_PROPERTIES_URL_CONFIG
): PropertiesUrlResult {
  const queryParams: Record<string, string> = {};

  // --- Path: /properties or /properties/:city ---
  // Pass raw text; Router encodes path segments (avoid double-encoding)
  const pathCommands: (string | number)[] = state.location?.text
    ? ['/properties', state.location.text]
    : ['/properties'];

  // --- Dates ---
  if (state.checkIn) {
    queryParams['checkIn'] = formatDateForUrl(state.checkIn);
  }
  if (state.checkOut) {
    queryParams['checkOut'] = formatDateForUrl(state.checkOut);
  }

  // --- Location extras (for rehydrating place) ---
  if (state.location?.latitude != null) {
    queryParams['latitude'] = String(state.location.latitude);
  }
  if (state.location?.longitude != null) {
    queryParams['longitude'] = String(state.location.longitude);
  }
  if (state.location?.state) {
    queryParams['state'] = state.location.state;
  }
  if (state.location?.country) {
    queryParams['country'] = state.location.country;
  }
  if (state.location?.placeId) {
    queryParams['placeId'] = state.location.placeId;
  }

  // --- Numeric filters ---
  if (state.minBedrooms !== undefined) {
    queryParams['minBedrooms'] = String(state.minBedrooms);
  }
  if (state.minBathrooms !== undefined) {
    queryParams['minBathrooms'] = String(state.minBathrooms);
  }
  if (state.minGuests !== undefined) {
    queryParams['minGuests'] = String(state.minGuests);
  }
  if (state.minPrice !== undefined) {
    queryParams['minPrice'] = String(state.minPrice);
  }
  if (state.maxPrice !== undefined) {
    queryParams['maxPrice'] = String(state.maxPrice);
  }

  // --- Pagination (omit if default) ---
  if (state.page !== undefined && state.page !== config.defaultPage) {
    queryParams['page'] = String(state.page);
  }
  if (state.pageSize !== undefined && state.pageSize !== config.defaultPageSize) {
    queryParams['pageSize'] = String(state.pageSize);
  }

  // --- Sort (omit if default) ---
  if (state.sortBy && state.sortBy !== config.defaultSortBy) {
    queryParams['sortBy'] = state.sortBy;
  }

  // --- Array filters (comma-separated) ---
  if (state.amenities?.length) {
    queryParams['amenities'] = state.amenities.join(',');
  }
  if (state.providers?.length) {
    queryParams['providers'] = state.providers.join(',');
  }
  if (state.propertyTypes?.length) {
    queryParams['propertyTypes'] = state.propertyTypes.join(',');
  }
  if (state.viewTypes?.length) {
    queryParams['viewTypes'] = state.viewTypes.join(',');
  }

  // --- Booleans (only include when true) ---
  if (state.searchExact) {
    queryParams['searchExact'] = 'true';
  }
  if (state.petFriendly) {
    queryParams['petFriendly'] = 'true';
  }

  return { pathCommands, queryParams };
}

function formatDateForUrl(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Build the full URL string (path + query) for comparison with Router.url.
 * Query params are sorted for deterministic comparison.
 */
export function buildUrlString(
  state: SearchState,
  config: PropertiesUrlConfig = DEFAULT_PROPERTIES_URL_CONFIG
): string {
  const { pathCommands, queryParams } = buildUrlFromState(state, config);
  const fullPath = pathCommands.join('/');
  const keys = Object.keys(queryParams).sort();
  if (keys.length === 0) {
    return fullPath;
  }
  const query = keys.map(k => `${k}=${queryParams[k]}`).join('&');
  return `${fullPath}?${query}`;
}

/**
 * Compare current browser URL with desired URL built from state.
 * Handles query param order differences for equivalence check.
 */
export function areUrlsEquivalent(
  currentUrl: string,
  state: SearchState,
  config: PropertiesUrlConfig = DEFAULT_PROPERTIES_URL_CONFIG
): boolean {
  const desired = buildUrlString(state, config);
  const [curPath, curQuery] = currentUrl.split('?');
  const [desPath, desQuery] = desired.split('?');

  // Compare decoded paths (currentUrl is encoded; desired uses raw values)
  try {
    if (decodeURIComponent(curPath) !== decodeURIComponent(desPath)) {
      return false;
    }
  } catch {
    if (curPath !== desPath) return false;
  }
  const curParams = parseQueryString(curQuery || '');
  const desParams = parseQueryString(desQuery || '');
  const curKeys = Object.keys(curParams).sort();
  const desKeys = Object.keys(desParams).sort();
  if (curKeys.length !== desKeys.length) return false;
  for (let i = 0; i < curKeys.length; i++) {
    if (curKeys[i] !== desKeys[i] || curParams[curKeys[i]] !== desParams[curKeys[i]]) {
      return false;
    }
  }
  return true;
}

function parseQueryString(qs: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!qs) return out;
  qs.split('&').forEach(pair => {
    const eq = pair.indexOf('=');
    const k = eq >= 0 ? decodeURIComponent(pair.slice(0, eq)) : pair;
    const v = eq >= 0 ? decodeURIComponent(pair.slice(eq + 1)) : '';
    if (k) out[k] = v ?? '';
  });
  return out;
}
