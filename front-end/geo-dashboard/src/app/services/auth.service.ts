import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface LoginResponse {
  accessToken: string;
  expiresIn?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessToken: string | null = null;
  private storageKey = 'gd_access_token';

  // Auth state observable: true if logged in, false if logged out
  public authState$ = new BehaviorSubject<boolean>(this.isLoggedIn());

  constructor(private http: HttpClient, private router: Router) {
    // Initialize auth state based on token presence
    const token = this.getToken();
    if (token) {
      this.accessToken = token;
    }
    // Emit initial state without causing immediate redirects
    this.authState$.next(!!this.accessToken);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => {
        this.setSession(res);
        this.authState$.next(true);
      })
    );
  }

  /**
   * Request password reset for existing users. Backend should verify that the
   * email exists in the database before sending reset email
   */
  forgotPassword(email: string): Observable<any> {
    console.log('🔍 AuthService.forgotPassword - Sending request for:', email);

    return this.http.post<any>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  /**
   * Set a new password using a reset token
   */
  setPassword(email: string, password: string, token: string): Observable<any> {
    console.log('🔍 AuthService.setPassword - Setting password for:', email);

    return this.http.post<any>(`${environment.apiUrl}/auth/set-password`, {
      email,
      password,
      token
    });
  }
  logout(): void {
    // Clear tokens from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    // Clear in-memory token
    this.accessToken = null;
    
    // Update auth state to trigger guards
    this.authState$.next(false);
    
    // Navigate to login and replace current history entry to prevent back button access
    this.router.navigate(['/login'], { replaceUrl: true });
    
    // Optional: Clear browser history for additional security
    // This prevents back button navigation to authenticated pages
    if (window.history.replaceState) {
      window.history.replaceState(null, '', '/login');
    }
  }

  getToken(): string | null {
    // Prefer the in-memory token, but fall back to localStorage so
    // tokens pasted into the console or set by other pages are picked up
    if (this.accessToken) return this.accessToken;
    try {
      const t = localStorage.getItem(this.storageKey) || localStorage.getItem('jwt');
      if (t) {
        // Check if token is expired
        if (this.isTokenExpired(t)) {
          console.log('Token expired, logging out');
          this.logout();
          return null;
        }
        this.accessToken = t;
      }
      return t;
    } catch (e) {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Consider invalid tokens as expired
    }
  }

  isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  private setSession(resp: LoginResponse) {
    this.accessToken = resp.accessToken;
    try { localStorage.setItem(this.storageKey, resp.accessToken); } catch (e) {}
  this.authState$.next(true);
  }
}
