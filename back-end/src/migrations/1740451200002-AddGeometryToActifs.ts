import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGeometryToActifs1740451200002 implements MigrationInterface {
  name = 'AddGeometryToActifs1740451200002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add geometry column to actifs table
    await queryRunner.query(`
      ALTER TABLE "actifs" 
      ADD COLUMN "geometry" geometry(Geometry, 26191)
    `);

    // Make latitude and longitude nullable since polygon/linestring actifs won't use them
    await queryRunner.query(`
      ALTER TABLE "actifs" 
      ALTER COLUMN "latitude" DROP NOT NULL
    `);
    
    await queryRunner.query(`
      ALTER TABLE "actifs" 
      ALTER COLUMN "longitude" DROP NOT NULL
    `);

    // Add a check constraint to ensure either lat/lng OR geometry is provided
    await queryRunner.query(`
      ALTER TABLE "actifs" 
      ADD CONSTRAINT "actif_location_check" 
      CHECK (
        (latitude IS NOT NULL AND longitude IS NOT NULL AND geometry IS NULL) OR
        (latitude IS NULL AND longitude IS NULL AND geometry IS NOT NULL)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the check constraint
    await queryRunner.query(`
      ALTER TABLE "actifs" 
      DROP CONSTRAINT "actif_location_check"
    `);

    // Make latitude and longitude NOT NULL again (this will fail if there are polygon actifs)
    await queryRunner.query(`
      ALTER TABLE "actifs" 
      ALTER COLUMN "latitude" SET NOT NULL
    `);
    
    await queryRunner.query(`
      ALTER TABLE "actifs" 
      ALTER COLUMN "longitude" SET NOT NULL
    `);

    // Remove geometry column
    await queryRunner.query(`
      ALTER TABLE "actifs" 
      DROP COLUMN "geometry"
    `);
  }
}
