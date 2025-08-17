import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ActifPourCarte } from './carte-integration.service';

export interface Portefeuille {
  id: number;
  nom: string;
  description?: string;
  code: string;
  statut: string;
  latitude?: number;
  longitude?: number;
  dateCreation: Date;
  dateMiseAJour: Date;
}

export interface FamilleActif {
  id: number;
  nom: string;
  description?: string;
  code: string;
  type: string;
  statut: string;
  latitude?: number;
  longitude?: number;
  portefeuilleId?: number;
  dateCreation: Date;
  dateMiseAJour: Date;
}

export interface GroupeActif {
  id: number;
  nom: string;
  description?: string;
  code: string;
  type: string;
  statut: string;
  latitude?: number;
  longitude?: number;
  familleActifId?: number;
  dateCreation: Date;
  dateMiseAJour: Date;
}

export interface Actif {
  id: number;
  nom: string;
  description?: string;
  code: string;
  type?: string;
  statutOperationnel: string;
  etatGeneral: string;
  latitude: number;
  longitude: number;
  dateMiseEnService?: Date;
  dateFinGarantie?: Date;
  fournisseur?: string;
  valeurAcquisition?: number;
  specifications?: any;
  groupeActifId?: number;
  dateCreation: Date;
  dateMiseAJour: Date;
}


export interface HierarchyNode {
  id: number;
  nom: string;
  type: 'portefeuille' | 'famille' | 'groupe' | 'actif';
  statut?: string;
  statutOperationnel?: string;
  etatGeneral?: string;
  latitude?: number;
  longitude?: number;
  code?: string;

  children?: HierarchyNode[];
}

export interface StatistiquesActifs {
  total: number;
  operationnels: number;
  enMaintenance: number;
  horsService: number;
  tauxDisponibilite: number;
}

@Injectable({
  providedIn: 'root'
})
export class ActifService {
  private baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Portefeuilles
  getPortefeuilles(): Observable<Portefeuille[]> {
    return this.http.get<Portefeuille[]>(`${this.baseUrl}/portefeuilles`);
  }

  getPortefeuille(id: number): Observable<Portefeuille> {
    return this.http.get<Portefeuille>(`${this.baseUrl}/portefeuilles/${id}`);
  }

  getHierarchy(): Observable<HierarchyNode[]> {
    return this.http.get<HierarchyNode[]>(`${this.baseUrl}/portefeuilles/hierarchy`);
  }

  getStatistiques(): Observable<StatistiquesActifs> {
    return this.http.get<StatistiquesActifs>(`${this.baseUrl}/portefeuilles/statistiques`);
  }

  // Actifs
  getActifs(): Observable<Actif[]> {
    return this.http.get<Actif[]>(`${this.baseUrl}/actifs`);
  }

  getActif(id: number): Observable<Actif> {
    return this.http.get<Actif>(`${this.baseUrl}/actifs/${id}`);
  }

  getActifsPourCarte(): Observable<ActifPourCarte[]> {
    return this.http.get<ActifPourCarte[]>(`${this.baseUrl}/actifs/carte`);
  }

  getActifsParStatut(statut: string): Observable<Actif[]> {
    return this.http.get<Actif[]>(`${this.baseUrl}/actifs/statut/${statut}`);
  }

  getActifsAvecAnomalies(): Observable<Actif[]> {
    return this.http.get<Actif[]>(`${this.baseUrl}/actifs/avec-anomalies`);
  }

  getActifsEnMaintenance(): Observable<Actif[]> {
    return this.http.get<Actif[]>(`${this.baseUrl}/actifs/en-maintenance`);
  }

  createActif(actif: Partial<Actif>): Observable<Actif> {
    return this.http.post<Actif>(`${this.baseUrl}/actifs`, actif);
  }

  updateActif(id: number, actif: Partial<Actif>): Observable<Actif> {
    return this.http.put<Actif>(`${this.baseUrl}/actifs/${id}`, actif);
  }

  updateStatutOperationnel(id: number, statut: string): Observable<Actif> {
    return this.http.put<Actif>(`${this.baseUrl}/actifs/${id}/statut`, { statut });
  }

  deleteActif(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/actifs/${id}`);
  }
  
  // Méthodes pour la hiérarchie des actifs
  getFamilleActifsByPortefeuille(portefeuilleId: string): Observable<FamilleActif[]> {
    return this.http.get<FamilleActif[]>(`${this.baseUrl}/portefeuilles/${portefeuilleId}/familles`);
  }
  
  getGroupeActifsByFamilleActif(familleActifId: string): Observable<GroupeActif[]> {
    return this.http.get<GroupeActif[]>(`${this.baseUrl}/familles/${familleActifId}/groupes`);
  }

  // Update the getActifDetails method to properly fetch relationships
  getActifDetails(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/actifs/${id}?relations=true`).pipe(
      tap(response => {
        console.log('Fetched actif details:', response);
      }),
      catchError(error => {
        console.error('Error fetching actif details:', error);
        return throwError(() => new Error('Erreur lors de la récupération des détails de l\'actif'));
      })
    );
  }
}
