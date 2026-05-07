import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  HostBinding,
} from '@angular/core';
import { AppNotification, NotificationType } from './notification.types';

@Component({
  selector: 'app-notification-toast',
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  @Input() notification!: AppNotification;
  @Output() closed = new EventEmitter<number | string>();

  /** When true, applies the slide-out CSS class so the host transitions out. */
  isLeaving = false;

  private autoDismissHandle: ReturnType<typeof setTimeout> | null = null;

  @HostBinding('class.is-leaving') get leavingClass(): boolean {
    return this.isLeaving;
  }

  ngOnInit(): void {
    const ms = Number(this.notification?.duration ?? 0);
    if (Number.isFinite(ms) && ms > 0) {
      this.autoDismissHandle = setTimeout(() => this.requestClose(), ms);
    }
  }

  ngOnDestroy(): void {
    if (this.autoDismissHandle) {
      clearTimeout(this.autoDismissHandle);
      this.autoDismissHandle = null;
    }
  }

  /** Begin the slide-out animation, then emit close after the transition. */
  requestClose(): void {
    if (this.isLeaving) return;
    this.isLeaving = true;
    if (this.autoDismissHandle) {
      clearTimeout(this.autoDismissHandle);
      this.autoDismissHandle = null;
    }
    setTimeout(() => this.closed.emit(this.notification.id), 220);
  }

  /** One of: 'success' | 'warning' | 'error' | 'info'. Drives the inline SVG. */
  iconKey(): 'success' | 'warning' | 'error' | 'info' {
    const type = this.normalizedType();
    if (type === 'success' || type === 'warning' || type === 'info') return type;
    if (type === 'error' || type === 'danger') return 'error';
    return 'info';
  }

  alertClass(): string {
    const type = this.normalizedType();
    if (type === 'error') return 'alert-danger';
    return `alert-${type}`;
  }

  private normalizedType(): NotificationType {
    return (this.notification?.type as NotificationType) ?? 'info';
  }
}
