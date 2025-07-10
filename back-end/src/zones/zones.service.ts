import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from './zone.entity';

// Add interface for GeoJSON geometry
interface GeoJSONGeometry {
  type: string;
  coordinates: any[];
}

@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(Zone)
    private zoneRepository: Repository<Zone>,
  ) {}

  async create(zoneData: Partial<Zone>): Promise<Zone> {
    try {
      // Check if geometry exists
      if (!zoneData.geometry) {
        throw new BadRequestException('Geometry is required');
      }

      console.log('Original geometry data:', zoneData.geometry);
      console.log('Geometry type:', typeof zoneData.geometry);

      // Parse geometry if it's a string
      let geometry: GeoJSONGeometry | string | undefined = zoneData.geometry;
      if (typeof geometry === 'string') {
        try {
          geometry = JSON.parse(geometry) as GeoJSONGeometry;
          console.log('Parsed geometry:', geometry);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new BadRequestException('Invalid JSON geometry format');
        }
      }

      // Type guard to ensure geometry is not undefined
      if (!geometry) {
        throw new BadRequestException('Geometry is required');
      }

      // Validate geometry structure
      if (typeof geometry === 'string') {
        throw new BadRequestException('Geometry must be a valid GeoJSON object');
      }

      // Check if geometry has required properties
      if (!geometry.type || !geometry.coordinates) {
        console.error('Invalid geometry structure:', geometry);
        throw new BadRequestException('Invalid GeoJSON geometry: missing type or coordinates');
      }

      // Validate specific geometry types
      if (!this.isValidGeoJSONType(geometry.type)) {
        throw new BadRequestException(`Invalid geometry type: ${geometry.type}`);
      }

      console.log('Valid geometry:', geometry);

      // Create zone using raw SQL to handle PostGIS geometry
      const result = await this.zoneRepository.query(`
        INSERT INTO zone (name, type, geometry, description, color, opacity)
        VALUES ($1, $2, ST_Transform(ST_GeomFromGeoJSON($3), 26191), $4, $5, $6)
        RETURNING id, name, type, ST_AsGeoJSON(ST_Transform(geometry, 4326)) as geometry, 
                 description, color, opacity, "createdAt", "updatedAt"
      `, [
        zoneData.name,
        zoneData.type,
        JSON.stringify(geometry),
        zoneData.description || null,
        zoneData.color || '#ff0000',
        zoneData.opacity || 1.0
      ]);

      if (!result?.[0]) {
        throw new BadRequestException('Failed to create zone');
      }

      return result[0] as Zone;
    } catch (error) {
      console.error('Error creating zone:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create zone: ${error.message}`);
    }
  }

  private isValidGeoJSONType(type: string): boolean {
    const validTypes = [
      'Point',
      'LineString',
      'Polygon',
      'MultiPoint',
      'MultiLineString',
      'MultiPolygon',
      'GeometryCollection'
    ];
    return validTypes.includes(type);
  }

  async findAll(): Promise<Zone[]> {
    try {
      return await this.zoneRepository.query(`
        SELECT 
          id,
          name,
          type,
          ST_AsGeoJSON(ST_Transform(geometry, 4326)) as geometry,
          description,
          color,
          opacity,
          "createdAt",
          "updatedAt"
        FROM zone
        ORDER BY "createdAt" DESC
      `);
    } catch (error) {
      console.error('Error fetching zones:', error);
      throw new BadRequestException(`Failed to fetch zones: ${error.message}`);
    }
  }

  async findOne(id: number): Promise<Zone | null> {
    try {
      const result = await this.zoneRepository.query(`
        SELECT 
          id,
          name,
          type,
          ST_AsGeoJSON(ST_Transform(geometry, 4326)) as geometry,
          description,
          color,
          opacity,
          "createdAt",
          "updatedAt"
        FROM zone 
        WHERE id = $1
      `, [id]);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error fetching zone:', error);
      throw new BadRequestException(`Failed to fetch zone: ${error.message}`);
    }
  }

  async update(id: number, updateData: Partial<Zone>): Promise<Zone> {
    try {
      // Check if zone exists
      const existingZone = await this.findOne(id);
      if (!existingZone) {
        throw new NotFoundException(`Zone with ID ${id} not found`);
      }

      if (updateData.geometry) {
        // Parse geometry if it's a string
        let geometry: GeoJSONGeometry | string | undefined = updateData.geometry;
        if (typeof geometry === 'string') {
          try {
            geometry = JSON.parse(geometry) as GeoJSONGeometry;
          } catch (parseError) {
            throw new BadRequestException('Invalid JSON geometry format');
          }
        }

        // Type guard to ensure geometry is not undefined
        if (!geometry) {
          throw new BadRequestException('Geometry is required');
        }

        // Validate geometry structure
        if (typeof geometry === 'string') {
          throw new BadRequestException('Geometry must be a valid GeoJSON object');
        }

        // Check if geometry has required properties
        if (!geometry.type || !geometry.coordinates) {
          throw new BadRequestException('Invalid GeoJSON geometry: missing type or coordinates');
        }

        await this.zoneRepository.query(`
          UPDATE zone 
          SET 
            name = COALESCE($2, name),
            type = COALESCE($3, type),
            geometry = ST_Transform(ST_GeomFromGeoJSON($4), 26191),
            description = COALESCE($5, description),
            color = COALESCE($6, color),
            opacity = COALESCE($7, opacity),
            "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [
          id,
          updateData.name,
          updateData.type,
          JSON.stringify(geometry),
          updateData.description,
          updateData.color,
          updateData.opacity
        ]);
      } else {
        await this.zoneRepository.query(`
          UPDATE zone 
          SET 
            name = COALESCE($2, name),
            type = COALESCE($3, type),
            description = COALESCE($4, description),
            color = COALESCE($5, color),
            opacity = COALESCE($6, opacity),
            "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [
          id,
          updateData.name,
          updateData.type,
          updateData.description,
          updateData.color,
          updateData.opacity
        ]);
      }

      const updatedZone = await this.findOne(id);
      if (!updatedZone) {
        throw new BadRequestException('Failed to update zone');
      }

      return updatedZone;
    } catch (error) {
      console.error('Error updating zone:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update zone: ${error.message}`);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      // Check if zone exists
      const existingZone = await this.findOne(id);
      if (!existingZone) {
        throw new NotFoundException(`Zone with ID ${id} not found`);
      }

      const result = await this.zoneRepository.delete(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`Zone with ID ${id} not found`);
      }
    } catch (error) {
      console.error('Error deleting zone:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete zone: ${error.message}`);
    }
  }

  // Spatial queries
  async findZonesContainingPoint(longitude: number, latitude: number): Promise<Zone[]> {
    try {
      return await this.zoneRepository.query(`
        SELECT 
          id,
          name,
          type,
          ST_AsGeoJSON(ST_Transform(geometry, 4326)) as geometry,
          description,
          color,
          opacity,
          "createdAt",
          "updatedAt"
        FROM zone 
        WHERE ST_Contains(
          geometry, 
          ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), 4326), 26191)
        )
        ORDER BY name
      `, [longitude, latitude]);
    } catch (error) {
      console.error('Error finding zones containing point:', error);
      throw new BadRequestException(`Failed to find zones containing point: ${error.message}`);
    }
  }

  async findZonesWithinDistance(longitude: number, latitude: number, distanceMeters: number): Promise<Zone[]> {
    try {
      return await this.zoneRepository.query(`
        SELECT 
          id,
          name,
          type,
          ST_AsGeoJSON(ST_Transform(geometry, 4326)) as geometry,
          description,
          color,
          opacity,
          "createdAt",
          "updatedAt",
          ST_Distance(geometry, ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), 4326), 26191)) as distance
        FROM zone 
        WHERE ST_DWithin(
          geometry, 
          ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), 4326), 26191), 
          $3
        )
        ORDER BY distance
      `, [longitude, latitude, distanceMeters]);
    } catch (error) {
      console.error('Error finding zones within distance:', error);
      throw new BadRequestException(`Failed to find zones within distance: ${error.message}`);
    }
  }

  // Additional utility methods
  async getZoneArea(id: number): Promise<number> {
    try {
      const result = await this.zoneRepository.query(`
        SELECT ST_Area(geometry) as area
        FROM zone
        WHERE id = $1
      `, [id]);

      return result[0]?.area || 0;
    } catch (error) {
      console.error('Error calculating zone area:', error);
      throw new BadRequestException(`Failed to calculate zone area: ${error.message}`);
    }
  }

  async getZonePerimeter(id: number): Promise<number> {
    try {
      const result = await this.zoneRepository.query(`
        SELECT ST_Perimeter(geometry) as perimeter
        FROM zone
        WHERE id = $1
      `, [id]);

      return result[0]?.perimeter || 0;
    } catch (error) {
      console.error('Error calculating zone perimeter:', error);
      throw new BadRequestException(`Failed to calculate zone perimeter: ${error.message}`);
    }
  }

  async findIntersectingZones(zoneId: number): Promise<Zone[]> {
    try {
      return await this.zoneRepository.query(`
        SELECT 
          z2.id,
          z2.name,
          z2.type,
          ST_AsGeoJSON(ST_Transform(z2.geometry, 4326)) as geometry,
          z2.description,
          z2.color,
          z2.opacity,
          z2."createdAt",
          z2."updatedAt"
        FROM zone z1, zone z2
        WHERE z1.id = $1 
          AND z2.id != $1
          AND ST_Intersects(z1.geometry, z2.geometry)
        ORDER BY z2.name
      `, [zoneId]);
    } catch (error) {
      console.error('Error finding intersecting zones:', error);
      throw new BadRequestException(`Failed to find intersecting zones: ${error.message}`);
    }
  }
}