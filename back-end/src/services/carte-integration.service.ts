import { Injectable } from '@nestjs/common';
import { ActifService } from '../gestion_des_actifs/services/actif.service';
import { AnomalieService } from '../gestion_des_actifs/services/anomalie.service';
import { PortefeuilleService } from '../gestion_des_actifs/services/portefeuille.service';

@Injectable()
export class CarteIntegrationService {
  constructor(
    private readonly actifService: ActifService,
    private readonly anomalieService: AnomalieService,
    private readonly portefeuilleService: PortefeuilleService,
  ) {}

  async getActifsForMap(): Promise<any[]> {
    // Récupérer les actifs qui sont dans la hiérarchie
    const hierarchie = await this.portefeuilleService.getHierarchy();
    const actifs: any[] = [];

    // Extraire tous les actifs de la hiérarchie avec leurs coordonnées
    hierarchie.forEach(portefeuille => {
      portefeuille.children?.forEach(famille => {
        famille.children?.forEach(groupe => {
          groupe.children?.forEach(actif => {
            // Include actifs with either coordinates OR geometry
            if ((actif.latitude && actif.longitude) || actif.geometry) {
              actifs.push({
                id: actif.id,
                nom: actif.nom,
                type: 'actif',
                typeActif: actif.type,
                statutOperationnel: actif.statutOperationnel,
                etatGeneral: actif.etatGeneral,
                latitude: actif.latitude,
                longitude: actif.longitude,
                geometry: actif.geometry, // Include geometry for polygon/linestring actifs
                code: actif.code,
                groupeNom: groupe.nom,
                familleNom: famille.nom,
                portefeuilleNom: portefeuille.nom,
                // Icône selon le type d'actif
                iconType: this.getIconType(actif.type),
                // Couleur selon le statut
                statusColor: this.getStatusColor(actif.statutOperationnel)
              });
            }
          });
        });
      });
    });

    // Récupérer également les actifs qui ne sont pas associés à un groupe
    const actifsSansGroupe = await this.actifService.findActifsSansGroupe();
    actifsSansGroupe.forEach(actif => {
      // Include actifs with either coordinates OR geometry
      if ((actif.latitude && actif.longitude) || actif.geometry) {
        actifs.push({
          id: actif.id,
          nom: actif.nom,
          type: 'actif',
          typeActif: actif.type,
          statutOperationnel: actif.statutOperationnel,
          etatGeneral: actif.etatGeneral,
          latitude: actif.latitude,
          longitude: actif.longitude,
          geometry: actif.geometry, // Include geometry for polygon/linestring actifs
          code: actif.code,


          groupeNom: 'Non catégorisé',
          familleNom: 'Non catégorisé',
          portefeuilleNom: 'Non catégorisé',
          // Icône selon le type d'actif
          iconType: this.getIconType(actif.type),
          // Couleur selon le statut
          statusColor: this.getStatusColor(actif.statutOperationnel)
        });
      }
    });

    return actifs;
  }

  async getAnomaliesForMap(): Promise<any[]> {
    const anomalies = await this.anomalieService.findAnomaliesForMap();
    
    return anomalies.map(anomalie => ({
      id: anomalie.id,
      titre: anomalie.titre,
      description: anomalie.description,
      type: 'anomalie',
      typeAnomalie: anomalie.typeAnomalie,
      priorite: anomalie.priorite,
      statut: anomalie.statut,
      latitude: anomalie.latitude,
      longitude: anomalie.longitude,
      dateDetection: anomalie.dateDetection,
      rapportePar: anomalie.rapportePar,
      actifId: anomalie.actifId,
      actifNom: anomalie.actif?.nom,
      // Icône selon le type d'anomalie
      iconType: this.getAnomalieIconType(anomalie.typeAnomalie),
      // Couleur selon la priorité
      priorityColor: this.getPriorityColor(anomalie.priorite)
    }));
  }

  async getCarteDashboard(): Promise<any> {
    const actifs = await this.getActifsForMap();
    const anomalies = await this.getAnomaliesForMap();

    // Statistiques par type d'actif
    const statistiquesActifs = this.getStatistiquesActifs(actifs);
    
    // Statistiques des anomalies
    const statistiquesAnomalies = this.getStatistiquesAnomalies(anomalies);

    return {
      actifs,
      anomalies,
      statistiques: {
        actifs: statistiquesActifs,
        anomalies: statistiquesAnomalies
      }
    };
  }

  private getIconType(typeActif: string): string {
    const iconMap = {
      'bollard': 'anchor',
      'defense': 'shield',
      'quai': 'dock',
      'grue': 'crane',
      'terminal': 'building',
      'entrepot': 'warehouse',
      'conteneur': 'box',
      'vehicule': 'truck',
      'default': 'circle'
    };
    return iconMap[typeActif?.toLowerCase()] || iconMap['default'];
  }

  private getStatusColor(statut: string): string {
    const colorMap = {
      'operationnel': '#28a745',
      'maintenance': '#ffc107',
      'hors_service': '#dc3545',
      'inactif': '#6c757d'
    };
    return colorMap[statut] || '#6c757d';
  }

  private getAnomalieIconType(typeAnomalie: string): string {
    const iconMap = {
      'structural': 'exclamation-triangle',
      'mecanique': 'cog',
      'electrique': 'bolt',
      'securite': 'shield-alt',
      'autre': 'question-circle'
    };
    return iconMap[typeAnomalie] || iconMap['autre'];
  }

  private getPriorityColor(priorite: string): string {
    const colorMap = {
      'critique': '#dc3545',
      'eleve': '#fd7e14',
      'moyen': '#ffc107',
      'faible': '#28a745'
    };
    return colorMap[priorite] || '#6c757d';
  }

  private getStatistiquesActifs(actifs: any[]): any {
    return {
      total: actifs.length,
      parStatut: actifs.reduce((acc, actif) => {
        acc[actif.statutOperationnel] = (acc[actif.statutOperationnel] || 0) + 1;
        return acc;
      }, {}),
      parType: actifs.reduce((acc, actif) => {
        acc[actif.typeActif] = (acc[actif.typeActif] || 0) + 1;
        return acc;
      }, {}),
      parFamille: actifs.reduce((acc, actif) => {
        acc[actif.familleNom] = (acc[actif.familleNom] || 0) + 1;
        return acc;
      }, {})
    };
  }

  private getStatistiquesAnomalies(anomalies: any[]): any {
    return {
      total: anomalies.length,
      parPriorite: anomalies.reduce((acc, anomalie) => {
        acc[anomalie.priorite] = (acc[anomalie.priorite] || 0) + 1;
        return acc;
      }, {}),
      parType: anomalies.reduce((acc, anomalie) => {
        acc[anomalie.typeAnomalie] = (acc[anomalie.typeAnomalie] || 0) + 1;
        return acc;
      }, {}),
      parStatut: anomalies.reduce((acc, anomalie) => {
        acc[anomalie.statut] = (acc[anomalie.statut] || 0) + 1;
        return acc;
      }, {})
    };
  }

  /**
   * Crée un nouvel actif depuis la carte
   */
  async createActif(actifData: {
    nom: string;
    code: string;
    type: string;
    statutOperationnel: string;
    etatGeneral: string;
    geom?: {
      type: string;
      coordinates: [number, number] | [number, number][] | [number, number][][]; // Point | LineString | Polygon
    };
    geometry?: any; // GeoJSON geometry for complex shapes
    latitude?: number;
    longitude?: number;
  }) {
    try {
      let createData: any = {
        nom: actifData.nom,
        code: actifData.code,
        type: actifData.type || 'equipment',
        statutOperationnel: actifData.statutOperationnel || 'operationnel',
        etatGeneral: actifData.etatGeneral || 'bon',
        dateInstallation: new Date(),
        dateAcquisition: new Date()
      };

      // Handle different geometry types - PRIORITY ORDER: geometry > coordinates
      if (actifData.geometry && typeof actifData.geometry === 'object') {
        // Complex geometry provided - check type
        if (['LineString', 'Polygon', 'MultiPolygon'].includes((actifData.geometry as any).type)) {
          // Complex geometry (LineString, Polygon, MultiPolygon) - use geometry field
          console.log('Processing complex geometry:', {
            type: actifData.geometry.type,
            hasCoordinates: !!(actifData.geometry as any).coordinates,
            providedLatLng: [actifData.latitude, actifData.longitude]
          });
          createData.geometry = actifData.geometry;
          // For complex geometries, also include lat/lng as centroid if provided
          if (actifData.latitude && actifData.longitude) {
            createData.latitude = actifData.latitude;
            createData.longitude = actifData.longitude;
          }
        } else if (actifData.geometry.type === 'Point') {
          // Point geometry - extract coordinates
          const [longitude, latitude] = (actifData.geometry as any).coordinates as [number, number];
          createData.latitude = latitude;
          createData.longitude = longitude;
          console.log('Processing Point geometry:', { latitude, longitude });
        } else {
          throw new Error(`Unsupported geometry type: ${(actifData.geometry as any).type}`);
        }
      } else if (actifData.latitude && actifData.longitude) {
        // Direct coordinates provided (fallback for point creation)
        console.log('Using direct coordinates (no geometry):', { 
          latitude: actifData.latitude, 
          longitude: actifData.longitude 
        });
        createData.latitude = actifData.latitude;
        createData.longitude = actifData.longitude;
      } else {
        throw new Error('Either point coordinates or geometry must be provided');
      }
      
      // Créer l'actif avec le service ActifService
      return this.actifService.createActifFromMap(createData);
    } catch (error) {
      throw new Error(`Erreur lors de la création de l'actif: ${error.message}`);
    }
  }
}
