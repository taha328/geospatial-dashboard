import { Injectable } from '@angular/core';
import { CanActivateFn, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private http: HttpClient, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const required = route.data['roles'] as string[] | undefined;
    console.log('RoleGuard: Checking access for route:', state.url, 'Required roles:', required);
    
    if (!required || required.length === 0) return of(true);

    return this.http.get<any>(`${environment.apiUrl}/auth/me`).pipe(
      map(profile => {
        console.log('RoleGuard: Profile received:', profile);
        // backend may return a single 'role' string or a 'roles' array
        let roles: string[] = [];
        if (Array.isArray(profile?.roles)) roles = profile.roles;
        else if (typeof profile?.role === 'string') roles = [profile.role];

        console.log('RoleGuard: Extracted roles:', roles);
        const ok = required.some(r => roles.includes(r));
        console.log('RoleGuard: Access granted:', ok);
        
        if (!ok) this.router.navigate(['/']);
        return ok;
      }),
      catchError((error) => { 
        console.error('RoleGuard: Error or unauthorized:', error);
        this.router.navigate(['/login']); 
        return of(false); 
      })
    );
  }
}
