import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  HostListener,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { AppNotification, NotificationType } from './notification.types';

@Component({
  selector: 'app-notification-tray',
  templateUrl: './notification-tray.component.html',
  styleUrls: ['./notification-tray.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationTrayComponent implements OnInit, OnDestroy {
  open = false;
  items: AppNotification[] = [];
  dismissedIds = new Set<string>();

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private notifications: NotificationService,
    private cdr: ChangeDetectorRef,
    private elRef: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    this.notifications.all$.pipe(takeUntil(this.destroy$)).subscribe((list) => {
      this.items = list;
      this.cdr.markForCheck();
    });

    this.notifications.dismissedIds$.pipe(takeUntil(this.destroy$)).subscribe((ids) => {
      this.dismissedIds = new Set(ids);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Total count of API notifications (regardless of dismiss state). */
  get totalCount(): number {
    return this.items.length;
  }

  /** Active alerts count (not yet dismissed). Drives badge color. */
  get activeCount(): number {
    return this.items.filter((n) => !this.dismissedIds.has(String(n.id))).length;
  }

  toggle(): void {
    this.open = !this.open;
  }

  close(): void {
    this.open = false;
  }

  trackById(_: number, n: AppNotification): string {
    return String(n.id);
  }

  isItemDismissed(n: AppNotification): boolean {
    return this.dismissedIds.has(String(n.id));
  }

  /** One of: 'success' | 'warning' | 'error' | 'info'. Drives inline SVG. */
  iconKey(n: AppNotification): 'success' | 'warning' | 'error' | 'info' {
    const type = (n.type as NotificationType) ?? 'info';
    if (type === 'success' || type === 'warning' || type === 'info') return type;
    if (type === 'error' || type === 'danger') return 'error';
    return 'info';
  }

  alertClass(n: AppNotification): string {
    const type = (n.type as NotificationType) ?? 'info';
    if (type === 'error') return 'alert-danger';
    return `alert-${type}`;
  }

  /** Close the panel when clicking outside the tray host. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId) || !this.open) return;
    const target = event.target as Node;
    if (target && !this.elRef.nativeElement.contains(target)) {
      this.open = false;
      this.cdr.markForCheck();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) {
      this.open = false;
      this.cdr.markForCheck();
    }
  }
}
