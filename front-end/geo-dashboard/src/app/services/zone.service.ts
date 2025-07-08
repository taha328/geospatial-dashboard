import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://localhost:3000/zones';

  constructor(private http: HttpClient) {}

  getZones(): Observable<Zone[]> {
    return this.http.get<Zone[]>(this.apiUrl);
  }

  getZone(id: number): Observable<Zone> {
    return this.http.get<Zone>(`${this.apiUrl}/${id}`);
  }

  createZone(zone: Zone): Observable<Zone> {
    return this.http.post<Zone>(this.apiUrl, zone);
  }

  updateZone(id: number, zone: Partial<Zone>): Observable<Zone> {
    return this.http.put<Zone>(`${this.apiUrl}/${id}`, zone);
  }

  deleteZone(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
