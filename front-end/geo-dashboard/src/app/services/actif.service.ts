import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  numeroSerie?: string;
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

export interface ActifPourCarte {
  id: number;
  nom: string;
  code: string;
  latitude: number;
  longitude: number;
  statutOperationnel: string;
  etatGeneral: string;
  type: string;
  groupe?: string;
  famille?: string;
  portefeuille?: string;
  anomaliesActives: number;
  maintenancesPrevues: number;
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
  numeroSerie?: string;
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
  private baseUrl = 'http://localhost:3000/api';

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
}
