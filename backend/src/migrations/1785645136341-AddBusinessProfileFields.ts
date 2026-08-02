import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessProfileFields1785645136341 implements MigrationInterface {
  name = "AddBusinessProfileFields1785645136341";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "businessName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "businessType" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "industry" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "taxSettings" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "currency" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "fiscalYearStart" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "onboardingCompleted" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "onboardingCompleted"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "fiscalYearStart"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "currency"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "taxSettings"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "industry"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "businessType"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "businessName"`);
  }
}
