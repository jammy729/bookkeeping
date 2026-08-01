import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class IpRestrictionMiddleware implements NestMiddleware {
  private readonly allowedIps: string[];
  // Exempt paths are stored lowercase; the comparison lowercases req.path so
  // the match is case-insensitive (paths like /API/Health still pass through).
  private readonly exemptPaths = new Set(["/api/health", "/api", "/api/", "/"]);

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

    // Render's own health probes / monitoring must always be allowed through
    if (this.exemptPaths.has(req.path.toLowerCase())) {
      return next();
    }

    const forwardedFor = req.headers["x-forwarded-for"];
    const forwardedIps =
      typeof forwardedFor === "string"
        ? forwardedFor
            .split(",")
            .map((ip) => ip.trim())
            .filter(Boolean)
        : [];
    // Use the LAST entry: the first is spoofable by the client; the last is
    // appended by the immediate proxy (Render), so it reflects the real IP.
    const clientIp = forwardedIps[forwardedIps.length - 1] || req.ip || "";

    if (this.allowedIps.includes(clientIp)) {
      return next();
    }

    res.status(403).json({
      statusCode: 403,
      message: "Forbidden: Your IP is not authorized to access this resource",
    });
  }
}
