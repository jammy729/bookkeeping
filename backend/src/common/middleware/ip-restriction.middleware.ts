import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class IpRestrictionMiddleware implements NestMiddleware {
  private readonly allowedIps: string[];

  constructor() {
    const raw = process.env.ALLOWED_IPS || "";
    this.allowedIps = raw
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);
  }

  use(req: Request, res: Response, next: NextFunction): void {
    if (this.allowedIps.length === 0) {
      return next();
    }

    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      "";

    if (this.allowedIps.includes(clientIp)) {
      return next();
    }

    res.status(403).json({
      statusCode: 403,
      message: "Forbidden: Your IP is not authorized to access this resource",
    });
  }
}
