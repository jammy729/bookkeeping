import { MigrationInterface, QueryRunner } from "typeorm";

export class ReplaceNameWithFirstLast1785129517609 implements MigrationInterface {
  name = "ReplaceNameWithFirstLast1785129517609";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasName = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name'`,
    );
    if (hasName.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "users" ADD "firstName" character varying`,
      );
      await queryRunner.query(
        `ALTER TABLE "users" ADD "lastName" character varying`,
      );
      await queryRunner.query(
        `UPDATE "users" SET "firstName" = "name", "lastName" = '' WHERE "firstName" IS NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "users" ALTER COLUMN "firstName" SET NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "users" ALTER COLUMN "lastName" SET NOT NULL`,
      );
      await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasFirstName = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'firstName'`,
    );
    if (hasFirstName.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "users" ADD "name" character varying NOT NULL DEFAULT ''`,
      );
      await queryRunner.query(`UPDATE "users" SET "name" = "firstName"`);
      await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
      await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
    }
  }
}
