import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { TypeInspection, TypeInspectionGroupe, InspectionStatistics, CreateTypeInspectionDto, CreateTypeInspectionGroupeDto } from '../models/type-inspection.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TypeInspectionService {
  private apiUrl = `${environment.apiUrl}/api`;
  private typeInspectionsSubject = new BehaviorSubject<TypeInspection[]>([]);
  private typeInspectionGroupesSubject = new BehaviorSubject<TypeInspectionGroupe[]>([]);
  
  public typeInspections$ = this.typeInspectionsSubject.asObservable();
  public typeInspectionGroupes$ = this.typeInspectionGroupesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadTypeInspections();
    this.loadTypeInspectionGroupes();
  }

  private getHttpOptions() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  // Type Inspection Methods
  getAllTypeInspections(): Observable<TypeInspection[]> {
    return this.http.get<TypeInspection[]>(`${this.apiUrl}/type-inspections`, this.getHttpOptions())
      .pipe(
        tap(inspections => this.typeInspectionsSubject.next(inspections)),
        catchError(this.handleError<TypeInspection[]>('getAllTypeInspections', []))
      );
  }

  getTypeInspectionById(id: number): Observable<TypeInspection> {
    return this.http.get<TypeInspection>(`${this.apiUrl}/type-inspections/${id}`, this.getHttpOptions())
      .pipe(catchError(this.handleError<TypeInspection>('getTypeInspectionById')));
  }

  getTypeInspectionByNumero(numero: number): Observable<TypeInspection> {
    return this.http.get<TypeInspection>(`${this.apiUrl}/type-inspections/numero/${numero}`, this.getHttpOptions())
      .pipe(catchError(this.handleError<TypeInspection>('getTypeInspectionByNumero')));
  }

  createTypeInspection(inspection: CreateTypeInspectionDto): Observable<TypeInspection> {
    return this.http.post<TypeInspection>(`${this.apiUrl}/type-inspections`, inspection, this.getHttpOptions())
      .pipe(
        tap(() => this.loadTypeInspections()),
        catchError(this.handleError<TypeInspection>('createTypeInspection'))
      );
  }

  updateTypeInspection(id: number, inspection: Partial<TypeInspection>): Observable<TypeInspection> {
    return this.http.patch<TypeInspection>(`${this.apiUrl}/type-inspections/${id}`, inspection, this.getHttpOptions())
      .pipe(
        tap(() => this.loadTypeInspections()),
        catchError(this.handleError<TypeInspection>('updateTypeInspection'))
      );
  }

  deleteTypeInspection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/type-inspections/${id}`, this.getHttpOptions())
      .pipe(
        tap(() => this.loadTypeInspections()),
        catchError(this.handleError<void>('deleteTypeInspection'))
      );
  }

  getTypeInspectionStatistics(): Observable<InspectionStatistics> {
    return this.http.get<InspectionStatistics>(`${this.apiUrl}/type-inspections/statistics`, this.getHttpOptions())
      .pipe(catchError(this.handleError<InspectionStatistics>('getTypeInspectionStatistics')));
  }

  // Type Inspection Groupe Methods
  getAllTypeInspectionGroupes(): Observable<TypeInspectionGroupe[]> {
    return this.http.get<TypeInspectionGroupe[]>(`${this.apiUrl}/type-inspection-groupes`, this.getHttpOptions())
      .pipe(
        tap(groupes => this.typeInspectionGroupesSubject.next(groupes)),
        catchError(this.handleError<TypeInspectionGroupe[]>('getAllTypeInspectionGroupes', []))
      );
  }

  getTypeInspectionGroupeById(id: number): Observable<TypeInspectionGroupe> {
    return this.http.get<TypeInspectionGroupe>(`${this.apiUrl}/type-inspection-groupes/${id}`, this.getHttpOptions())
      .pipe(catchError(this.handleError<TypeInspectionGroupe>('getTypeInspectionGroupeById')));
  }

  getTypeInspectionGroupesByGroupe(numeroGroupe: number): Observable<TypeInspectionGroupe[]> {
    return this.http.get<TypeInspectionGroupe[]>(`${this.apiUrl}/type-inspection-groupes/groupe/${numeroGroupe}`, this.getHttpOptions())
      .pipe(catchError(this.handleError<TypeInspectionGroupe[]>('getTypeInspectionGroupesByGroupe', [])));
  }

  getTypeInspectionGroupesByInspection(numeroInspection: number): Observable<TypeInspectionGroupe[]> {
    return this.http.get<TypeInspectionGroupe[]>(`${this.apiUrl}/type-inspection-groupes/inspection/${numeroInspection}`, this.getHttpOptions())
      .pipe(catchError(this.handleError<TypeInspectionGroupe[]>('getTypeInspectionGroupesByInspection', [])));
  }

  createTypeInspectionGroupe(groupe: CreateTypeInspectionGroupeDto): Observable<TypeInspectionGroupe> {
    return this.http.post<TypeInspectionGroupe>(`${this.apiUrl}/type-inspection-groupes`, groupe, this.getHttpOptions())
      .pipe(
        tap(() => this.loadTypeInspectionGroupes()),
        catchError(this.handleError<TypeInspectionGroupe>('createTypeInspectionGroupe'))
      );
  }

  updateTypeInspectionGroupe(id: number, groupe: Partial<TypeInspectionGroupe>): Observable<TypeInspectionGroupe> {
    return this.http.patch<TypeInspectionGroupe>(`${this.apiUrl}/type-inspection-groupes/${id}`, groupe, this.getHttpOptions())
      .pipe(
        tap(() => this.loadTypeInspectionGroupes()),
        catchError(this.handleError<TypeInspectionGroupe>('updateTypeInspectionGroupe'))
      );
  }

  deleteTypeInspectionGroupe(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/type-inspection-groupes/${id}`, this.getHttpOptions())
      .pipe(
        tap(() => this.loadTypeInspectionGroupes()),
        catchError(this.handleError<void>('deleteTypeInspectionGroupe'))
      );
  }

  getTypeInspectionGroupeStatistics(): Observable<InspectionStatistics> {
    return this.http.get<InspectionStatistics>(`${this.apiUrl}/type-inspection-groupes/statistics`, this.getHttpOptions())
      .pipe(catchError(this.handleError<InspectionStatistics>('getTypeInspectionGroupeStatistics')));
  }

  // Private helper methods
  private loadTypeInspections(): void {
    this.getAllTypeInspections().subscribe();
  }

  private loadTypeInspectionGroupes(): void {
    this.getAllTypeInspectionGroupes().subscribe();
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      // Let the app keep running by returning an empty result
      return new Observable<T>(observer => {
        if (result !== undefined) {
          observer.next(result as T);
        }
        observer.complete();
      });
    };
  }
}
