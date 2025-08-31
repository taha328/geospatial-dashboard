import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from './services/notification.service';
import { AuthService } from './services/auth.service';
import { ProfessionalNotificationService } from './services/advanced-notification.service';
import { BrowserPopupReplacementService } from './services/popup.service';
import { Subscription } from 'rxjs';
import { NotificationPanelComponent } from './components/notification-panel/notification-panel.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

// Import ZardUI components
import { ZardButtonComponent } from './shared/components/button/index';
import { ZardCardComponent } from './shared/components/card/index';
import { ZardNavbarComponent } from './shared/components/navbar/index';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule,
    NotificationPanelComponent,
    // ZardUI Components
    ZardButtonComponent,
    ZardCardComponent,
    ZardNavbarComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'geo-dashboard';
  mobileMenuOpen = false;
  notificationPanelOpen = false;
  notifications: Notification[] = [];
  unreadNotificationCount = 0;
  
  // Add the missing isLoggedIn property
  isLoggedIn = false;
  isAdmin = false;
  
  private authSub?: Subscription;
  private profileSub?: Subscription;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private auth: AuthService,
    private http: HttpClient,
    private professionalNotification: ProfessionalNotificationService,
    private browserPopup: BrowserPopupReplacementService
  ) {}

  ngOnInit() {
    this.loadNotifications();
    this.notificationService.refresh$.subscribe(() => {
      this.loadNotifications();
    });
    
    // Subscribe to local immediate notifications
    this.notificationService.localNotifications$.subscribe(n => {
      // prepend and update counts
      this.notifications.unshift(n);
      this.unreadNotificationCount = this.notifications.filter(x => !x.read).length;
    });

    // Subscribe to auth state and redirect to login if logged out
    this.authSub = this.auth.authState$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn; // Update the component property
      if (!isLoggedIn) {
        // Don't redirect to login if user is on public routes (invitation flow)
        // Use setTimeout to ensure route is resolved
        setTimeout(() => {
          const currentUrl = this.router.url;
          const publicRoutes = ['/set-password', '/reset-password', '/login'];
          const isOnPublicRoute = publicRoutes.some(route => currentUrl.includes(route));

          if (!isOnPublicRoute) {
            this.router.navigate(['/login']);
          }
        }, 50);

        this.isAdmin = false; // Reset admin status when logged out
      } else {
        // Load profile only when logged in to determine admin visibility
        console.log('Loading user profile for admin check...');
        this.profileSub = this.http.get<any>(`${environment.apiUrl}/auth/me`).subscribe({
          next: profile => {
            console.log('Profile received:', profile);
            const role = Array.isArray(profile?.roles) ? profile.roles[0] : profile?.role;
            console.log('Extracted role:', role);
            this.isAdmin = role === 'administrateur';
            console.log('Is admin:', this.isAdmin);
          },
          error: (error) => {
            console.error('Error loading profile:', error);
            this.isAdmin = false;
          }
        });
      }
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
    // If opening, ensure the latest notifications are loaded
    if (this.notificationPanelOpen) {
      this.loadNotifications();
    }
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

  logout() {
    this.auth.logout();
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
    this.profileSub?.unsubscribe();
  }
}