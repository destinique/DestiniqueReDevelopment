import { Component } from '@angular/core';
import { CookieConsentService } from 'src/app/shared/services/cookie-consent.service';

@Component({
  selector: 'app-dest-cookie-policy',
  templateUrl: './dest-cookie-policy.component.html',
  styleUrls: ['./dest-cookie-policy.component.scss']
})
export class DestCookiePolicyComponent {
  constructor(private cookieConsent: CookieConsentService) {}

  openCookiePreferences(): void {
    this.cookieConsent.openPreferences();
  }
}
