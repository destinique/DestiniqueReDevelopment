import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { StorageService } from '../services/storage.service';
import { AppNotification, ApiNotification } from './notification.types';

interface DismissedRecord {
  id: string;
  dismissedAt: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  /** Max simultaneously visible toasts (rest are queued, FIFO of newest-first) */
  static readonly MAX_VISIBLE = 3;
  /** Dismiss persistence key + 24h TTL */
  private static readonly DISMISSED_STORAGE_KEY = 'dest_dismissed_notifications_v1';
  private static readonly DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

  /** Internal: every notification fetched from API, regardless of dismiss state. */
  private readonly _state$ = new BehaviorSubject<AppNotification[]>([]);
  /** Bumps whenever the dismiss list changes so derived streams re-emit. */
  private readonly _dismissedTick$ = new BehaviorSubject<number>(0);

  /** All active API notifications (newest first). Used by the tray. */
  readonly all$: Observable<AppNotification[]> = this._state$.asObservable();

  /** Toasts at top: filters out dismissed ids, slices to MAX_VISIBLE. */
  readonly visible$: Observable<AppNotification[]> = combineLatest([
    this._state$,
    this._dismissedTick$,
  ]).pipe(
    map(([list]) => {
      const dismissed = new Set(this.getDismissedIds());
      return list
        .filter((n) => !dismissed.has(String(n.id)))
        .slice(0, NotificationService.MAX_VISIBLE);
    }),
    distinctUntilChanged(
      (a, b) => a.length === b.length && a.every((n, i) => String(n.id) === String(b[i].id))
    )
  );

  /** Stream of currently-dismissed ids (within TTL window). */
  readonly dismissedIds$: Observable<string[]> = this._dismissedTick$.pipe(
    map(() => this.getDismissedIds()),
    distinctUntilChanged((a, b) => a.length === b.length && a.every((id, i) => id === b[i]))
  );

  constructor(private storage: StorageService) {
    this.pruneDismissed();
  }

  /**
   * Replace the current set of notifications with a new list (e.g. from API).
   * Stores ALL items (dismiss filtering is applied only when deriving `visible$`).
   * Dedupes by id and sorts newest first.
   */
  setFromApi(items: ApiNotification[] | null | undefined): void {
    const incoming = Array.isArray(items) ? items : [];
    const existingById = new Map(this._state$.value.map((n) => [String(n.id), n]));

    const seen = new Set<string>();
    const next: AppNotification[] = [];
    for (const raw of incoming) {
      if (!raw || raw.id == null) continue;
      const id = String(raw.id);
      if (seen.has(id)) continue;
      seen.add(id);

      const prior = existingById.get(id);
      next.push({
        id: raw.id,
        message: raw.message ?? '',
        type: this.normalizeType(raw.type),
        duration: raw.duration ?? null,
        title: raw.title,
        receivedAt: prior?.receivedAt ?? Date.now(),
      });
    }

    next.sort((a, b) => b.receivedAt - a.receivedAt);
    this._state$.next(next);
  }

  /** Dismiss a notification: hides it from `visible$` and persists for 24h. */
  dismiss(id: number | string): void {
    const sid = String(id);
    this.persistDismissed(sid);
    this._dismissedTick$.next(this._dismissedTick$.value + 1);
  }

  clearAll(): void {
    this._state$.next([]);
  }

  /** True when the id was dismissed within the TTL window. */
  isDismissed(id: number | string): boolean {
    return this.getDismissedIds().includes(String(id));
  }

  // ===== Persistence helpers =====

  private getDismissedRecords(): DismissedRecord[] {
    try {
      const raw = this.storage.getItem(NotificationService.DISMISSED_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (r): r is DismissedRecord =>
          r && typeof r.id === 'string' && typeof r.dismissedAt === 'number'
      );
    } catch {
      return [];
    }
  }

  private getDismissedIds(): string[] {
    return this.pruneDismissed().map((r) => r.id);
  }

  private persistDismissed(id: string): void {
    const now = Date.now();
    const current = this.pruneDismissed().filter((r) => r.id !== id);
    current.push({ id, dismissedAt: now });
    try {
      this.storage.setItem(NotificationService.DISMISSED_STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore quota / privacy mode
    }
  }

  /** Remove expired dismiss records (>24h) from storage. Returns the still-valid records. */
  private pruneDismissed(): DismissedRecord[] {
    const now = Date.now();
    const valid = this.getDismissedRecords().filter(
      (r) => now - r.dismissedAt < NotificationService.DISMISS_TTL_MS
    );
    try {
      this.storage.setItem(NotificationService.DISMISSED_STORAGE_KEY, JSON.stringify(valid));
    } catch {
      // ignore
    }
    return valid;
  }

  private normalizeType(value: unknown): AppNotification['type'] {
    const s = String(value ?? '').toLowerCase();
    if (s === 'success' || s === 'warning' || s === 'error' || s === 'danger' || s === 'info') {
      return s as AppNotification['type'];
    }
    return 'info';
  }
}
