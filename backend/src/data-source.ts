import { config } from "dotenv";
import { DataSource, DataSourceOptions } from "typeorm";
import { SeederOptions } from "typeorm-extension";

config();

const url = process.env.DB_URL;

const options: DataSourceOptions & SeederOptions = url
  ? {
      type: "postgres" as const,
      url,
      ssl: { rejectUnauthorized: false },
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      migrations: [__dirname + "/migrations/*{.ts,.js}"],
      seeds: [__dirname + "/database/seeds/**/*{.ts,.js}"],
      logging: true,
    }
  : {
      type: "postgres" as const,
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_DATABASE || "bookkeeping",

      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      migrations: [__dirname + "/migrations/*{.ts,.js}"],
      seeds: [__dirname + "/database/seeds/**/*{.ts,.js}"],
      logging: true,
    };

export const dataSourceOptions = options;
export const dataSource = new DataSource(options);
