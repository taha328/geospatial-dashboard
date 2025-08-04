import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOuvragesAmarrageToFamilleType1725459398000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new enum value to the existing enum type
        await queryRunner.query(`
            ALTER TYPE familles_actifs_type_enum 
            ADD VALUE IF NOT EXISTS 'ouvrages_amarrage'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL doesn't support removing enum values directly
        // This would require recreating the enum type
        console.log('Cannot remove enum value - PostgreSQL limitation');
    }
}