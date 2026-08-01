import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { IncomeService } from "./income.service";
import { Income, IncomeType } from "../../entities/income.entity";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.entity";

describe("IncomeService", () => {
  let service: IncomeService;
  let incomeRepo: jest.Mocked<Repository<Income>>;
  let auditService: jest.Mocked<AuditService>;

  const userId = "user-1";

  function buildMockIncome(overrides: Partial<Income> = {}): Income {
    return {
      id: "income-1",
      userId,
      amount: 5000,
      description: "Consulting work",
      type: IncomeType.CONSULTING,
      date: new Date("2024-06-15"),
      clientName: "Acme Corp",
      invoiceNumber: null,
      isPaid: false,
      paidDate: null,
      notes: null,
      hstAmount: null,
      includesHst: false,
      payPeriodWeeks: null,
      payPeriodCount: null,
      createdAt: new Date("2024-06-15"),
      updatedAt: new Date("2024-06-15"),
      deletedAt: null,
      ...overrides,
    } as Income;
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomeService,
        {
          provide: getRepositoryToken(Income),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            softRemove: jest.fn(),
            restore: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<IncomeService>(IncomeService);
    incomeRepo = module.get(getRepositoryToken(Income));
    auditService = module.get(AuditService);
  });

  describe("create", () => {
    it("should create income and log audit", async () => {
      const income = buildMockIncome();
      const dto = {
        amount: 5000,
        description: "Consulting work",
        type: IncomeType.CONSULTING,
        date: new Date("2024-06-15"),
      };
      incomeRepo.create.mockReturnValue(income);
      incomeRepo.save.mockResolvedValue(income);

      const result = await service.create(userId, dto);

      expect(result).toEqual(income);
      expect(auditService.log).toHaveBeenCalledWith({
        userId,
        entityType: "income",
        entityId: income.id,
        action: AuditAction.CREATE,
        afterState: income,
      });
    });
  });

  describe("findAll", () => {
    it("should return all income records", async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([buildMockIncome()]),
      } as any;
      incomeRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(1);
    });

    it("should filter by date range", async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any;
      incomeRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(userId, {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      });

      expect(qb.andWhere).toHaveBeenCalled();
    });

    it("should filter by type", async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any;
      incomeRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(userId, { type: IncomeType.CONSULTING });

      expect(qb.andWhere).toHaveBeenCalled();
    });

    it("should filter by payment status", async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any;
      incomeRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(userId, { isPaid: true });

      expect(qb.andWhere).toHaveBeenCalled();
    });

    it("should return paginated results", async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[buildMockIncome()], 1]),
      } as any;
      incomeRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(userId, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe("findOne", () => {
    it("should return income by id", async () => {
      const income = buildMockIncome();
      incomeRepo.findOne.mockResolvedValue(income);

      const result = await service.findOne(userId, "income-1");

      expect(result).toEqual(income);
    });

    it("should throw NotFoundException when not found", async () => {
      incomeRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, "nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("should update income and log audit", async () => {
      const income = buildMockIncome();
      incomeRepo.findOne.mockResolvedValue(income);
      const updatedIncome = { ...income, amount: 6000 };
      incomeRepo.save.mockResolvedValue(updatedIncome);

      const result = await service.update(userId, "income-1", { amount: 6000 });

      expect(result.amount).toBe(6000);
      expect(auditService.log).toHaveBeenCalledWith({
        userId,
        entityType: "income",
        entityId: "income-1",
        action: AuditAction.UPDATE,
        beforeState: expect.objectContaining({ amount: 5000 }),
        afterState: updatedIncome,
      });
    });
  });

  describe("delete", () => {
    it("should soft delete and log audit", async () => {
      incomeRepo.findOne.mockResolvedValue(buildMockIncome());
      incomeRepo.softRemove.mockResolvedValue(undefined);

      await service.delete(userId, "income-1");

      expect(incomeRepo.softRemove).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith({
        userId,
        entityType: "income",
        entityId: "income-1",
        action: AuditAction.DELETE,
        beforeState: expect.objectContaining({ amount: 5000 }),
      });
    });
  });

  describe("restore", () => {
    it("should restore and log audit", async () => {
      const income = buildMockIncome();
      const deletedIncome = { ...income, deletedAt: new Date() };
      incomeRepo.findOne
        .mockResolvedValueOnce(deletedIncome)
        .mockResolvedValueOnce(income);
      incomeRepo.restore.mockResolvedValue(undefined);

      const result = await service.restore(userId, "income-1");

      expect(result).toBeDefined();
      expect(auditService.log).toHaveBeenCalledWith({
        userId,
        entityType: "income",
        entityId: "income-1",
        action: AuditAction.RESTORE,
        beforeState: { deletedAt: deletedIncome.deletedAt },
        afterState: income,
      });
    });
  });

  describe("getTotalByPeriod", () => {
    it("should return total income for period", async () => {
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: "15000" }),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
      } as any;
      incomeRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getTotalByPeriod(
        userId,
        new Date("2024-01-01"),
        new Date("2024-12-31"),
      );

      expect(result).toBe(15000);
    });
  });

  describe("getTotalByType", () => {
    it("should return totals grouped by income type", async () => {
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { type: "consulting", total: "10000" },
          { type: "freelance", total: "5000" },
        ]),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
      } as any;
      incomeRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getTotalByType(
        userId,
        new Date("2024-01-01"),
        new Date("2024-12-31"),
      );

      expect(result).toHaveLength(2);
      expect(result.find((r) => r.type === "consulting")!.total).toBe(10000);
    });
  });

  describe("getTotalByClient", () => {
    it("should return totals grouped by client", async () => {
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { clientName: "Acme Corp", total: "10000", count: "2" },
          { clientName: null, total: "5000", count: "1" },
        ]),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
      } as any;
      incomeRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getTotalByClient(
        userId,
        new Date("2024-01-01"),
        new Date("2024-12-31"),
      );

      expect(result.find((r) => r.clientName === "No Client")).toBeDefined();
    });
  });

  describe("getMonthlyTotals", () => {
    it("should return monthly income totals", async () => {
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { month: "2024-01", total: "5000" },
          { month: "2024-02", total: "7500" },
        ]),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
      } as any;
      incomeRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getMonthlyTotals(
        userId,
        new Date("2024-01-01"),
        new Date("2024-12-31"),
      );

      expect(result[0].total).toBe(5000);
    });
  });
});
