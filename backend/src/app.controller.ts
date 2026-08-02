import { Controller, Get, Req } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { Request } from "express";

interface DatabaseInfo {
  host: string | null;
  port: string | null;
  name: string | null;
}

interface HealthResponse {
  status: string;
  timestamp: string;
  environment: string;
  urls: {
    frontend: string | null;
    backend: string | null;
    database: string | null;
  };
  database: DatabaseInfo;
}

/**
 * Redacts credentials from a connection string for public exposure.
 * The health endpoint is public (exempt from IP restriction) and probed by
 * Render, so DB credentials MUST never appear in the response.
 * Example: postgresql://user:pass@host:5432/db -> postgresql://host:5432/db
 */
function maskDatabaseUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return "unparseable";
  }
}

/**
 * Extracts the connection target (host, port, database name) from a
 * connection string — WITHOUT any credentials.
 */
function parseDatabaseInfo(url?: string | null): DatabaseInfo {
  if (!url) return { host: null, port: null, name: null };
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || null,
      port: parsed.port || null,
      name: parsed.pathname.replace(/^\//, "") || null,
    };
  } catch {
    return { host: null, port: null, name: null };
  }
}

@Controller()
export class AppController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHello(): { message: string; timestamp: string } {
    return {
      message: "Bookkeeping API is running",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("health")
  async getHealth(@Req() req: Request): Promise<HealthResponse> {
    let dbStatus = "ok";
    try {
      await this.dataSource.query("SELECT 1");
    } catch {
      dbStatus = "degraded";
    }

    const dbUrl = this.configService.get<string>("DB_URL");

    return {
      status: dbStatus,
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>("NODE_ENV", "development"),
      urls: {
        frontend: this.configService.get<string>("FRONTEND_URL") ?? null,
        backend:
          this.configService.get<string>("BACKEND_URL") ??
          `${req.protocol}://${req.get("host")}`,
        database: maskDatabaseUrl(dbUrl),
      },
      database: parseDatabaseInfo(dbUrl),
    };
  }
}
