import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateDividendsToExpenses1721448100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Create 'Owner Distribution' category for each user who has dividends
    // First, get all users who have dividends
    const usersWithDividends = await queryRunner.query(`
      SELECT DISTINCT "userId" FROM dividends
    `);

    for (const userRow of usersWithDividends) {
      const userId = userRow.userId;

      // Create the Owner Distribution category for this user
      await queryRunner.query(
        `
        INSERT INTO categories ("name", "type", "description", "isActive", "userId", "createdAt", "updatedAt")
        VALUES ('Owner Distribution', 'expense', 'Money taken out of the business by owner', true, $1, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `,
        [userId],
      );
    }

    // Step 2: Migrate dividend records to expenses
    await queryRunner.query(`
      INSERT INTO expenses ("amount", "description", "date", "userId", "categoryId", "notes", "isRecurring", "createdAt", "updatedAt")
      SELECT 
        d."amount",
        COALESCE(d."description", 'Owner Distribution'),
        d."date",
        d."userId",
        c."id" as "categoryId",
        COALESCE(d."notes", 'Owner distribution - migrated from dividends table'),
        false as "isRecurring",
        d."createdAt",
        d."updatedAt"
      FROM dividends d
      INNER JOIN categories c ON c."userId" = d."userId" AND c."name" = 'Owner Distribution'
    `);

    // Step 3: Drop the dividends table
    await queryRunner.dropTable("dividends");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate dividends table
    await queryRunner.query(`
      CREATE TABLE "dividends" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "amount" decimal(10,2) NOT NULL,
        "description" character varying NOT NULL,
        "date" date NOT NULL,
        "userId" uuid NOT NULL,
        "notes" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dividends" PRIMARY KEY ("id")
      )
    `);

    // Migrate back (lossy - won't have original dividend-specific fields)
    await queryRunner.query(`
      INSERT INTO dividends ("id", "amount", "description", "date", "userId", "notes", "createdAt", "updatedAt")
      SELECT 
        e."id",
        e."amount",
        e."description",
        e."date",
        e."userId",
        e."notes",
        e."createdAt",
        e."updatedAt"
      FROM expenses e
      INNER JOIN categories c ON c."id" = e."categoryId"
      WHERE c."name" = 'Owner Distribution'
    `);

    // Delete the migrated expenses
    await queryRunner.query(`
      DELETE FROM expenses
      WHERE "categoryId" IN (
        SELECT "id" FROM categories WHERE "name" = 'Owner Distribution'
      )
    `);

    // Optionally remove the Owner Distribution category
    await queryRunner.query(`
      DELETE FROM categories WHERE "name" = 'Owner Distribution'
    `);
  }
}
