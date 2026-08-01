import { DataSource } from "typeorm";
import { AppController } from "./app.controller";

describe("AppController", () => {
  let controller: AppController;
  let dataSource: { query: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    dataSource = { query: jest.fn() };
    controller = new AppController(dataSource as unknown as DataSource);
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
    it("should return status ok when DB ping succeeds, exposing ONLY status and timestamp", async () => {
      dataSource.query.mockResolvedValue([{ "?column?": 1 }]);

      const result = await controller.getHealth();

      expect(result).toEqual({
        status: "ok",
        timestamp: expect.any(String),
      });
      expect(Object.keys(result)).toEqual(["status", "timestamp"]);
      expect(dataSource.query).toHaveBeenCalledWith("SELECT 1");
    });

    it("should return status degraded when DB ping throws, exposing ONLY status and timestamp", async () => {
      dataSource.query.mockRejectedValue(new Error("connection refused"));

      const result = await controller.getHealth();

      expect(result).toEqual({
        status: "degraded",
        timestamp: expect.any(String),
      });
      expect(Object.keys(result)).toEqual(["status", "timestamp"]);
      expect(dataSource.query).toHaveBeenCalledWith("SELECT 1");
    });
  });
});
