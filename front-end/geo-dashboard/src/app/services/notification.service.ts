import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Notification {
  id: number;
  type: 'anomalie' | 'maintenance';
  message: string;
  date: Date;
  read: boolean;
  link?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private refreshSubject = new Subject<void>();
  refresh$ = this.refreshSubject.asObservable();
  triggerRefresh() {
    this.refreshSubject.next();
  }
  // You may need to adjust these endpoints to match your backend
  private anomaliesUrl = 'http://localhost:3000/api/anomalies';
  private maintenancesUrl = 'http://localhost:3000/api/maintenances';

  constructor(private http: HttpClient) { }

  // Fetch notifications from anomalies and maintenances endpoints
  getNotifications(): Observable<Notification[]> {
    return forkJoin({
      anomalies: this.http.get<any[]>(this.anomaliesUrl).pipe(
        map(anomalies => anomalies.map(a => ({
          id: a.id,
          type: 'anomalie' as const,
          message: a.description || `Anomalie détectée sur l'actif ${a.actif?.nom || ''}`,
          date: new Date(a.date || a.createdAt || Date.now()),
          read: false,
          link: a.actif ? `/assets/${a.actif.id}` : undefined
        }))),
        catchError(() => of([]))
      ),
      maintenances: this.http.get<any[]>(this.maintenancesUrl).pipe(
        map(maintenances => maintenances.map(m => ({
          id: m.id,
          type: 'maintenance' as const,
          message: m.description || `Maintenance planifiée pour ${m.actif?.nom || ''}`,
          date: new Date(m.date || m.createdAt || Date.now()),
          read: false,
          link: m.actif ? `/assets/${m.actif.id}` : undefined
        }))),
        catchError(() => of([]))
      )
    }).pipe(
      map(({ anomalies, maintenances }) => {
        const all = [...anomalies, ...maintenances];
        return all.sort((a, b) => b.date.getTime() - a.date.getTime());
      })
    );
  }

  getUnreadCount(): Observable<number> {
    return this.getNotifications().pipe(
      map(notifications => notifications.filter(n => !n.read).length)
    );
  }
}
