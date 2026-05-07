import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationContainerComponent } from './notification-container.component';
import { NotificationToastComponent } from './notification-toast.component';
import { NotificationTrayComponent } from './notification-tray.component';

@NgModule({
  declarations: [
    NotificationContainerComponent,
    NotificationToastComponent,
    NotificationTrayComponent,
  ],
  imports: [CommonModule],
  exports: [NotificationContainerComponent, NotificationTrayComponent],
})
export class NotificationsModule {}
