import { MigrationInterface, QueryRunner } from "typeorm";

export class FixMissingResetPasswordColumns1756586575108 implements MigrationInterface {
    name = 'FixMissingResetPasswordColumns1756586575108'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add missing reset password columns
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD COLUMN IF NOT EXISTS "reset_token_hash" text
        `);
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD COLUMN IF NOT EXISTS "reset_token_expires_at" TIMESTAMPTZ
        `);

        // Update default role to 'operateur'
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'operateur'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "reset_token_expires_at"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "reset_token_hash"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'utilisateur'`);
    }

}
