import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { SearchStateService } from '../shared/services/search-state.service';

/**
 * Resolver: Initialize SearchState from URL path and query params BEFORE PropertyListComponent loads.
 * Prevents the initial "default state" API call; only one API call is made with the correct filters.
 */
export const propertiesResolver: ResolveFn<void> = (route, _state) => {
  const searchState = inject(SearchStateService);
  const merged: Record<string, any> = { ...route.queryParams };
  if (route.paramMap.get('city') != null) {
    merged['city'] = route.paramMap.get('city');
  }
  if (Object.keys(merged).length > 0) {
    searchState.initializeFromUrlParams(merged);
  }
  return of(void 0);
};
