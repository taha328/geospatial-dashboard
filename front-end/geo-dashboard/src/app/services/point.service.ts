import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Point {
  id?: number;
  latitude: number;
  longitude: number;
  description?: string;
  color?: string;
  type?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PointService {
  private baseUrl = `${environment.apiUrl}/points`;

  constructor(private http: HttpClient) {}

  getPoints(): Observable<Point[]> {
    return this.http.get<Point[]>(this.baseUrl);
  }

  getPoint(id: number): Observable<Point> {
    return this.http.get<Point>(`${this.baseUrl}/${id}`);
  }

  createPoint(point: Point): Observable<Point> {
    return this.http.post<Point>(this.baseUrl, point);
  }

  updatePoint(id: number, point: Partial<Point>): Observable<Point> {
    return this.http.put<Point>(`${this.baseUrl}/${id}`, point);
  }

  deletePoint(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
