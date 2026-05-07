export type NotificationType = 'success' | 'info' | 'warning' | 'error' | 'danger';

/** Shape returned by the notifications API. Extra fields are tolerated. */
export interface ApiNotification {
  id: number | string;
  message: string;
  type: NotificationType;
  /** Auto-dismiss duration in ms. 0 / undefined / null = persistent until manually closed. */
  duration?: number | null;
  title?: string;
}

export interface AppNotification extends ApiNotification {
  /** Internal: timestamp when the notification entered the queue */
  receivedAt: number;
}

export interface NotificationApiResponse {
  data?: ApiNotification[];
  notifications?: ApiNotification[];
}
