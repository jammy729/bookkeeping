import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { ExpensesService } from "./expenses.service";
import { Expense } from "../../entities/expense.entity";
import { Attachment } from "../../entities/attachment.entity";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.entity";

describe("ExpensesService", () => {
  let service: ExpensesService;
  let expenseRepo: jest.Mocked<Repository<Expense>>;
  let attachmentRepo: jest.Mocked<Repository<Attachment>>;
  let auditService: jest.Mocked<AuditService>;

  const userId = "user-1";

  function buildMockExpense(overrides: Partial<Expense> = {}): Expense {
    return {
      id: "expense-1",
      userId,
      amount: 100,
      description: "Test expense",
      date: new Date("2024-06-15"),
      categoryId: "cat-1",
      notes: null,
      isRecurring: false,
      category: { id: "cat-1", name: "Rent" } as any,
      createdAt: new Date("2024-06-15"),
      updatedAt: new Date("2024-06-15"),
      deletedAt: null,
      ...overrides,
    } as Expense;
  }

  function buildMockQueryBuilder(methods: Record<string, any> = {}) {
    const qb: any = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue(null),
      ...methods,
    };
    return qb;
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: getRepositoryToken(Expense),
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
          provide: getRepositoryToken(Attachment),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
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

    service = module.get<ExpensesService>(ExpensesService);
    expenseRepo = module.get(getRepositoryToken(Expense));
    attachmentRepo = module.get(getRepositoryToken(Attachment));
    auditService = module.get(AuditService);
  });

  describe("create", () => {
    it("should create an expense and log audit", async () => {
      const expense = buildMockExpense();
      const dto = {
        amount: 100,
        description: "Test",
        date: new Date("2024-06-15"),
      };
      expenseRepo.create.mockReturnValue(expense);
      expenseRepo.save.mockResolvedValue(expense);

      const result = await service.create(userId, dto);

      expect(result).toEqual(expense);
      expect(expenseRepo.create).toHaveBeenCalledWith({ ...dto, userId });
      expect(auditService.log).toHaveBeenCalledWith({
        userId,
        entityType: "expense",
        entityId: expense.id,
        action: AuditAction.CREATE,
        afterState: expense,
      });
    });
  });

  describe("findAll", () => {
    it("should return expenses with attachments (no pagination)", async () => {
      const expenses = [buildMockExpense()];
      const qb = buildMockQueryBuilder({
        getMany: jest.fn().mockResolvedValue(expenses),
      });
      expenseRepo.createQueryBuilder.mockReturnValue(qb);
      attachmentRepo.find.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(1);
      expect(result[0].attachments).toEqual([]);
    });

    it("should return paginated expenses", async () => {
      const expenses = [buildMockExpense()];
      const qb = buildMockQueryBuilder({
        getManyAndCount: jest.fn().mockResolvedValue([expenses, 1]),
      });
      expenseRepo.createQueryBuilder.mockReturnValue(qb);
      attachmentRepo.find.mockResolvedValue([]);

      const result = await service.findAll(userId, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it("should filter by date range", async () => {
      const qb = buildMockQueryBuilder({
        getMany: jest.fn().mockResolvedValue([]),
      });
      expenseRepo.createQueryBuilder.mockReturnValue(qb);
      attachmentRepo.find.mockResolvedValue([]);

      await service.findAll(userId, {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        "expense.date BETWEEN :startDate AND :endDate",
        expect.objectContaining({ startDate: expect.any(Date) }),
      );
    });
  });

  describe("findOne", () => {
    it("should return expense with attachments", async () => {
      expenseRepo.findOne.mockResolvedValue(buildMockExpense());
      attachmentRepo.find.mockResolvedValue([{ id: "att-1" } as Attachment]);

      const result = await service.findOne(userId, "expense-1");

      expect(result.attachments).toHaveLength(1);
    });

    it("should throw NotFoundException when expense not found", async () => {
      expenseRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, "nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("should update expense and log audit", async () => {
      const expense = buildMockExpense();
      expenseRepo.findOne.mockResolvedValue(expense);
      attachmentRepo.find.mockResolvedValue([]);
      const updatedExpense = { ...expense, amount: 200 };
      expenseRepo.save.mockResolvedValue(updatedExpense);

      const result = await service.update(userId, "expense-1", { amount: 200 });

      expect(result.amount).toBe(200);
      expect(auditService.log).toHaveBeenCalledWith({
        userId,
        entityType: "expense",
        entityId: "expense-1",
        action: AuditAction.UPDATE,
        beforeState: expect.objectContaining({ amount: 100 }),
        afterState: updatedExpense,
      });
    });
  });

  describe("delete", () => {
    it("should soft delete expense and log audit", async () => {
      expenseRepo.findOne.mockResolvedValue(buildMockExpense());
      attachmentRepo.find.mockResolvedValue([]);
      expenseRepo.softRemove.mockResolvedValue(undefined);

      await service.delete(userId, "expense-1");

      expect(expenseRepo.softRemove).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith({
        userId,
        entityType: "expense",
        entityId: "expense-1",
        action: AuditAction.DELETE,
        beforeState: expect.objectContaining({ amount: 100 }),
      });
    });

    it("should detach attachments on delete", async () => {
      const attachment = {
        id: "att-1",
        entityType: "expense",
        entityId: "expense-1",
      } as Attachment;
      expenseRepo.findOne.mockResolvedValue(buildMockExpense());
      attachmentRepo.find.mockResolvedValue([attachment]);

      await service.delete(userId, "expense-1");

      expect(attachment.entityType).toBe("receipt");
      expect(attachment.entityId).toBeNull();
      expect(attachmentRepo.save).toHaveBeenCalledWith(attachment);
    });
  });

  describe("restore", () => {
    it("should restore deleted expense and log audit", async () => {
      const expense = buildMockExpense();
      const deletedExpense = { ...expense, deletedAt: new Date() };
      expenseRepo.findOne
        .mockResolvedValueOnce(deletedExpense)
        .mockResolvedValueOnce(expense);
      expenseRepo.restore.mockResolvedValue(undefined);
      attachmentRepo.find.mockResolvedValue([]);

      const result = await service.restore(userId, "expense-1");

      expect(result).toBeDefined();
      expect(auditService.log).toHaveBeenCalledWith({
        userId,
        entityType: "expense",
        entityId: "expense-1",
        action: AuditAction.RESTORE,
        beforeState: { deletedAt: deletedExpense.deletedAt },
        afterState: { ...expense, attachments: [] },
      });
    });

    it("should return expense if not deleted", async () => {
      const expense = buildMockExpense();
      expenseRepo.findOne.mockResolvedValue(expense);

      const result = await service.restore(userId, "expense-1");

      expect(result).toEqual(expense);
      expect(expenseRepo.restore).not.toHaveBeenCalled();
    });
  });

  describe("getTotalByPeriod", () => {
    it("should return total expense amount for period", async () => {
      const qb = buildMockQueryBuilder({
        getRawOne: jest.fn().mockResolvedValue({ total: "500" }),
      });
      expenseRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTotalByPeriod(
        userId,
        new Date("2024-01-01"),
        new Date("2024-12-31"),
      );

      expect(result).toBe(500);
    });

    it("should return 0 when no expenses", async () => {
      const qb = buildMockQueryBuilder({
        getRawOne: jest.fn().mockResolvedValue({ total: null }),
      });
      expenseRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTotalByPeriod(
        userId,
        new Date("2024-01-01"),
        new Date("2024-12-31"),
      );

      expect(result).toBe(0);
    });
  });

  describe("getTotalByCategory", () => {
    it("should return totals grouped by category", async () => {
      const qb = buildMockQueryBuilder({
        getRawMany: jest.fn().mockResolvedValue([
          { categoryId: "cat-1", categoryName: "Rent", total: "1000" },
          { categoryId: "cat-2", categoryName: "Supplies", total: "500" },
        ]),
      });
      expenseRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTotalByCategory(
        userId,
        new Date("2024-01-01"),
        new Date("2024-12-31"),
      );

      expect(result).toHaveLength(2);
      expect(result[0].total).toBe(1000);
      expect(result[1].total).toBe(500);
    });

    it("should return empty array when no data", async () => {
      const qb = buildMockQueryBuilder({
        getRawMany: jest.fn().mockResolvedValue([]),
      });
      expenseRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTotalByCategory(
        userId,
        new Date("2024-01-01"),
        new Date("2024-12-31"),
      );

      expect(result).toEqual([]);
    });
  });

  describe("getMonthlyTotals", () => {
    it("should return monthly totals sorted ascending", async () => {
      const qb = buildMockQueryBuilder({
        getRawMany: jest.fn().mockResolvedValue([
          { month: "2024-01", total: "500" },
          { month: "2024-02", total: "750" },
        ]),
      });
      expenseRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getMonthlyTotals(
        userId,
        new Date("2024-01-01"),
        new Date("2024-12-31"),
      );

      expect(result[0].month).toBe("2024-01");
      expect(result[0].total).toBe(500);
    });
  });
});
