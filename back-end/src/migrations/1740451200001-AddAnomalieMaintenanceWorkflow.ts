import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnomalieMaintenanceWorkflow1740451200001 implements MigrationInterface {
    name = 'AddAnomalieMaintenanceWorkflow1740451200001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add maintenanceId column to anomalies table
        await queryRunner.query(`ALTER TABLE "anomalies" ADD "maintenanceId" integer`);
        
        // Add anomalieId column to maintenances table
        await queryRunner.query(`ALTER TABLE "maintenances" ADD "anomalieId" integer`);
        
        // Add foreign key constraint for anomalies.maintenanceId
        await queryRunner.query(`ALTER TABLE "anomalies" ADD CONSTRAINT "FK_anomalies_maintenanceId" FOREIGN KEY ("maintenanceId") REFERENCES "maintenances"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        
        // Add foreign key constraint for maintenances.anomalieId
        await queryRunner.query(`ALTER TABLE "maintenances" ADD CONSTRAINT "FK_maintenances_anomalieId" FOREIGN KEY ("anomalieId") REFERENCES "anomalies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraints
        await queryRunner.query(`ALTER TABLE "maintenances" DROP CONSTRAINT "FK_maintenances_anomalieId"`);
        await queryRunner.query(`ALTER TABLE "anomalies" DROP CONSTRAINT "FK_anomalies_maintenanceId"`);
        
        // Remove columns
        await queryRunner.query(`ALTER TABLE "maintenances" DROP COLUMN "anomalieId"`);
        await queryRunner.query(`ALTER TABLE "anomalies" DROP COLUMN "maintenanceId"`);
    }
}
