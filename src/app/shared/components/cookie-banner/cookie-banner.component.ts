import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CookieConsentService, CookiePreferences } from '../../services/cookie-consent.service';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cookie-banner.component.html',
  styleUrls: ['./cookie-banner.component.scss']
})
export class CookieBannerComponent implements OnInit, OnDestroy {
  bannerVisible = false;
  modalOpen = false;

  // Local toggle state for modal
  analytics = false;
  functional = false;
  marketing = false;

  private subs: Subscription[] = [];

  constructor(private cookieConsent: CookieConsentService) {}

  ngOnInit(): void {
    this.subs.push(
      this.cookieConsent.bannerVisible$.subscribe(visible => {
        this.bannerVisible = visible;
      }),
      this.cookieConsent.modalOpen$.subscribe(open => {
        this.modalOpen = open;
        if (open) {
          this.syncFromPreferences();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  /** First-layer actions */
  onAcceptAll(): void {
    this.cookieConsent.acceptAll();
  }

  onRejectNonEssential(): void {
    this.cookieConsent.rejectNonEssential();
  }

  onCustomize(): void {
    this.cookieConsent.openPreferences();
  }

  /** Second-layer modal actions */
  onSavePreferences(): void {
    this.cookieConsent.savePreferences({
      analytics: this.analytics,
      functional: this.functional,
      marketing: this.marketing
    });
  }

  onAcceptAllFromModal(): void {
    this.cookieConsent.acceptAll();
  }

  onRejectAllFromModal(): void {
    this.cookieConsent.rejectNonEssential();
  }

  onCloseModal(): void {
    this.cookieConsent.closePreferences();
  }

  /** Sync modal toggles from stored or default preferences. */
  private syncFromPreferences(): void {
    const prefs: CookiePreferences | null = this.cookieConsent.getPreferencesSnapshot();
    if (prefs) {
      this.analytics = !!prefs.analytics;
      this.functional = !!prefs.functional;
      this.marketing = !!prefs.marketing;
    } else {
      // Default: necessary only
      this.analytics = false;
      this.functional = false;
      this.marketing = false;
    }
  }
}

