import { Request, Response } from "express";
import { IpRestrictionMiddleware } from "./ip-restriction.middleware";

interface MockRequest {
  headers: Record<string, unknown>;
  path: string;
  ip: string;
}

describe("IpRestrictionMiddleware", () => {
  const originalAllowedIps = process.env.ALLOWED_IPS;

  let req: MockRequest;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      headers: {},
      path: "/api/expenses",
      ip: "8.8.8.8",
    };
    res = {
      status: jest.fn().mockReturnThis() as unknown as Response["status"],
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    if (originalAllowedIps === undefined) {
      delete process.env.ALLOWED_IPS;
    } else {
      process.env.ALLOWED_IPS = originalAllowedIps;
    }
  });

  it("should call next() when x-forwarded-for contains an allowed IP", () => {
    process.env.ALLOWED_IPS = "1.2.3.4";
    req.headers["x-forwarded-for"] = "1.2.3.4";

    const middleware = new IpRestrictionMiddleware();
    middleware.use(req as unknown as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should respond 403 when the IP is disallowed", () => {
    process.env.ALLOWED_IPS = "1.2.3.4";
    req.headers["x-forwarded-for"] = "9.9.9.9";

    const middleware = new IpRestrictionMiddleware();
    middleware.use(req as unknown as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject spoof attempts: the LAST x-forwarded-for entry wins", () => {
    process.env.ALLOWED_IPS = "1.2.3.4";
    req.headers["x-forwarded-for"] = "1.2.3.4, 9.9.9.9";

    const middleware = new IpRestrictionMiddleware();
    middleware.use(req as unknown as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it("should fall back to req.ip when x-forwarded-for is absent", () => {
    process.env.ALLOWED_IPS = "8.8.8.8";

    const middleware = new IpRestrictionMiddleware();
    middleware.use(req as unknown as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it.each(["/api/health", "/api/health/", "/api", "/api/", "/"])(
    "should call next() for exempt path %s even with a disallowed IP",
    (path) => {
      process.env.ALLOWED_IPS = "1.2.3.4";
      req.path = path;
      req.headers["x-forwarded-for"] = "9.9.9.9";

      const middleware = new IpRestrictionMiddleware();
      middleware.use(req as unknown as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    },
  );

  it("should call next() for an exempt path with mixed casing (exempt-path match is case-insensitive)", () => {
    process.env.ALLOWED_IPS = "1.2.3.4";
    req.path = "/API/Health";
    req.headers["x-forwarded-for"] = "9.9.9.9";

    const middleware = new IpRestrictionMiddleware();
    middleware.use(req as unknown as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should allow all traffic when ALLOWED_IPS is empty", () => {
    process.env.ALLOWED_IPS = "";

    const middleware = new IpRestrictionMiddleware();
    middleware.use(req as unknown as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
