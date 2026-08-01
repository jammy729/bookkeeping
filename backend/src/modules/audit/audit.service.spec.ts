import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditService } from "./audit.service";
import { AuditLog, AuditAction } from "./audit.entity";

describe("AuditService", () => {
  let service: AuditService;
  let auditRepo: jest.Mocked<Repository<AuditLog>>;

  const mockAuditEntry = {
    id: "audit-1",
    userId: "user-1",
    entityType: "expense",
    entityId: "expense-1",
    action: AuditAction.CREATE,
    beforeState: null,
    afterState: { amount: 100, description: "Test" },
    ipAddress: "127.0.0.1",
    userAgent: "jest-test",
    createdAt: new Date(),
  } as unknown as AuditLog;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    auditRepo = module.get(getRepositoryToken(AuditLog));
  });

  describe("log", () => {
    it("should create and save an audit log entry", async () => {
      auditRepo.create.mockReturnValue(mockAuditEntry);
      auditRepo.save.mockResolvedValue(mockAuditEntry);

      const result = await service.log({
        userId: "user-1",
        entityType: "expense",
        entityId: "expense-1",
        action: AuditAction.CREATE,
        afterState: { amount: 100, description: "Test" },
        ipAddress: "127.0.0.1",
        userAgent: "jest-test",
      });

      expect(result).toEqual(mockAuditEntry);
      expect(auditRepo.create).toHaveBeenCalledWith({
        userId: "user-1",
        entityType: "expense",
        entityId: "expense-1",
        action: AuditAction.CREATE,
        beforeState: null,
        afterState: { amount: 100, description: "Test" },
        ipAddress: "127.0.0.1",
        userAgent: "jest-test",
      });
    });

    it("should handle minimal log parameters", async () => {
      auditRepo.create.mockReturnValue(mockAuditEntry);
      auditRepo.save.mockResolvedValue(mockAuditEntry);

      await service.log({
        userId: "user-1",
        entityType: "expense",
        entityId: "expense-1",
        action: AuditAction.DELETE,
        beforeState: { amount: 100 },
      });

      expect(auditRepo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("findByEntity", () => {
    it("should return audit logs for an entity", async () => {
      auditRepo.find.mockResolvedValue([mockAuditEntry]);

      const result = await service.findByEntity("expense", "expense-1");

      expect(result).toHaveLength(1);
      expect(auditRepo.find).toHaveBeenCalledWith({
        where: { entityType: "expense", entityId: "expense-1" },
        order: { createdAt: "DESC" },
        take: 50,
      });
    });

    it("should respect custom limit", async () => {
      auditRepo.find.mockResolvedValue([]);

      await service.findByEntity("expense", "expense-1", 10);

      expect(auditRepo.find).toHaveBeenCalledWith({
        where: { entityType: "expense", entityId: "expense-1" },
        order: { createdAt: "DESC" },
        take: 10,
      });
    });
  });

  describe("findByUser", () => {
    it("should return audit logs for a user", async () => {
      auditRepo.find.mockResolvedValue([mockAuditEntry]);

      const result = await service.findByUser("user-1");

      expect(result).toHaveLength(1);
      expect(auditRepo.find).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        order: { createdAt: "DESC" },
        take: 50,
      });
    });
  });
});
