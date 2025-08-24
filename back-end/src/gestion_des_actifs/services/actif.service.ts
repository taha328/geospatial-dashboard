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

        // Validate and serialize specifications and geometry before sending to DB
        let specsString: string | null = null;
        if (actifData.specifications) {
          try {
            specsString = typeof actifData.specifications === 'string'
              ? actifData.specifications
              : JSON.stringify(actifData.specifications);
            // quick parse check
            JSON.parse(specsString);
          } catch (e) {
            console.error('Invalid specifications JSON:', actifData.specifications, e);
            throw new BadRequestException('Invalid specifications JSON provided');
          }
        }

        let geomString: string;
        try {
          geomString = typeof geometryForPostGIS === 'string' ? geometryForPostGIS : JSON.stringify(geometryForPostGIS);
          JSON.parse(geomString);
        } catch (e) {
          console.error('Invalid geometry JSON for actif:', geometryForPostGIS, e);
          throw new BadRequestException('Invalid geometry JSON provided');
        }

        // CORRECTED QUERY WITH SEQUENTIAL PARAMETERS
        // Accept either GeoJSON string or hex WKB. Detect by simple regex and
        // use the appropriate PostGIS constructor to build a geometry.
        const result = await this.actifRepository.query(`
          WITH input_validation AS (
            SELECT $13 as raw_input,
              CASE
                WHEN $13 ~ '^\\s*\\{' OR $13 ~ '^\\s*\\[' THEN 'geojson'
                WHEN $13 ~ '^([0-9A-Fa-f]){2,}$' THEN 'wkb_hex'
                ELSE 'unknown'
              END as input_type
          ),
          input_geom AS (
            SELECT
              CASE
                WHEN input_type = 'geojson' THEN ST_Transform(ST_GeomFromGeoJSON(raw_input), 26191)
                WHEN input_type = 'wkb_hex' THEN ST_Transform(ST_SetSRID(ST_GeomFromWKB(decode(raw_input, 'hex')), 4326), 26191)
                ELSE NULL
              END as geom
            FROM input_validation
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
          specsString, // $12
          geomString // $13
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
// Updated ActifService methods to use EPSG:4326 instead of SRID 26191

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
        ? (() => { try { return JSON.parse(actifData.geometry); } catch { return actifData.geometry; } })()
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

    // Normalize Feature / FeatureCollection
    if (geometryForPostGIS && geometryForPostGIS.type === 'Feature') geometryForPostGIS = geometryForPostGIS.geometry;
    if (geometryForPostGIS && geometryForPostGIS.type === 'FeatureCollection' && geometryForPostGIS.features?.length > 0) {
      geometryForPostGIS = geometryForPostGIS.features[0].geometry;
    }

    // Compute centroid from GeoJSON coords (same helper functions)
    function polygonCentroidFromGeoJSON(coords: number[][][]): [number, number] | null {
      const ring = coords[0];
      if (!Array.isArray(ring) || ring.length < 3) return null;
      if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
        ring.push([ring[0][0], ring[0][1]]);
      }
      let A = 0, Cx = 0, Cy = 0;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        const cross = xi * yj - xj * yi;
        A += cross;
        Cx += (xi + xj) * cross;
        Cy += (yi + yj) * cross;
      }
      A = A / 2;
      if (Math.abs(A) < 1e-12) {
        const pts = ring.slice(0, -1);
        const sum = pts.reduce((s, p) => { s[0] += p[0]; s[1] += p[1]; return s; }, [0, 0]);
        return [sum[0] / pts.length, sum[1] / pts.length];
      }
      return [Cx / (6 * A), Cy / (6 * A)];
    }

    function multiPolygonCentroid(coords: number[][][][]): [number, number] | null {
      let totalArea = 0, sumX = 0, sumY = 0;
      for (const poly of coords) {
        const c = polygonCentroidFromGeoJSON(poly as any);
        if (!c) continue;
        const ring = poly[0];
        let A = 0;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const xi = ring[i][0], yi = ring[i][1];
          const xj = ring[j][0], yj = ring[j][1];
          A += xi * yj - xj * yi;
        }
        A = Math.abs(A) / 2;
        totalArea += A;
        sumX += c[0] * A;
        sumY += c[1] * A;
      }
      if (totalArea === 0) return null;
      return [sumX / totalArea, sumY / totalArea];
    }

    // Compute centroid from GeoJSON coords when available
    let centroid: [number, number] | null = null;
    if (geometryForPostGIS && typeof geometryForPostGIS === 'object' && geometryForPostGIS.coordinates) {
      try {
        if (geometryForPostGIS.type === 'Point') {
          centroid = [Number(geometryForPostGIS.coordinates[0]), Number(geometryForPostGIS.coordinates[1])];
        } else if (geometryForPostGIS.type === 'Polygon') {
          centroid = polygonCentroidFromGeoJSON(geometryForPostGIS.coordinates as any);
        } else if (geometryForPostGIS.type === 'MultiPolygon') {
          centroid = multiPolygonCentroid(geometryForPostGIS.coordinates as any);
        }
      } catch (e) {
        console.warn('Failed to compute centroid in TS:', e);
        centroid = null;
      }
    }

    // Validate and serialize specifications and geometry
    let specsString: string | null = null;
    if (actifData.specifications) {
      try {
        specsString = typeof actifData.specifications === 'string'
          ? actifData.specifications
          : JSON.stringify(actifData.specifications);
        JSON.parse(specsString);
      } catch (e) {
        console.error('Invalid specifications JSON:', actifData.specifications, e);
        throw new BadRequestException('Invalid specifications JSON provided');
      }
    }

    let geomString: string;
    try {
      geomString = typeof geometryForPostGIS === 'string' ? geometryForPostGIS : JSON.stringify(geometryForPostGIS);
      try { JSON.parse(geomString); } catch { /* it's probably WKB hex, that's ok */ }
    } catch (e) {
      console.error('Invalid geometry JSON for actif:', geometryForPostGIS, e);
      throw new BadRequestException('Invalid geometry JSON provided');
    }

    const centroidLon = centroid ? centroid[0] : (actifData.longitude !== undefined ? Number(actifData.longitude) : null);
    const centroidLat = centroid ? centroid[1] : (actifData.latitude !== undefined ? Number(actifData.latitude) : null);

    // FIXED: Store geometry in EPSG:4326 instead of SRID 26191
    const result = await this.actifRepository.query(`
      WITH geom_input AS (
        SELECT
          CASE
      WHEN $15 ~ '^\\s*\\{' OR $15 ~ '^\\s*\\[' THEN ST_SetSRID(ST_GeomFromGeoJSON($15), 4326)
            WHEN $15 ~ '^([0-9A-Fa-f]){2,}$' THEN ST_SetSRID(ST_GeomFromWKB(decode($15, 'hex')), 4326)
            ELSE NULL
          END as geom_4326
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
        $13::float, $14::float,
        $7, $8, $9, $10, $11, $12,
        (SELECT geom_4326 FROM geom_input), -- Store in EPSG:4326
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      RETURNING
        id, nom, code, type, description, "statutOperationnel", "etatGeneral",
        latitude, longitude, "valeurAcquisition", "groupeActifId", "dateMiseEnService",
        "dateFinGarantie", fournisseur, specifications,
        ST_AsGeoJSON(geometry) as geometry, -- No transformation needed since it's already 4326
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
      specsString, // $12
      centroidLat, // $13
      centroidLon, // $14
      geomString // $15
    ]);

    if (!result || result.length === 0) {
      throw new BadRequestException('Failed to create actif - geometry might be invalid');
    }

    const savedActif = result[0];
    console.log('Created actif geometry info:', {
      id: savedActif.id,
      geometry_is_valid: savedActif.geometry_is_valid,
      geometry_srid: savedActif.geometry_srid,
      has_geometry: !!savedActif.geometry,
      stored_lat: savedActif.latitude,
      stored_lng: savedActif.longitude
    });

    if (savedActif.geometry) {
      try { savedActif.geometry = JSON.parse(savedActif.geometry); } catch (e) { savedActif.geometry = null; }
    }
    if (savedActif.specifications && typeof savedActif.specifications === 'string') {
      try { savedActif.specifications = JSON.parse(savedActif.specifications); } catch (e) { /* ignore */ }
    }
    return savedActif;
  } catch (error) {
    console.error('Error in createActifFromMap:', error);
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException(`Error creating actif from map: ${error.message}`);
  }
}

// Updated getActifsPourCarte method
async getActifsPourCarte(): Promise<any[]> {
  const actifs = await this.actifRepository.query(`
    SELECT 
      a.id, a.nom, a.code, a.type, a."statutOperationnel", a."etatGeneral",
      a.latitude, a.longitude,
      -- Return geometry as GeoJSON in EPSG:4326 (no transformation needed)
      CASE 
        WHEN a.geometry IS NOT NULL AND ST_IsValid(a.geometry) THEN
          ST_AsGeoJSON(a.geometry)
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

        // Validate and coerce coordinates
        const coerceCoords = (g: any): boolean => {
          if (!g || typeof g !== 'object') return false;
          if (!('coordinates' in g)) return false;
          const walk = (c: any): boolean => {
            if (Array.isArray(c)) {
              for (let i = 0; i < c.length; i++) {
                const item = c[i];
                if (Array.isArray(item)) {
                  if (!walk(item)) return false;
                } else {
                  const num = Number(item);
                  if (!isFinite(num)) return false;
                  c[i] = num;
                }
              }
              return true;
            }
            return false;
          };
          return walk(g.coordinates);
        };

        const coerced = coerceCoords(parsedGeometry);
        if (!coerced) {
          console.warn(`Actif ${actif.id} parsed geometry coordinates are invalid or non-numeric`);
          parsedGeometry = null;
        }

        if (parsedGeometry && typeof parsedGeometry === 'object' && parsedGeometry.coordinates) {
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

          // Validate coordinate structure for polygons
          if (parsedGeometry.type === 'Polygon') {
            const coords = parsedGeometry.coordinates;
            if (!Array.isArray(coords) || coords.length === 0 || !Array.isArray(coords[0])) {
              console.warn(`Invalid polygon structure for actif ${actif.id}`);
              parsedGeometry = null;
            } else {
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
      geometry: parsedGeometry,
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