import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAtColumns1785137050399 implements MigrationInterface {
  name = "AddDeletedAtColumns1785137050399";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('create', 'update', 'delete', 'restore')`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "entityType" character varying NOT NULL, "entityId" character varying NOT NULL, "action" "public"."audit_logs_action_enum" NOT NULL, "beforeState" jsonb, "afterState" jsonb, "ipAddress" character varying, "userAgent" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c69efb19bf127c97e6740ad530" ON "audit_logs" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_964a76c3a637b055687b9c132b" ON "audit_logs" ("userId", "entityType", "entityId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "deletedAt" TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "expenses" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "incomes" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "clients" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "invoices" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD "deletedAt" TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "budgets" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "invoice_items" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" ADD "deletedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice_items" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(`ALTER TABLE "budgets" DROP COLUMN "deletedAt"`);
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "incomes" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "deletedAt"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_964a76c3a637b055687b9c132b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c69efb19bf127c97e6740ad530"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
  }
}
