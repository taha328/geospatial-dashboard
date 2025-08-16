import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Zone {
  id?: number;
  name: string;
  type: string;
  geometry: string; // GeoJSON string
  description?: string;
  color?: string;
  opacity?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ZoneService {
  private baseUrl = `${environment.apiUrl}/zones`;

  constructor(private http: HttpClient) {}

  getZones(): Observable<Zone[]> {
    return this.http.get<Zone[]>(this.baseUrl);
  }

  getZone(id: number): Observable<Zone> {
    return this.http.get<Zone>(`${this.baseUrl}/${id}`);
  }

  createZone(zone: Zone): Observable<Zone> {
    return this.http.post<Zone>(this.baseUrl, zone);
  }

  updateZone(id: number, zone: Partial<Zone>): Observable<Zone> {
    return this.http.put<Zone>(`${this.baseUrl}/${id}`, zone);
  }

  deleteZone(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
