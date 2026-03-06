import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';

/** Shape of stored cookie preferences. Mirrors the spec in docs/cookie-consent-specification.md */
export interface CookiePreferences {
  necessary: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  consentedAt: number;
}

const CONSENT_FLAG_KEY = 'cookieConsent';
const CONSENT_PREFS_KEY = 'cookiePreferences';

@Injectable({
  providedIn: 'root'
})
export class CookieConsentService {
  /** Current preferences (or null if user has never made a choice). */
  private readonly preferencesSubject = new BehaviorSubject<CookiePreferences | null>(null);
  readonly preferences$ = this.preferencesSubject.asObservable();

  /** Whether the first-layer banner should be visible. */
  private readonly bannerVisibleSubject = new BehaviorSubject<boolean>(false);
  readonly bannerVisible$ = this.bannerVisibleSubject.asObservable();

  /** Whether the second-layer preferences modal is open. */
  private readonly modalOpenSubject = new BehaviorSubject<boolean>(false);
  readonly modalOpen$ = this.modalOpenSubject.asObservable();

  constructor(private storage: StorageService) {
    if (!this.storage.isBrowser()) {
      // Do not show banner or modal during server-side rendering.
      return;
    }

    this.initFromStorage();
  }

  /** Snapshot getter for synchronous access from components. */
  getPreferencesSnapshot(): CookiePreferences | null {
    return this.preferencesSubject.getValue();
  }

  /** Whether the user has already given any form of consent. */
  hasConsent(): boolean {
    if (!this.storage.isBrowser()) return false;
    return this.storage.getItem(CONSENT_FLAG_KEY) === 'true';
  }

  /** Whether the banner should currently be shown. */
  isBannerVisible(): boolean {
    return this.bannerVisibleSubject.getValue();
  }

  /** Open the preferences modal (used by banner Customize and footer Manage Cookies). */
  openPreferences(): void {
    if (!this.storage.isBrowser()) return;

    // If there are no stored preferences yet, seed with defaults (necessary only).
    if (!this.getPreferencesSnapshot()) {
      const defaults: CookiePreferences = {
        necessary: true,
        analytics: false,
        functional: false,
        marketing: false,
        consentedAt: Date.now()
      };
      this.preferencesSubject.next(defaults);
    }

    this.modalOpenSubject.next(true);
  }

  /** Close the preferences modal without changing consent. */
  closePreferences(): void {
    this.modalOpenSubject.next(false);
  }

  /** Accept all categories (from banner or modal). */
  acceptAll(): void {
    if (!this.storage.isBrowser()) return;
    const now = Date.now();
    const prefs: CookiePreferences = {
      necessary: true,
      analytics: true,
      functional: true,
      marketing: true,
      consentedAt: now
    };
    this.savePreferencesInternal(prefs);
  }

  /** Reject all non-essential categories (necessary only). */
  rejectNonEssential(): void {
    if (!this.storage.isBrowser()) return;
    const now = Date.now();
    const prefs: CookiePreferences = {
      necessary: true,
      analytics: false,
      functional: false,
      marketing: false,
      consentedAt: now
    };
    this.savePreferencesInternal(prefs);
  }

  /**
   * Save preferences from the second-layer modal.
   * Necessary is always forced to true.
   */
  savePreferences(options: { analytics: boolean; functional: boolean; marketing: boolean }): void {
    if (!this.storage.isBrowser()) return;
    const now = Date.now();
    const prefs: CookiePreferences = {
      necessary: true,
      analytics: options.analytics,
      functional: options.functional,
      marketing: options.marketing,
      consentedAt: now
    };
    this.savePreferencesInternal(prefs);
  }

  /** Internal: read preferences from storage on app start. */
  private initFromStorage(): void {
    try {
      const flag = this.storage.getItem(CONSENT_FLAG_KEY);
      const rawPrefs = this.storage.getItem(CONSENT_PREFS_KEY);

      if (flag === 'true' && rawPrefs) {
        const parsed = JSON.parse(rawPrefs) as CookiePreferences;
        // Basic shape validation; necessary must always be true.
        if (typeof parsed === 'object' && parsed && parsed.necessary === true) {
          this.preferencesSubject.next(parsed);
          this.bannerVisibleSubject.next(false);
          return;
        }
      }
    } catch {
      // Ignore parse errors and fall through to showing banner.
    }

    // No valid consent found → show banner on first visit.
    this.bannerVisibleSubject.next(true);
    this.preferencesSubject.next(null);
  }

  /** Internal: persist preferences and hide banner/modal. */
  private savePreferencesInternal(prefs: CookiePreferences): void {
    this.preferencesSubject.next(prefs);
    this.storage.setItem(CONSENT_PREFS_KEY, JSON.stringify(prefs));
    this.storage.setItem(CONSENT_FLAG_KEY, 'true');

    this.bannerVisibleSubject.next(false);
    this.modalOpenSubject.next(false);
  }
}

