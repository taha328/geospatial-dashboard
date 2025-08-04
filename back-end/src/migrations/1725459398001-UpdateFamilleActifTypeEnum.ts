import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateFamilleActifTypeEnum1725459398001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create a new enum type with all values
        await queryRunner.query(`
            CREATE TYPE familles_actifs_type_enum_new AS ENUM (
                'batiments',
                'infrastructures_portuaires', 
                'reseaux_utilitaires',
                'equipements_specifiques',
                'zones_stockage',
                'equipements_transport',
                'ouvrages_amarrage'
            )
        `);

        // Update the column to use the new enum
        await queryRunner.query(`
            ALTER TABLE familles_actifs 
            ALTER COLUMN type TYPE familles_actifs_type_enum_new 
            USING type::text::familles_actifs_type_enum_new
        `);

        // Drop the old enum and rename the new one
        await queryRunner.query(`DROP TYPE familles_actifs_type_enum`);
        await queryRunner.query(`ALTER TYPE familles_actifs_type_enum_new RENAME TO familles_actifs_type_enum`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate the old enum without 'ouvrages_amarrage'
        await queryRunner.query(`
            CREATE TYPE familles_actifs_type_enum_new AS ENUM (
                'batiments',
                'infrastructures_portuaires',
                'reseaux_utilitaires', 
                'equipements_specifiques',
                'zones_stockage',
                'equipements_transport'
            )
        `);

        await queryRunner.query(`
            ALTER TABLE familles_actifs 
            ALTER COLUMN type TYPE familles_actifs_type_enum_new 
            USING type::text::familles_actifs_type_enum_new
        `);

        await queryRunner.query(`DROP TYPE familles_actifs_type_enum`);
        await queryRunner.query(`ALTER TYPE familles_actifs_type_enum_new RENAME TO familles_actifs_type_enum`);
    }
}