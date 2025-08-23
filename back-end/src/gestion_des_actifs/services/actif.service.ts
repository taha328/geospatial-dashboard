import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actif } from '../entities/actif.entity';

// Interfaces remain the same
interface GeoJSONGeometry {
  type: string;
  coordinates: number[];
}

interface CreateActifFromMapDto {
  nom: string;
  code: string;
  type: string;
  description: string;
  statutOperationnel: string;
  etatGeneral: string;
  latitude: number;
  longitude: number;
  valeurAcquisition?: number;
  groupeActifId?: number;
  dateMiseEnService?: string;
  dateFinGarantie?: string;
  fournisseur?: string;
  specifications?: any;
  geometry?: any;
}

@Injectable()
export class ActifService {
  constructor(
    @InjectRepository(Actif)
    private actifRepository: Repository<Actif>,
  ) {}

  async findAll(): Promise<Actif[]> {
    return this.actifRepository.find({
      relations: ['groupeActif', 'groupeActif.familleActif', 'groupeActif.familleActif.portefeuille', 'anomalies', 'maintenances']
    });
  }

  async findOne(id: number, includeRelations: boolean = false): Promise<Actif> {
    const relations = includeRelations ? 
      ['groupeActif', 'groupeActif.familleActif', 'groupeActif.familleActif.portefeuille', 
       'anomalies', 'maintenances'] : [];
    
    const actif = await this.actifRepository.findOne({
      where: { id },
      relations
    });
    
    if (!actif) {
      throw new NotFoundException(`Actif with ID ${id} not found`);
    }
    
    return actif;
  }

  // ====================================================================
  // === CORRECTED `create` METHOD                                  ===
  // ====================================================================
  async create(actifData: Partial<Actif>): Promise<Actif> {
    if (actifData.code) {
      const existingActif = await this.actifRepository.findOne({ where: { code: actifData.code } });
      if (existingActif) {
        throw new BadRequestException(`Un actif avec le code ${actifData.code} existe déjà.`);
      }
    }

    if (actifData.geometry) {
      try {
        let geometryForPostGIS = actifData.geometry;
        if (typeof geometryForPostGIS === 'string') {
          geometryForPostGIS = JSON.parse(geometryForPostGIS);
        }

        // CORRECTED QUERY WITH SEQUENTIAL PARAMETERS
        const result = await this.actifRepository.query(`
          WITH input_geom AS (
            SELECT ST_Transform(ST_GeomFromGeoJSON($13), 26191) as geom
          ),
          centroid_geom AS (
            SELECT ST_Transform(ST_Centroid((SELECT geom FROM input_geom)), 4326) as geom
          )
          INSERT INTO actifs (
            nom, code, type, description, "statutOperationnel", "etatGeneral",
            latitude, longitude,
            "valeurAcquisition", "groupeActifId", "dateMiseEnService", "dateFinGarantie",
            fournisseur, specifications, geometry,
            "dateCreation", "dateMiseAJour"
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            ST_Y((SELECT geom FROM centroid_geom)),
            ST_X((SELECT geom FROM centroid_geom)),
            $7, $8, $9, $10, $11, $12,
            (SELECT geom FROM input_geom),
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          RETURNING 
            id, nom, code, type, description, "statutOperationnel", "etatGeneral",
            latitude, longitude, "valeurAcquisition", "groupeActifId", "dateMiseEnService",
            "dateFinGarantie", fournisseur, specifications,
            ST_AsGeoJSON(ST_Transform(geometry, 4326)) as geometry,
            "dateCreation", "dateMiseAJour"
        `, [
          // CORRECTED PARAMETER ARRAY ORDER
          actifData.nom, // $1
          actifData.code, // $2
          actifData.type, // $3
          actifData.description, // $4
          actifData.statutOperationnel, // $5
          actifData.etatGeneral, // $6
          actifData.valeurAcquisition || null, // $7
          actifData.groupeActifId || null, // $8
          actifData.dateMiseEnService || null, // $9
          actifData.dateFinGarantie || null, // $10
          actifData.fournisseur || null, // $11
          actifData.specifications ? JSON.stringify(actifData.specifications) : null, // $12
          JSON.stringify(geometryForPostGIS) // $13
        ]);

        if (!result || result.length === 0) {
          throw new BadRequestException('Failed to create actif with geometry');
        }

        const savedActif = result[0];
        if (savedActif.geometry) savedActif.geometry = JSON.parse(savedActif.geometry);
        if (savedActif.specifications && typeof savedActif.specifications === 'string') {
          savedActif.specifications = JSON.parse(savedActif.specifications);
        }
        return savedActif;
      } catch (error) {
        console.error('Error creating actif with geometry:', error);
        if (error instanceof BadRequestException) throw error;
        throw new BadRequestException(`Error creating actif with geometry: ${error.message}`);
      }
    }

    const actif = this.actifRepository.create(actifData);
    return this.actifRepository.save(actif);
  }

  async update(id: number, actifData: Partial<Actif>): Promise<Actif | null> {
    await this.actifRepository.update(id, actifData);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.actifRepository.delete(id);
  }

  // === METHODS THAT WERE ACCIDENTALLY REMOVED ARE NOW RESTORED ===
  async findByGroupe(groupeActifId: number): Promise<Actif[]> {
    return this.actifRepository.find({
      where: { groupeActifId },
      relations: ['anomalies', 'maintenances']
    });
  }

  async findByStatut(statutOperationnel: string): Promise<Actif[]> {
    return this.actifRepository.find({
      where: { statutOperationnel },
      relations: ['groupeActif', 'anomalies', 'maintenances']
    });
  }

  async getActifsAvecAnomalies(): Promise<Actif[]> {
    return this.actifRepository
      .createQueryBuilder('actif')
      .leftJoinAndSelect('actif.anomalies', 'anomalie')
      .leftJoinAndSelect('actif.groupeActif', 'groupe')
      .where('anomalie.statut IN (:...statuts)', { statuts: ['nouveau', 'en_cours'] })
      .getMany();
  }

  async getActifsEnMaintenance(): Promise<Actif[]> {
    return this.actifRepository
      .createQueryBuilder('actif')
      .leftJoinAndSelect('actif.maintenances', 'maintenance')
      .leftJoinAndSelect('actif.groupeActif', 'groupe')
      .where('maintenance.statut IN (:...statuts)', { statuts: ['planifiee', 'en_cours'] })
      .getMany();
  }
// CORRECTED createActifFromMap method in ActifService
async createActifFromMap(actifData: CreateActifFromMapDto): Promise<Actif> {
  if (actifData.code) {
    const existingActif = await this.actifRepository.findOne({ where: { code: actifData.code } });
    if (existingActif) {
      throw new BadRequestException(`Un actif avec le code ${actifData.code} existe déjà.`);
    }
  }

  try {
    let geometryForPostGIS;
    if (actifData.geometry) {
      geometryForPostGIS = typeof actifData.geometry === 'string' 
        ? JSON.parse(actifData.geometry) 
        : actifData.geometry;
    } else {
      if (!actifData.latitude || !actifData.longitude) {
          throw new BadRequestException('Coordinates (latitude/longitude) must be provided for point actifs.');
      }
      geometryForPostGIS = {
        type: 'Point',
        coordinates: [Number(actifData.longitude), Number(actifData.latitude)]
      };
    }

    // Validate and fix geometry structure
    if (geometryForPostGIS.type === 'Feature') geometryForPostGIS = geometryForPostGIS.geometry;
    if (geometryForPostGIS.type === 'FeatureCollection' && geometryForPostGIS.features?.length > 0) {
      geometryForPostGIS = geometryForPostGIS.features[0].geometry;
    }

    if (!geometryForPostGIS || !geometryForPostGIS.type || !geometryForPostGIS.coordinates) {
      throw new BadRequestException('Invalid geometry format provided');
    }

    // Validate polygon coordinates
    if (geometryForPostGIS.type === 'Polygon') {
      const coords = geometryForPostGIS.coordinates;
      if (!Array.isArray(coords) || coords.length === 0 || !Array.isArray(coords[0])) {
        throw new BadRequestException('Invalid polygon coordinates');
      }
      
      const firstRing = coords[0];
      if (firstRing.length < 4) {
        throw new BadRequestException('Polygon must have at least 4 coordinate pairs');
      }
      
      // Ensure polygon is closed
      const firstPoint = firstRing[0];
      const lastPoint = firstRing[firstRing.length - 1];
      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        firstRing.push([firstPoint[0], firstPoint[1]]);
      }
    }

    // FIXED QUERY: Separate parameters for lat/lng fallbacks
    const result = await this.actifRepository.query(`
      WITH input_validation AS (
        SELECT 
          $15::jsonb as input_geojson,
          ST_IsValid(ST_GeomFromGeoJSON($15)) as is_valid_input
      ),
      input_geom AS (
        SELECT 
          ST_GeomFromGeoJSON($15) as geom_4326,
          ST_Transform(ST_GeomFromGeoJSON($15), 26191) as geom_26191
        FROM input_validation
        WHERE is_valid_input = true
      ),
      centroid_geom AS (
        SELECT ST_Transform(ST_Centroid((SELECT geom_26191 FROM input_geom)), 4326) as geom
      )
      INSERT INTO actifs (
        nom, code, type, description, "statutOperationnel", "etatGeneral",
        latitude, longitude,
        "valeurAcquisition", "groupeActifId", "dateMiseEnService", "dateFinGarantie",
        fournisseur, specifications, geometry,
        "dateCreation", "dateMiseAJour"
      ) 
      SELECT 
        $1, $2, $3, $4, $5, $6,
        COALESCE(ST_Y((SELECT geom FROM centroid_geom)), $13::float),  -- Use fallback lat
        COALESCE(ST_X((SELECT geom FROM centroid_geom)), $14::float),  -- Use fallback lng
        $7, $8, $9, $10, $11, $12,
        (SELECT geom_26191 FROM input_geom),
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM input_validation
      WHERE is_valid_input = true
      RETURNING 
        id, nom, code, type, description, "statutOperationnel", "etatGeneral",
        latitude, longitude, "valeurAcquisition", "groupeActifId", "dateMiseEnService",
        "dateFinGarantie", fournisseur, specifications,
        ST_AsGeoJSON(ST_Transform(geometry, 4326)) as geometry,
        ST_IsValid(geometry) as geometry_is_valid,
        ST_SRID(geometry) as geometry_srid,
        "dateCreation", "dateMiseAJour"
    `, [
      actifData.nom, // $1
      actifData.code, // $2
      actifData.type, // $3
      actifData.description, // $4
      actifData.statutOperationnel, // $5
      actifData.etatGeneral, // $6
      actifData.valeurAcquisition || null, // $7
      actifData.groupeActifId || null, // $8
      actifData.dateMiseEnService || null, // $9
      actifData.dateFinGarantie || null, // $10
      actifData.fournisseur || null, // $11
      actifData.specifications ? JSON.stringify(actifData.specifications) : null, // $12
      actifData.latitude || null, // $13 - SEPARATE fallback latitude
      actifData.longitude || null, // $14 - SEPARATE fallback longitude
      JSON.stringify(geometryForPostGIS) // $15 - geometry JSON
    ]);

    if (!result || result.length === 0) {
      throw new BadRequestException('Failed to create actif - geometry might be invalid');
    }

    const savedActif = result[0];
    
    console.log('Created actif geometry info:', {
      id: savedActif.id,
      geometry_is_valid: savedActif.geometry_is_valid,
      geometry_srid: savedActif.geometry_srid,
      has_geometry: !!savedActif.geometry
    });

    if (savedActif.geometry) {
      try {
        savedActif.geometry = JSON.parse(savedActif.geometry);
      } catch (e) {
        console.error('Failed to parse returned geometry:', e);
        savedActif.geometry = null;
      }
    }
    
    if (savedActif.specifications && typeof savedActif.specifications === 'string') {
      try {
        savedActif.specifications = JSON.parse(savedActif.specifications);
      } catch (e) {
        console.error('Failed to parse specifications:', e);
      }
    }
    
    return savedActif;
  } catch (error) {
    console.error('Error in createActifFromMap:', error);
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException(`Error creating actif from map: ${error.message}`);
  }
}

// 2. Fix the getActifsPourCarte method - ensure consistent geometry retrieval:
async getActifsPourCarte(): Promise<any[]> {
  const actifs = await this.actifRepository.query(`
    SELECT 
      a.id, a.nom, a.code, a.type, a."statutOperationnel", a."etatGeneral",
      a.latitude, a.longitude,
      -- Always return geometry as GeoJSON in EPSG:4326 (WGS84) with validation
      CASE 
        WHEN a.geometry IS NOT NULL AND ST_IsValid(a.geometry) THEN
          ST_AsGeoJSON(ST_Transform(a.geometry, 4326))
        ELSE NULL 
      END as geometry,
      ST_SRID(a.geometry) as geometry_srid,
      ST_IsValid(a.geometry) as is_valid_geometry,
      ST_GeometryType(a.geometry) as geometry_type,
      g.nom as "groupeNom", f.nom as "familleNom", p.nom as "portefeuilleNom"
    FROM actifs a
    LEFT JOIN "groupes_actifs" g ON a."groupeActifId" = g.id
    LEFT JOIN "familles_actifs" f ON g."familleActifId" = f.id
    LEFT JOIN portefeuilles p ON f."portefeuilleId" = p.id
    WHERE a.geometry IS NOT NULL
    ORDER BY a."dateCreation" DESC
  `);
  
  return actifs.map(actif => {
    let parsedGeometry: any = null;
    
    if (actif.geometry) {
      try {
        parsedGeometry = JSON.parse(actif.geometry);
        
        // Additional validation for parsed geometry
        if (parsedGeometry && typeof parsedGeometry === 'object' && parsedGeometry.coordinates) {
          // Log detailed info for debugging
          console.log(`Actif ${actif.id} geometry from DB:`, {
            type: parsedGeometry.type,
            isValidInDB: actif.is_valid_geometry,
            dbGeometryType: actif.geometry_type,
            srid: actif.geometry_srid,
            coordinateStructure: Array.isArray(parsedGeometry.coordinates) ? 
              (parsedGeometry.type === 'Polygon' ? 
                `${parsedGeometry.coordinates.length} rings, first ring has ${parsedGeometry.coordinates[0]?.length || 0} points` :
                `${parsedGeometry.coordinates.length} coordinates`) : 'invalid',
            dbLat: actif.latitude,
            dbLng: actif.longitude
          });

          // Validate coordinate structure
          if (parsedGeometry.type === 'Polygon') {
            const coords = parsedGeometry.coordinates;
            if (!Array.isArray(coords) || coords.length === 0 || !Array.isArray(coords[0])) {
              console.warn(`Invalid polygon structure for actif ${actif.id}`);
              parsedGeometry = null;
            } else {
              // Check if all coordinates are valid numbers
              const firstRing = coords[0];
              const hasInvalidCoords = firstRing.some((point: any) => 
                !Array.isArray(point) || point.length < 2 ||
                typeof point[0] !== 'number' || typeof point[1] !== 'number' ||
                !isFinite(point[0]) || !isFinite(point[1])
              );
              
              if (hasInvalidCoords) {
                console.warn(`Invalid coordinates found in polygon for actif ${actif.id}`);
                parsedGeometry = null;
              }
            }
          }
        }
      } catch (e) {
        console.error(`Failed to parse geometry for actif ${actif.id}:`, e);
        parsedGeometry = null;
      }
    } else if (!actif.is_valid_geometry) {
      console.warn(`Actif ${actif.id} has invalid geometry in database`);
    }
    
    return {
      id: actif.id,
      nom: actif.nom,
      code: actif.code,
      latitude: actif.latitude,
      longitude: actif.longitude,
      geometry: parsedGeometry, // Will be null if invalid
      statutOperationnel: actif.statutOperationnel,
      etatGeneral: actif.etatGeneral,
      type: actif.type || 'inconnu',
      groupe: actif.groupeNom,
      famille: actif.familleNom,
      portefeuille: actif.portefeuilleNom,
      anomaliesActives: 0, 
      maintenancesPrevues: 0
    };
  });
}
  async updateStatutOperationnel(id: number, nouveauStatut: string): Promise<Actif | null> {
    await this.actifRepository.update(id, { 
      statutOperationnel: nouveauStatut,
      dateMiseAJour: new Date()
    });
    return this.findOne(id);
  }
    async findActifsSansGroupe(): Promise<Actif[]> {
    return this.actifRepository.createQueryBuilder('actif')
      .leftJoinAndSelect('actif.anomalies', 'anomalies')
      .leftJoinAndSelect('actif.maintenances', 'maintenances')
      .where('actif.groupeActifId IS NULL')
      .getMany();
  }


}