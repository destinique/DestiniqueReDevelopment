import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription, timer } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { NotificationService } from './notification.service';
import { ApiNotification, NotificationApiResponse } from './notification.types';

@Injectable({ providedIn: 'root' })
export class NotificationApiService implements OnDestroy {
  /** Public, no auth */
  private static readonly API_URL = 'https://api.destinique.com/api-user/notifications.php';
  /** Poll every 120s while tab is visible */
  private static readonly POLL_INTERVAL_MS = 120 * 1000;
  /** Suppress repeated error toasts within this window (ms) */
  private static readonly ERROR_TOAST_COOLDOWN_MS = 10 * 60 * 1000;

  private destroy$ = new Subject<void>();
  private pollSub: Subscription | null = null;
  private visibilityHandler: (() => void) | null = null;
  private started = false;
  private lastErrorToastAt = 0;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private notifications: NotificationService,
    private toast: ToastrService
  ) {}

  /** Start polling. Safe to call multiple times; only starts once and only in the browser. */
  start(): void {
    if (this.started) return;
    if (!isPlatformBrowser(this.platformId)) return; // SSR/prerender: no-op
    this.started = true;

    // Immediate first fetch + then poll
    this.fetchOnce();
    this.startPolling();

    this.visibilityHandler = () => this.handleVisibilityChange();
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  stop(): void {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
      this.pollSub = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    this.started = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stop();
  }

  // ===== internal =====

  private startPolling(): void {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
      this.pollSub = null;
    }
    if (typeof document !== 'undefined' && document.hidden) {
      // Tab hidden: do not start the timer; we'll start when it becomes visible.
      return;
    }
    this.pollSub = timer(
      NotificationApiService.POLL_INTERVAL_MS,
      NotificationApiService.POLL_INTERVAL_MS
    )
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.requestList())
      )
      .subscribe((items) => {
        if (items) this.notifications.setFromApi(items);
      });
  }

  private fetchOnce(): void {
    this.requestList()
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        if (items) this.notifications.setFromApi(items);
      });
  }

  private requestList() {
    return this.http
      .get<NotificationApiResponse | ApiNotification[]>(NotificationApiService.API_URL)
      .pipe(
        catchError(() => {
          this.maybeShowErrorToast();
          return of(null);
        }),
        switchMap((resp) => {
          const list = this.extractList(resp);
          return of(list);
        })
      );
  }

  private extractList(
    resp: NotificationApiResponse | ApiNotification[] | null
  ): ApiNotification[] | null {
    if (!resp) return null;
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp.data)) return resp.data;
    if (Array.isArray(resp.notifications)) return resp.notifications;
    return [];
  }

  private handleVisibilityChange(): void {
    if (typeof document === 'undefined') return;
    if (document.hidden) {
      if (this.pollSub) {
        this.pollSub.unsubscribe();
        this.pollSub = null;
      }
    } else if (!this.pollSub) {
      // Re-fetch on focus for freshness, then resume polling
      this.fetchOnce();
      this.startPolling();
    }
  }

  private maybeShowErrorToast(): void {
    const now = Date.now();
    if (now - this.lastErrorToastAt < NotificationApiService.ERROR_TOAST_COOLDOWN_MS) {
      return;
    }
    this.lastErrorToastAt = now;
    try {
      this.toast.error('Could not load notifications.');
    } catch {
      // ngx-toastr unavailable in some contexts (e.g. SSR); ignore
    }
  }
}
