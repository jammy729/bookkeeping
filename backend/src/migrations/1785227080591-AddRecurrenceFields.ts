import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecurrenceFields1785227080591 implements MigrationInterface {
  name = "AddRecurrenceFields1785227080591";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."expenses_recurrencefrequency_enum" AS ENUM('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD "recurrenceFrequency" "public"."expenses_recurrencefrequency_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "expenses" ADD "nextOccurrence" date`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP COLUMN "nextOccurrence"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP COLUMN "recurrenceFrequency"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."expenses_recurrencefrequency_enum"`,
    );
  }
}
