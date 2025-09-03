import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateActifGeometrySrid1740451200005 implements MigrationInterface {
    name = 'UpdateActifGeometrySrid1740451200005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Transform existing geometries from SRID 26191 to EPSG:4326 where needed
        await queryRunner.query(`
            UPDATE actifs
            SET geometry = ST_Transform(geometry, 4326)
            WHERE geometry IS NOT NULL
              AND ST_SRID(geometry) = 26191;
        `);

        // Step 2: Drop any SRID enforcement constraint if present
        await queryRunner.query(`
            ALTER TABLE "actifs"
            DROP CONSTRAINT IF EXISTS "enforce_srid_geometry";
        `);

        // Step 3: Alter column type to explicitly use SRID 4326.
        // Use USING with CASE to avoid double-transforming geometries already in 4326.
        await queryRunner.query(`
            ALTER TABLE "actifs"
            ALTER COLUMN geometry TYPE geometry(Geometry,4326)
            USING (CASE
                WHEN geometry IS NULL THEN NULL
                WHEN ST_SRID(geometry) = 4326 THEN geometry
                WHEN ST_SRID(geometry) = 26191 THEN ST_SetSRID(ST_Transform(geometry,4326),4326)
                ELSE ST_SetSRID(ST_Transform(geometry,4326),4326)
            END);
        `);

        // Step 4: Update geometry_columns if it exists (older PostGIS compatibility)
        await queryRunner.query(`
            UPDATE geometry_columns
            SET srid = 4326
            WHERE f_table_name = 'actifs'
              AND f_geometry_column = 'geometry';
        `).catch(() => { /* ignore if geometry_columns not present */ });

        // Step 5: Verify all geometries are now in EPSG:4326
        const result = await queryRunner.query(`
            SELECT COUNT(*)::int as count
            FROM actifs
            WHERE geometry IS NOT NULL
              AND ST_SRID(geometry) != 4326;
        `);

        const remaining = result && result[0] ? Number(result[0].count) : 0;
        if (remaining > 0) {
            throw new Error(`Migration failed: ${remaining} geometries still not in EPSG:4326`);
        }

        console.log('Successfully migrated all actif geometries to EPSG:4326');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverse: transform back to SRID 26191
        await queryRunner.query(`
            UPDATE actifs
            SET geometry = ST_Transform(geometry, 26191)
            WHERE geometry IS NOT NULL
              AND ST_SRID(geometry) = 4326;
        `);

        // Alter column back to SRID 26191
        await queryRunner.query(`
            ALTER TABLE "actifs"
            ALTER COLUMN geometry TYPE geometry(Geometry,26191)
            USING (CASE
                WHEN geometry IS NULL THEN NULL
                WHEN ST_SRID(geometry) = 26191 THEN geometry
                WHEN ST_SRID(geometry) = 4326 THEN ST_SetSRID(ST_Transform(geometry,26191),26191)
                ELSE ST_SetSRID(ST_Transform(geometry,26191),26191)
            END);
        `);

        await queryRunner.query(`
            UPDATE geometry_columns
            SET srid = 26191
            WHERE f_table_name = 'actifs'
              AND f_geometry_column = 'geometry';
        `).catch(() => { /* ignore if geometry_columns not present */ });

        console.log('Reverted actif geometries back to SRID 26191');
    }

}
