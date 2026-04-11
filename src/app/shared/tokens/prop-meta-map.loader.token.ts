import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import type { PropertyMetaData } from '../services/property.service';

/**
 * Server/prerender only: loads list_id → meta map (e.g. from repo-root prop_meta_data.json).
 * Not provided in the browser bundle — resolver falls back to API.
 */
export const PROP_META_MAP_LOADER = new InjectionToken<
  () => Observable<Record<string, PropertyMetaData>>
>('PROP_META_MAP_LOADER');
