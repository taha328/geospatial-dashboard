import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss']
})
export class NotificationPanelComponent {
  @Input() notifications: Notification[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() notificationClicked = new EventEmitter<Notification>();
  @Output() markAllAsRead = new EventEmitter<void>();

  handleNotificationClick(notification: Notification) {
    this.notificationClicked.emit(notification);
    this.close.emit();
  }
}
