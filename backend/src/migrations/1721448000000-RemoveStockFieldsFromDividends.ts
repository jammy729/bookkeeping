import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveStockFieldsFromDividends1721448000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the stock-related columns from dividends table
    await queryRunner.dropColumn('dividends', 'stockSymbol');
    await queryRunner.dropColumn('dividends', 'sharesCount');
    await queryRunner.dropColumn('dividends', 'dividendPerShare');
    await queryRunner.dropColumn('dividends', 'isReinvested');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back the stock-related columns
    await queryRunner.addColumn('dividends', new TableColumn({
      name: 'stockSymbol',
      type: 'varchar',
      isNullable: true,
    }));

    await queryRunner.addColumn('dividends', new TableColumn({
      name: 'sharesCount',
      type: 'int',
      isNullable: true,
    }));

    await queryRunner.addColumn('dividends', new TableColumn({
      name: 'dividendPerShare',
      type: 'decimal',
      precision: 10,
      scale: 4,
      isNullable: true,
    }));

    await queryRunner.addColumn('dividends', new TableColumn({
      name: 'isReinvested',
      type: 'boolean',
      default: false,
    }));
  }
}
