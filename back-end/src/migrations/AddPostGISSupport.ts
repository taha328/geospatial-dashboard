
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostGISSupport1699999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable PostGIS extension
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    
    // Create spatial index on geometry column
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_zone_geometry 
      ON zone USING GIST (geometry);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_zone_geometry;');
    await queryRunner.query('DROP EXTENSION IF EXISTS postgis;');
  }
}