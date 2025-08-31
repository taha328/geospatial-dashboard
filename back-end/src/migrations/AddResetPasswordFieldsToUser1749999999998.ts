import { MigrationInterface, QueryRunner } from "typeorm";

export class AddResetPasswordFieldsToUser1749999999998 implements MigrationInterface {
    name = 'AddResetPasswordFieldsToUser1749999999998'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD COLUMN "reset_token_hash" text
        `);
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD COLUMN "reset_token_expires_at" TIMESTAMPTZ
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
            DROP COLUMN "reset_token_expires_at"
        `);
        await queryRunner.query(`
            ALTER TABLE "user"
            DROP COLUMN "reset_token_hash"
        `);
    }
}
