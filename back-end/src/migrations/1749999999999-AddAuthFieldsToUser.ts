import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthFieldsToUser1749999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "password_hash" text`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "invite_token_hash" text`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "invite_token_expires_at" timestamptz`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "must_reset_password" boolean DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'utilisateur'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "created_at"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "must_reset_password"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "invite_token_expires_at"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "invite_token_hash"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "is_active"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "password_hash"`);
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT`);
  }
}
