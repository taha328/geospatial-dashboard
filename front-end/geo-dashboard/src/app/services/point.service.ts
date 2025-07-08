import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://localhost:3000/points';

  constructor(private http: HttpClient) {}

  getPoints(): Observable<Point[]> {
    return this.http.get<Point[]>(this.apiUrl);
  }

  getPoint(id: number): Observable<Point> {
    return this.http.get<Point>(`${this.apiUrl}/${id}`);
  }

  createPoint(point: Point): Observable<Point> {
    return this.http.post<Point>(this.apiUrl, point);
  }

  updatePoint(id: number, point: Partial<Point>): Observable<Point> {
    return this.http.put<Point>(`${this.apiUrl}/${id}`, point);
  }

  deletePoint(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
