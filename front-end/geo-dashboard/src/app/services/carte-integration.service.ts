import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ActifPourCarte {
  id: number;
  nom: string;
  type: string;
  typeActif: string;
  statutOperationnel: string;
  etatGeneral: string;
  latitude: number;
  longitude: number;
  code: string;
  groupeNom: string;
  familleNom: string;
  portefeuilleNom: string;
  iconType: string;
  statusColor: string;
  geometry?: any; // GeoJSON geometry for map display
  anomaliesActives?: number;
  maintenancesPrevues?: number;
}

export interface AnomaliePourCarte {
  id: number;
  titre: string;
  description: string;
  type: string;
  typeAnomalie: string;
  priorite: string;
  statut: string;
  latitude: number;
  longitude: number;
  dateDetection: Date;
  rapportePar: string;
  actifId?: number;
  actifNom?: string;
  iconType: string;
  priorityColor: string;
}

export interface SignalementAnomalie {
  titre: string;
  description: string;
  typeAnomalie: 'structural' | 'mecanique' | 'electrique' | 'securite' | 'autre';
  priorite: 'faible' | 'moyen' | 'eleve' | 'critique';
  latitude: number;
  longitude: number;
  rapportePar?: string;
  actifId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarteIntegrationService {
  private baseUrl = `${environment.apiUrl}/carte`;
  // Simple in-memory caches to avoid re-fetching the same large payload repeatedly.
  private actifsCache$: Observable<ActifPourCarte[]> | null = null;
  private anomaliesCache$: Observable<AnomaliePourCarte[]> | null = null;

  constructor(private http: HttpClient) {}

  // Récupérer tous les actifs pour la carte
  getActifsForMap(forceRefresh = false): Observable<ActifPourCarte[]> {
    if (forceRefresh || !this.actifsCache$) {
      this.actifsCache$ = this.http.get<ActifPourCarte[]>(`${this.baseUrl}/actifs`).pipe(
        // keep the latest successful response in-memory for subsequent subscribers
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.actifsCache$;
  }

  clearActifsCache() {
    this.actifsCache$ = null;
  }

  // Récupérer toutes les anomalies pour la carte
  getAnomaliesForMap(forceRefresh = false): Observable<AnomaliePourCarte[]> {
    if (forceRefresh || !this.anomaliesCache$) {
      this.anomaliesCache$ = this.http.get<AnomaliePourCarte[]>(`${this.baseUrl}/anomalies`).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.anomaliesCache$;
  }

  clearAnomaliesCache() {
    this.anomaliesCache$ = null;
  }

  // Récupérer le dashboard complet de la carte
  getCarteDashboard(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard`);
  }

  // Signaler une anomalie depuis la carte
  signalerAnomalieDepuisCarte(anomalie: SignalementAnomalie | FormData): Observable<any> {
    // Use the correct anomalies endpoint for anomaly reporting
    return this.http.post(`${environment.apiUrl}/anomalies/carte/signaler`, anomalie);
  }

  // Créer un nouvel actif depuis la carte
  createActif(actifData: any): Observable<any> {
    // Use the specific from-map endpoint
    return this.http.post<any>(`${this.baseUrl}/actifs/from-map`, actifData);
  }

  // Méthodes utilitaires pour l'affichage
  getTypeActifLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'bollard': 'Bollard',
      'defense': 'Défense',
      'quai': 'Quai',
      'grue': 'Grue',
      'terminal': 'Terminal',
      'entrepot': 'Entrepôt',
      'conteneur': 'Conteneur',
      'vehicule': 'Véhicule'
    };
    return labels[type] || type;
  }

  getStatutLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'operationnel': 'Opérationnel',
      'maintenance': 'En Maintenance',
      'hors_service': 'Hors Service',
      'inactif': 'Inactif'
    };
    return labels[statut] || statut;
  }

  getTypeAnomalieLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'structural': 'Structurel',
      'mecanique': 'Mécanique',
      'electrique': 'Électrique',
      'securite': 'Sécurité',
      'autre': 'Autre'
    };
    return labels[type] || type;
  }

  getPrioriteLabel(priorite: string): string {
    const labels: { [key: string]: string } = {
      'critique': 'Critique',
      'eleve': 'Élevée',
      'moyen': 'Moyenne',
      'faible': 'Faible'
    };
    return labels[priorite] || priorite;
  }
}
