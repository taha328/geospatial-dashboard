
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostGISSupport1704451200001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable PostGIS extension
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    
    // Note: Spatial index will be created when zone table is added in future migrations
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: No spatial index to drop if not created
    await queryRunner.query('DROP EXTENSION IF EXISTS postgis;');
  }
}