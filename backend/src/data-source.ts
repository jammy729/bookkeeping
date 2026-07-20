import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'bookkeeping',
  entities: [
    'src/entities/**/*.entity{.ts,.js}',
  ],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
};

export const dataSource = new DataSource(dataSourceOptions);
