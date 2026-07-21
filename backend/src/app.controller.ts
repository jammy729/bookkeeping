import { Controller, Get } from "@nestjs/common";
import { DataSource } from "typeorm";

@Controller()
export class AppController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  getHello(): { message: string; timestamp: string } {
    return {
      message: "Bookkeeping API is running",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("health")
  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    commit: string;
    uptime: number;
    database: { status: string; latencyMs: number };
  }> {
    const start = Date.now();
    let dbStatus = "ok";
    try {
      await this.dataSource.query("SELECT 1");
    } catch {
      dbStatus = "error";
    }
    const latencyMs = Date.now() - start;

    return {
      status: dbStatus === "ok" ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      commit: process.env.GIT_COMMIT || "unknown",
      uptime: process.uptime(),
      database: { status: dbStatus, latencyMs },
    };
  }
}
