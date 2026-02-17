import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({ providedIn: 'root' })
export class LoadSpinnerService {
  private readonly defaultMessage = 'Loading...';
  private readonly _message$ = new BehaviorSubject<string>(this.defaultMessage);

  readonly message$ = this._message$.asObservable();

  constructor(private spinner: NgxSpinnerService) {}

  /** Show spinner with optional message. Omit message for default "Loading...". */
  show(message?: string): void {
    const msg = message ?? this.defaultMessage;
    setTimeout(() => this._message$.next(msg), 0);
    this.spinner.show();
  }

  /** Hide spinner. */
  hide(): void {
    this.spinner.hide();
  }

  /** Reset message to default (e.g. on route change). */
  reset(): void {
    setTimeout(() => this._message$.next(this.defaultMessage), 0);
  }
}

