import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from './services/notification.service';
import { NotificationPanelComponent } from './components/notification-panel/notification-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, NotificationPanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'geo-dashboard';
  mobileMenuOpen = false;
  notificationPanelOpen = false;
  notifications: Notification[] = [];
  unreadNotificationCount = 0;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadNotifications();
    this.notificationService.refresh$.subscribe(() => {
      this.loadNotifications();
    });
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe(notifications => {
      this.notifications = notifications;
      this.unreadNotificationCount = notifications.filter(n => !n.read).length;
    });
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  toggleNotificationPanel() {
    this.notificationPanelOpen = !this.notificationPanelOpen;
  }

  closeNotificationPanel() {
    this.notificationPanelOpen = false;
  }

  onNotificationClicked(notification: Notification) {
    // Mark as read and navigate
    notification.read = true;
    this.unreadNotificationCount = this.notifications.filter(n => !n.read).length;
    
    if (notification.link) {
      this.router.navigate([notification.link]);
    }
  }

  markAllNotificationsAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.unreadNotificationCount = 0;
  }
}
