import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============ CREATE ENUMS ============

    // CategoryType enum
    await queryRunner.query(`
      CREATE TYPE "category_type_enum" AS ENUM ('expense', 'income')
    `);

    // InvoiceStatus enum
    await queryRunner.query(`
      CREATE TYPE "invoice_status_enum" AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled')
    `);

    // IncomeType enum
    await queryRunner.query(`
      CREATE TYPE "income_type_enum" AS ENUM ('contractor_payment', 'freelance', 'consulting', 'other')
    `);

    // ============ CREATE TABLES ============

    // users table
    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          {
            name: "id",
            type: "uuid",
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
            isPrimary: true,
          },
          {
            name: "email",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "password",
            type: "varchar",
          },
          {
            name: "isActive",
            type: "boolean",
            default: true,
          },
          {
            name: "isEmailVerified",
            type: "boolean",
            default: false,
          },
          {
            name: "resetToken",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "resetTokenExpiresAt",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );

    // categories table
    await queryRunner.createTable(
      new Table({
        name: "categories",
        columns: [
          {
            name: "id",
            type: "uuid",
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
            isPrimary: true,
          },
          {
            name: "name",
            type: "varchar",
          },
          {
            name: "type",
            type: "enum",
            enumName: "category_type_enum",
            default: "'expense'",
          },
          {
            name: "description",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "isActive",
            type: "boolean",
            default: true,
          },
          {
            name: "userId",
            type: "uuid",
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );

    // expenses table
    await queryRunner.createTable(
      new Table({
        name: "expenses",
        columns: [
          {
            name: "id",
            type: "uuid",
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
            isPrimary: true,
          },
          {
            name: "amount",
            type: "decimal",
            precision: 10,
            scale: 2,
          },
          {
            name: "description",
            type: "varchar",
          },
          {
            name: "date",
            type: "date",
          },
          {
            name: "userId",
            type: "uuid",
          },
          {
            name: "categoryId",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "notes",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "isRecurring",
            type: "boolean",
            default: false,
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );

    // incomes table
    await queryRunner.createTable(
      new Table({
        name: "incomes",
        columns: [
          {
            name: "id",
            type: "uuid",
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
            isPrimary: true,
          },
          {
            name: "amount",
            type: "decimal",
            precision: 10,
            scale: 2,
          },
          {
            name: "description",
            type: "varchar",
          },
          {
            name: "type",
            type: "enum",
            enumName: "income_type_enum",
            default: "'contractor_payment'",
          },
          {
            name: "date",
            type: "date",
          },
          {
            name: "userId",
            type: "uuid",
          },
          {
            name: "clientName",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "invoiceNumber",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "isPaid",
            type: "boolean",
            default: false,
          },
          {
            name: "paidDate",
            type: "date",
            isNullable: true,
          },
          {
            name: "notes",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "hstAmount",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "includesHst",
            type: "boolean",
            default: false,
          },
          {
            name: "payPeriodWeeks",
            type: "int",
            isNullable: true,
          },
          {
            name: "payPeriodCount",
            type: "int",
            isNullable: true,
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );

    // clients table
    await queryRunner.createTable(
      new Table({
        name: "clients",
        columns: [
          {
            name: "id",
            type: "uuid",
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
            isPrimary: true,
          },
          {
            name: "name",
            type: "varchar",
          },
          {
            name: "email",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "phone",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "address",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "notes",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "isActive",
            type: "boolean",
            default: true,
          },
          {
            name: "userId",
            type: "uuid",
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );

    // invoices table
    await queryRunner.createTable(
      new Table({
        name: "invoices",
        columns: [
          {
            name: "id",
            type: "uuid",
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
            isPrimary: true,
          },
          {
            name: "invoiceNumber",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "clientId",
            type: "varchar",
          },
          {
            name: "clientName",
            type: "varchar",
          },
          {
            name: "clientEmail",
            type: "varchar",
          },
          {
            name: "clientAddress",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "subtotal",
            type: "decimal",
            precision: 10,
            scale: 2,
          },
          {
            name: "taxAmount",
            type: "decimal",
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: "discountAmount",
            type: "decimal",
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: "total",
            type: "decimal",
            precision: 10,
            scale: 2,
          },
          {
            name: "status",
            type: "enum",
            enumName: "invoice_status_enum",
            default: "'draft'",
          },
          {
            name: "issueDate",
            type: "date",
          },
          {
            name: "dueDate",
            type: "date",
            isNullable: true,
          },
          {
            name: "paidDate",
            type: "date",
            isNullable: true,
          },
          {
            name: "notes",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "terms",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "userId",
            type: "uuid",
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );

    // invoice_items table
    await queryRunner.createTable(
      new Table({
        name: "invoice_items",
        columns: [
          {
            name: "id",
            type: "uuid",
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
            isPrimary: true,
          },
          {
            name: "description",
            type: "varchar",
          },
          {
            name: "quantity",
            type: "int",
            default: 1,
          },
          {
            name: "unitPrice",
            type: "decimal",
            precision: 10,
            scale: 2,
          },
          {
            name: "total",
            type: "decimal",
            precision: 10,
            scale: 2,
          },
          {
            name: "invoiceId",
            type: "uuid",
          },
        ],
      }),
      true,
    );

    // attachments table
    await queryRunner.createTable(
      new Table({
        name: "attachments",
        columns: [
          {
            name: "id",
            type: "uuid",
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
            isPrimary: true,
          },
          {
            name: "originalName",
            type: "varchar",
          },
          {
            name: "fileName",
            type: "varchar",
          },
          {
            name: "mimeType",
            type: "varchar",
          },
          {
            name: "size",
            type: "bigint",
          },
          {
            name: "description",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "entityType",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "entityId",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "userId",
            type: "uuid",
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );

    // budgets table
    await queryRunner.createTable(
      new Table({
        name: "budgets",
        columns: [
          {
            name: "id",
            type: "uuid",
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
            isPrimary: true,
          },
          {
            name: "amount",
            type: "decimal",
            precision: 10,
            scale: 2,
          },
          {
            name: "spent",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: "startDate",
            type: "date",
          },
          {
            name: "endDate",
            type: "date",
          },
          {
            name: "name",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "period",
            type: "varchar",
            default: "'monthly'",
          },
          {
            name: "categoryId",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "userId",
            type: "uuid",
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );

    // ============ CREATE INDEXES ============

    // expenses indexes
    await queryRunner.createIndex(
      "expenses",
      new TableIndex({
        name: "IDX_expenses_userId_date",
        columnNames: ["userId", "date"],
      }),
    );
    await queryRunner.createIndex(
      "expenses",
      new TableIndex({
        name: "IDX_expenses_date",
        columnNames: ["date"],
      }),
    );

    // incomes indexes
    await queryRunner.createIndex(
      "incomes",
      new TableIndex({
        name: "IDX_incomes_userId_date",
        columnNames: ["userId", "date"],
      }),
    );
    await queryRunner.createIndex(
      "incomes",
      new TableIndex({
        name: "IDX_incomes_date",
        columnNames: ["date"],
      }),
    );

    // clients indexes
    await queryRunner.createIndex(
      "clients",
      new TableIndex({
        name: "IDX_clients_userId_name",
        columnNames: ["userId", "name"],
      }),
    );

    // ============ CREATE FOREIGN KEYS ============

    // categories -> users
    await queryRunner.createForeignKey(
      "categories",
      new TableForeignKey({
        name: "FK_categories_user",
        columnNames: ["userId"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // expenses -> users
    await queryRunner.createForeignKey(
      "expenses",
      new TableForeignKey({
        name: "FK_expenses_user",
        columnNames: ["userId"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // expenses -> categories
    await queryRunner.createForeignKey(
      "expenses",
      new TableForeignKey({
        name: "FK_expenses_category",
        columnNames: ["categoryId"],
        referencedTableName: "categories",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
    );

    // incomes -> users
    await queryRunner.createForeignKey(
      "incomes",
      new TableForeignKey({
        name: "FK_incomes_user",
        columnNames: ["userId"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // clients -> users
    await queryRunner.createForeignKey(
      "clients",
      new TableForeignKey({
        name: "FK_clients_user",
        columnNames: ["userId"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // invoices -> users
    await queryRunner.createForeignKey(
      "invoices",
      new TableForeignKey({
        name: "FK_invoices_user",
        columnNames: ["userId"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // invoice_items -> invoices
    await queryRunner.createForeignKey(
      "invoice_items",
      new TableForeignKey({
        name: "FK_invoice_items_invoice",
        columnNames: ["invoiceId"],
        referencedTableName: "invoices",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // attachments -> users
    await queryRunner.createForeignKey(
      "attachments",
      new TableForeignKey({
        name: "FK_attachments_user",
        columnNames: ["userId"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // budgets -> users
    await queryRunner.createForeignKey(
      "budgets",
      new TableForeignKey({
        name: "FK_budgets_user",
        columnNames: ["userId"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // budgets -> categories
    await queryRunner.createForeignKey(
      "budgets",
      new TableForeignKey({
        name: "FK_budgets_category",
        columnNames: ["categoryId"],
        referencedTableName: "categories",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ============ DROP FOREIGN KEYS ============

    await queryRunner.dropForeignKey("budgets", "FK_budgets_category");
    await queryRunner.dropForeignKey("budgets", "FK_budgets_user");
    await queryRunner.dropForeignKey("attachments", "FK_attachments_user");
    await queryRunner.dropForeignKey(
      "invoice_items",
      "FK_invoice_items_invoice",
    );
    await queryRunner.dropForeignKey("invoices", "FK_invoices_user");
    await queryRunner.dropForeignKey("clients", "FK_clients_user");
    await queryRunner.dropForeignKey("incomes", "FK_incomes_user");
    await queryRunner.dropForeignKey("expenses", "FK_expenses_category");
    await queryRunner.dropForeignKey("expenses", "FK_expenses_user");
    await queryRunner.dropForeignKey("categories", "FK_categories_user");

    // ============ DROP INDEXES ============

    await queryRunner.dropIndex("clients", "IDX_clients_userId_name");
    await queryRunner.dropIndex("incomes", "IDX_incomes_date");
    await queryRunner.dropIndex("incomes", "IDX_incomes_userId_date");
    await queryRunner.dropIndex("expenses", "IDX_expenses_date");
    await queryRunner.dropIndex("expenses", "IDX_expenses_userId_date");

    // ============ DROP TABLES ============

    await queryRunner.dropTable("budgets");
    await queryRunner.dropTable("attachments");
    await queryRunner.dropTable("invoice_items");
    await queryRunner.dropTable("invoices");
    await queryRunner.dropTable("clients");
    await queryRunner.dropTable("incomes");
    await queryRunner.dropTable("expenses");
    await queryRunner.dropTable("categories");
    await queryRunner.dropTable("users");

    // ============ DROP ENUMS ============

    await queryRunner.query(`DROP TYPE IF EXISTS "income_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "invoice_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "category_type_enum"`);
  }
}
