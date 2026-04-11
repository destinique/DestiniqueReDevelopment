/**
 * Server bundle only — imported from AppServerModule only (do not import from browser code).
 * Reads repo-root prop_meta_data.json from disk during prerender/SSR; not copied into the browser build.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { defer, Observable, of } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import type { PropertyMetaData } from '../services/property.service';

let propMetaMap$: Observable<Record<string, PropertyMetaData>> | null = null;

export function createServerPropMetaMapLoader(): () => Observable<Record<string, PropertyMetaData>> {
  return () => {
    if (!propMetaMap$) {
      propMetaMap$ = defer(() => {
        try {
          const fullPath = join(process.cwd(), 'prop_meta_data.json');
          const raw = readFileSync(fullPath, 'utf-8');
          const map = JSON.parse(raw) as Record<string, PropertyMetaData>;
          return of(map && typeof map === 'object' ? map : {});
        } catch {
          return of({});
        }
      }).pipe(shareReplay(1));
    }
    return propMetaMap$;
  };
}
