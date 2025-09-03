import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Inspection, 
  CreateInspectionDto, 
  UpdateInspectionDto, 
  InspectionStats 
} from '../interfaces/inspection.interface';

@Injectable({
  providedIn: 'root'
})
export class InspectionService {
  private apiUrl = `${environment.apiUrl}/inspections`;

  constructor(private http: HttpClient) {}

  private getHttpOptions(): { headers: HttpHeaders } {
    const token = localStorage.getItem('auth_token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  private handleError(error: any): Observable<never> {
    console.error('Une erreur s\'est produite:', error);
    return throwError(() => error);
  }

  // Get all inspections with optional filters
  getAllInspections(filters?: {
    actifId?: number;
    typeInspectionId?: number;
    statut?: string;
  }): Observable<Inspection[]> {
    let params = new HttpParams();
    
    if (filters?.actifId) {
      params = params.set('actifId', filters.actifId.toString());
    }
    if (filters?.typeInspectionId) {
      params = params.set('typeInspectionId', filters.typeInspectionId.toString());
    }
    if (filters?.statut) {
      params = params.set('statut', filters.statut);
    }

    return this.http.get<Inspection[]>(this.apiUrl, { 
      ...this.getHttpOptions(), 
      params 
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Get inspection by ID
  getInspection(id: number): Observable<Inspection> {
    return this.http.get<Inspection>(`${this.apiUrl}/${id}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // Get inspections by actif
  getInspectionsByActif(actifId: number): Observable<Inspection[]> {
    return this.getAllInspections({ actifId });
  }

  // Get inspections by type
  getInspectionsByType(typeInspectionId: number): Observable<Inspection[]> {
    return this.getAllInspections({ typeInspectionId });
  }

  // Get inspections by status
  getInspectionsByStatus(statut: string): Observable<Inspection[]> {
    return this.getAllInspections({ statut });
  }

  // Get inspection statistics
  getInspectionStats(): Observable<InspectionStats> {
    return this.http.get<InspectionStats>(`${this.apiUrl}/stats`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // Create new inspection
  createInspection(inspection: CreateInspectionDto): Observable<Inspection> {
    return this.http.post<Inspection>(this.apiUrl, inspection, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // Update inspection
  updateInspection(id: number, inspection: UpdateInspectionDto): Observable<Inspection> {
    return this.http.patch<Inspection>(`${this.apiUrl}/${id}`, inspection, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // Delete inspection
  deleteInspection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // Start inspection (change status to en_cours)
  startInspection(id: number): Observable<Inspection> {
    return this.updateInspection(id, { 
      statut: 'en_cours',
      dateRealisation: new Date().toISOString().split('T')[0]
    });
  }

  // Complete inspection
  completeInspection(id: number, data: {
    resultatGeneral: 'bon' | 'moyen' | 'mauvais' | 'critique';
    conformite: 'conforme' | 'non_conforme' | 'avec_reserves';
    observations?: string;
    recommandations?: string;
  }): Observable<Inspection> {
    return this.updateInspection(id, { 
      ...data,
      statut: 'terminee',
      dateRealisation: new Date().toISOString().split('T')[0]
    });
  }

  // Cancel inspection
  cancelInspection(id: number, reason?: string): Observable<Inspection> {
    return this.updateInspection(id, { 
      statut: 'annulee',
      observations: reason || 'Inspection annulée'
    });
  }

  // Reschedule inspection
  rescheduleInspection(id: number, newDate: string): Observable<Inspection> {
    return this.updateInspection(id, { 
      statut: 'reportee',
      datePrevue: newDate
    });
  }
}
