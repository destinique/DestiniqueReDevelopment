import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { NotificationApiService } from './notification-api.service';
import { AppNotification } from './notification.types';

@Component({
  selector: 'app-notification',
  templateUrl: './notification-container.component.html',
  styleUrls: ['./notification-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationContainerComponent implements OnInit, OnDestroy {
  visible: AppNotification[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private notifications: NotificationService,
    private api: NotificationApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.notifications.visible$.pipe(takeUntil(this.destroy$)).subscribe((list) => {
      this.visible = list;
      this.cdr.markForCheck();
    });

    // SSR/prerender guard: no API calls server-side; render nothing until client takes over.
    if (isPlatformBrowser(this.platformId)) {
      this.api.start();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackById(_: number, n: AppNotification): string {
    return String(n.id);
  }

  onClosed(id: number | string): void {
    this.notifications.dismiss(id);
  }
}
