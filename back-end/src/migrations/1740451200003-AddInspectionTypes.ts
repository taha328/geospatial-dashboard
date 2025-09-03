import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInspectionTypes1740451200003 implements MigrationInterface {
    name = 'AddInspectionTypes1740451200003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create TypeInspection table
        await queryRunner.query(`
            CREATE TABLE "types_inspection" (
                "id" SERIAL NOT NULL,
                "numero_inspection" integer NOT NULL,
                "type_inspection" character varying(255) NOT NULL,
                "description" text,
                "statut" character varying CHECK ("statut" IN ('actif', 'inactif')) NOT NULL DEFAULT 'actif',
                "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
                "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_types_inspection_numero" UNIQUE ("numero_inspection"), 
                CONSTRAINT "PK_types_inspection" PRIMARY KEY ("id")
            )
        `);

        // Create TypeInspectionGroupe table
        await queryRunner.query(`
            CREATE TABLE "types_inspection_groupe" (
                "id" SERIAL NOT NULL,
                "numero_groupe" integer NOT NULL,
                "numero_inspection" integer NOT NULL,
                "type_inspection" character varying(255) NOT NULL,
                "description" text,
                "statut" character varying CHECK ("statut" IN ('actif', 'inactif')) NOT NULL DEFAULT 'actif',
                "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
                "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_types_inspection_groupe" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "types_inspection_groupe" 
            ADD CONSTRAINT "FK_types_inspection_groupe_inspection" 
            FOREIGN KEY ("numero_inspection") REFERENCES "types_inspection"("numero_inspection") 
            ON DELETE CASCADE
        `);

        console.log('✅ Added inspection types tables');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "types_inspection_groupe" 
            DROP CONSTRAINT "FK_types_inspection_groupe_inspection"
        `);

        // Drop tables
        await queryRunner.query(`DROP TABLE "types_inspection_groupe"`);
        await queryRunner.query(`DROP TABLE "types_inspection"`);

        console.log('✅ Removed inspection types tables');
    }
}
