import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getHello(): { message: string; timestamp: string } {
    return {
      message: "Bookkeeping API is running",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("health")
  getHealth(): {
    status: string;
    timestamp: string;
    commit: string;
    uptime: number;
  } {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      commit: process.env.GIT_COMMIT || "unknown",
      uptime: process.uptime(),
    };
  }
}
