import { config } from "dotenv";
import { DataSource, DataSourceOptions } from "typeorm";

config();

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  entities: [__dirname + "/**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/database/migrations/*{.ts,.js}"],

  logging: true,
};

export const dataSource = new DataSource(dataSourceOptions);
