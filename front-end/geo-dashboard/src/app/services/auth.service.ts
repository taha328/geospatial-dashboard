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
    // restore token if present (optional)
    const t = localStorage.getItem(this.storageKey);
    if (t) this.accessToken = t;
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
   * First-time set password for invited users. Backend should verify that the
   * email exists and is allowed to set a password (invited and no password yet)
   */
  setPassword(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/set-password`, { email, password });
  }
logout() {
  // Clear in-memory token and any token keys that might have been used
  this.accessToken = null;
  try { localStorage.removeItem(this.storageKey); } catch (e) {}
  try { localStorage.removeItem('jwt'); } catch (e) {}

  // Optionally call backend logout to clear refresh cookie (do not block navigation)
  try { this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe(); } catch (e) {}

  // Emit logged out state - let AppComponent handle navigation
  this.authState$.next(false);
}

  getToken(): string | null {
    // Prefer the in-memory token, but fall back to localStorage so
    // tokens pasted into the console or set by other pages are picked up
    if (this.accessToken) return this.accessToken;
    try {
      const t = localStorage.getItem(this.storageKey) || localStorage.getItem('jwt');
      if (t) this.accessToken = t;
      return t;
    } catch (e) {
      return null;
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
