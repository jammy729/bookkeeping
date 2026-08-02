import { DataSource } from "typeorm";
import { AppController } from "./app.controller";

describe("AppController", () => {
  let controller: AppController;
  let dataSource: { query: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    dataSource = { query: jest.fn() };
    configService = { get: jest.fn() };
    controller = new AppController(
      dataSource as unknown as DataSource,
      configService as unknown as import("@nestjs/config").ConfigService,
    );
  });

  describe("getHello", () => {
    it("should return the API running message shape", () => {
      const result = controller.getHello();

      expect(result).toEqual({
        message: "Bookkeeping API is running",
        timestamp: expect.any(String),
      });
      expect(typeof result.timestamp).toBe("string");
    });
  });

  describe("getHealth", () => {
    const req = {
      protocol: "http",
      get: jest.fn().mockReturnValue("localhost:3001"),
    };

    function stubConfig(overrides: Record<string, string | undefined> = {}) {
      configService.get.mockImplementation(
        (key: string, defaultValue?: string) => overrides[key] ?? defaultValue,
      );
    }

    const DB_URL =
      "postgresql://postgres.user:super-secret@db.example.com:5432/bookkeeping";

    it("should return status ok with environment and redacted DB details when DB ping succeeds", async () => {
      dataSource.query.mockResolvedValue([{ "?column?": 1 }]);
      stubConfig({
        NODE_ENV: "development",
        FRONTEND_URL: "http://localhost:5173",
        BACKEND_URL: "http://localhost:3001",
        DB_URL,
      });

      const result = await controller.getHealth(req as never);

      expect(result).toEqual({
        status: "ok",
        timestamp: expect.any(String),
        environment: "development",
        urls: {
          frontend: "http://localhost:5173",
          backend: "http://localhost:3001",
          database: "postgresql://db.example.com:5432/bookkeeping",
        },
        database: {
          host: "db.example.com",
          port: "5432",
          name: "bookkeeping",
        },
      });
      expect(dataSource.query).toHaveBeenCalledWith("SELECT 1");
      // Approved payload: DB credentials are NEVER exposed (redacted) —
      // health info disclosure is a security risk, but environment + the
      // connection target (host/port/name) aid operators.
      const raw = JSON.stringify(result);
      expect(raw).not.toContain("super-secret");
      expect(raw).not.toContain("postgres.user");
    });

    it("should return status degraded when DB ping throws", async () => {
      dataSource.query.mockRejectedValue(new Error("connection refused"));
      stubConfig({
        NODE_ENV: "production",
        FRONTEND_URL: "http://localhost:5173",
        BACKEND_URL: "http://localhost:3001",
        DB_URL,
      });

      const result = await controller.getHealth(req as never);

      expect(result).toEqual({
        status: "degraded",
        timestamp: expect.any(String),
        environment: "production",
        urls: {
          frontend: "http://localhost:5173",
          backend: "http://localhost:3001",
          database: "postgresql://db.example.com:5432/bookkeeping",
        },
        database: {
          host: "db.example.com",
          port: "5432",
          name: "bookkeeping",
        },
      });
      expect(dataSource.query).toHaveBeenCalledWith("SELECT 1");
    });

    it("should fall back to the request host when BACKEND_URL is not set", async () => {
      dataSource.query.mockResolvedValue([{ "?column?": 1 }]);
      stubConfig({
        NODE_ENV: "qa",
        FRONTEND_URL: "http://localhost:5173",
        DB_URL,
      });

      const result = await controller.getHealth(req as never);

      expect(result.urls.backend).toBe("http://localhost:3001");
      expect(result.environment).toBe("qa");
    });

    it("should return null database details when DB_URL is missing", async () => {
      dataSource.query.mockResolvedValue([{ "?column?": 1 }]);
      stubConfig({});

      const result = await controller.getHealth(req as never);

      expect(result).toEqual({
        status: "ok",
        timestamp: expect.any(String),
        environment: "development",
        urls: {
          frontend: null,
          backend: "http://localhost:3001",
          database: null,
        },
        database: { host: null, port: null, name: null },
      });
    });
  });
});
