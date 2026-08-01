import { config } from "dotenv";
import { resolve } from "path";
import { DataSource, DataSourceOptions } from "typeorm";
import { SeederOptions } from "typeorm-extension";

config({ path: resolve(__dirname, "../../.env") });

const url = process.env.DB_DIRECT_URL || process.env.DB_URL;

if (!url) {
  throw new Error("DB_URL is required (set it in the root .env file)");
}

const options: DataSourceOptions & SeederOptions = {
  type: "postgres" as const,
  url,
  ssl: { rejectUnauthorized: false },
  entities: [__dirname + "/**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/migrations/*{.ts,.js}"],
  seeds: [__dirname + "/database/seeds/**/*{.ts,.js}"],
  logging: true,
};

export const dataSourceOptions = options;
export const dataSource = new DataSource(options);
