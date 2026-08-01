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
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    let dbStatus = "ok";
    try {
      await this.dataSource.query("SELECT 1");
    } catch {
      dbStatus = "degraded";
    }

    return {
      status: dbStatus,
      timestamp: new Date().toISOString(),
    };
  }
}
