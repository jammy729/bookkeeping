import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ReportsService } from "./reports.service";
import { Income, IncomeType } from "../../entities/income.entity";
import { Expense } from "../../entities/expense.entity";
import { Invoice, InvoiceStatus } from "../../entities/invoice.entity";
import { Category } from "../../entities/category.entity";
import { Budget } from "../../entities/budget.entity";
import { Attachment } from "../../entities/attachment.entity";

describe("ReportsService", () => {
  let service: ReportsService;
  let incomeRepo: jest.Mocked<Repository<Income>>;
  let expenseRepo: jest.Mocked<Repository<Expense>>;
  let invoiceRepo: jest.Mocked<Repository<Invoice>>;
  // Repositories injected via module but not directly asserted in tests

  const userId = "user-1";
  const ownerDistCategory = {
    id: "cat-od",
    name: "Owner Distribution",
    type: "expense",
  } as Category;
  const rentCategory = {
    id: "cat-rent",
    name: "Rent",
    type: "expense",
  } as Category;
  const startDate = "2024-01-01";
  const endDate = "2024-12-31";

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Income),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Expense),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Budget),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Attachment),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    incomeRepo = module.get(getRepositoryToken(Income));
    expenseRepo = module.get(getRepositoryToken(Expense));
    invoiceRepo = module.get(getRepositoryToken(Invoice));
  });

  describe("getProfitAndLoss", () => {
    it("should calculate profit and loss correctly", async () => {
      incomeRepo.find.mockResolvedValue([
        { amount: 10000, type: IncomeType.CONSULTING } as Income,
        { amount: 5000, type: IncomeType.FREELANCE } as Income,
      ]);
      expenseRepo.find.mockResolvedValue([
        { amount: 2000, category: rentCategory } as Expense,
        { amount: 3000, category: rentCategory } as Expense,
        { amount: 1000, category: ownerDistCategory } as Expense,
      ]);

      const result = await service.getProfitAndLoss(userId, startDate, endDate);

      expect(result.income.total).toBe(15000);
      expect(result.income.byCategory[IncomeType.CONSULTING]).toBe(10000);
      expect(result.income.byCategory[IncomeType.FREELANCE]).toBe(5000);
      expect(result.expenses.total).toBe(5000);
      expect(result.expenses.byCategory.Rent).toBe(5000);
      expect(result.ownerDistributions.total).toBe(1000);
      expect(result.netProfit).toBe(10000);
      expect(result.margin).toBeCloseTo(66.67, 1);
    });

    it("should handle zero income", async () => {
      incomeRepo.find.mockResolvedValue([]);
      expenseRepo.find.mockResolvedValue([]);

      const result = await service.getProfitAndLoss(userId, startDate, endDate);

      expect(result.income.total).toBe(0);
      expect(result.expenses.total).toBe(0);
      expect(result.netProfit).toBe(0);
      expect(result.margin).toBe(0);
    });

    it("should handle negative profit", async () => {
      incomeRepo.find.mockResolvedValue([
        { amount: 1000, type: IncomeType.CONSULTING } as Income,
      ]);
      expenseRepo.find.mockResolvedValue([
        { amount: 3000, category: rentCategory } as Expense,
      ]);

      const result = await service.getProfitAndLoss(userId, startDate, endDate);

      expect(result.netProfit).toBe(-2000);
      expect(result.margin).toBeCloseTo(-200, 1);
    });

    it("should separate owner distributions from expenses", async () => {
      incomeRepo.find.mockResolvedValue([
        { amount: 5000, type: IncomeType.CONSULTING } as Income,
      ]);
      expenseRepo.find.mockResolvedValue([
        { amount: 1000, category: rentCategory } as Expense,
        { amount: 2000, category: ownerDistCategory } as Expense,
      ]);

      const result = await service.getProfitAndLoss(userId, startDate, endDate);

      expect(result.expenses.total).toBe(1000);
      expect(result.ownerDistributions.total).toBe(2000);
      expect(result.netProfit).toBe(4000);
    });

    it("should handle uncategorized expenses", async () => {
      incomeRepo.find.mockResolvedValue([
        { amount: 1000, type: IncomeType.OTHER } as Income,
      ]);
      expenseRepo.find.mockResolvedValue([
        { amount: 500, category: null } as unknown as Expense,
      ]);

      const result = await service.getProfitAndLoss(userId, startDate, endDate);

      expect(result.expenses.byCategory.Uncategorized).toBe(500);
    });

    it("should round amounts correctly", async () => {
      incomeRepo.find.mockResolvedValue([
        { amount: 100.33, type: IncomeType.CONSULTING } as Income,
        { amount: 200.67, type: IncomeType.CONSULTING } as Income,
      ]);
      expenseRepo.find.mockResolvedValue([
        { amount: 50.25, category: rentCategory } as Expense,
      ]);

      const result = await service.getProfitAndLoss(userId, startDate, endDate);

      expect(result.income.total).toBeCloseTo(301.0, 2);
      expect(result.netProfit).toBeCloseTo(250.75, 2);
    });
  });

  describe("getBalanceSheet", () => {
    it("should calculate balance sheet correctly", async () => {
      invoiceRepo.find.mockResolvedValue([
        { total: 5000, status: InvoiceStatus.SENT } as Invoice,
        { total: 3000, status: InvoiceStatus.SENT } as Invoice,
      ]);
      incomeRepo.find.mockResolvedValue([
        { amount: 50000, includesHst: true, hstAmount: 5752.21 } as Income,
        { amount: 20000, includesHst: false } as Income,
      ]);
      expenseRepo.find.mockResolvedValue([
        { amount: 15000 } as Expense,
        { amount: 10000 } as Expense,
      ]);

      const result = await service.getBalanceSheet(userId, "2024-12-31");

      expect(result.assets.accountsReceivable).toBe(8000);
      expect(result.assets.totalAssets).toBe(8000);
      expect(result.liabilities.hstPayable).toBeCloseTo(5752.21, 2);
      expect(result.liabilities.totalLiabilities).toBeCloseTo(5752.21, 2);
      expect(result.equity.retainedEarnings).toBe(45000);
      expect(result.equity.totalEquity).toBe(45000);
    });

    it("should handle zero balances", async () => {
      invoiceRepo.find.mockResolvedValue([]);
      incomeRepo.find.mockResolvedValue([]);
      expenseRepo.find.mockResolvedValue([]);

      const result = await service.getBalanceSheet(userId, "2024-12-31");

      expect(result.assets.totalAssets).toBe(0);
      expect(result.liabilities.totalLiabilities).toBe(0);
      expect(result.equity.totalEquity).toBe(0);
    });

    it("should handle negative retained earnings", async () => {
      invoiceRepo.find.mockResolvedValue([]);
      incomeRepo.find.mockResolvedValue([{ amount: 5000 } as Income]);
      expenseRepo.find.mockResolvedValue([{ amount: 15000 } as Expense]);

      const result = await service.getBalanceSheet(userId, "2024-12-31");

      expect(result.equity.retainedEarnings).toBe(-10000);
    });

    it("should query only SENT invoices for accounts receivable", async () => {
      invoiceRepo.find.mockResolvedValue([]);
      incomeRepo.find.mockResolvedValue([]);
      expenseRepo.find.mockResolvedValue([]);

      await service.getBalanceSheet(userId, "2024-12-31");

      expect(invoiceRepo.find).toHaveBeenCalledWith({
        where: { userId, status: InvoiceStatus.SENT },
      });
    });
  });

  describe("getCashFlow", () => {
    it("should calculate cash flow correctly", async () => {
      incomeRepo.find.mockResolvedValue([
        { amount: 10000, isPaid: true } as Income,
        { amount: 5000, isPaid: true } as Income,
      ]);
      expenseRepo.find.mockResolvedValue([
        { amount: 2000, category: rentCategory } as Expense,
        { amount: 1000, category: ownerDistCategory } as Expense,
      ]);

      const result = await service.getCashFlow(userId, startDate, endDate);

      expect(result.operatingActivities.cashFromCustomers).toBe(15000);
      expect(result.operatingActivities.cashToSuppliers).toBe(2000);
      expect(result.operatingActivities.netCash).toBe(13000);
      expect(result.financingActivities.ownerDistributionsPaid).toBe(1000);
      expect(result.financingActivities.netCash).toBe(-1000);
    });

    it("should handle zero cash flow", async () => {
      incomeRepo.find.mockResolvedValue([]);
      expenseRepo.find.mockResolvedValue([]);

      const result = await service.getCashFlow(userId, startDate, endDate);

      expect(result.operatingActivities.netCash).toBe(0);
      expect(Math.abs(result.financingActivities.netCash)).toBe(0);
    });

    it("should separate owner distributions from supplier payments", async () => {
      incomeRepo.find.mockResolvedValue([
        { amount: 10000, isPaid: true } as Income,
      ]);
      expenseRepo.find.mockResolvedValue([
        { amount: 3000, category: rentCategory } as Expense,
        { amount: 2000, category: ownerDistCategory } as Expense,
        {
          amount: 1000,
          category: { name: "Office Supplies" } as Category,
        } as Expense,
      ]);

      const result = await service.getCashFlow(userId, startDate, endDate);

      expect(result.operatingActivities.cashToSuppliers).toBe(4000);
      expect(result.financingActivities.ownerDistributionsPaid).toBe(2000);
    });
  });

  describe("getTaxReport", () => {
    it("should calculate HST collected correctly", async () => {
      incomeRepo.find.mockResolvedValue([
        {
          amount: 11300,
          includesHst: true,
          hstAmount: 1300,
          type: IncomeType.CONSULTING,
        } as Income,
        {
          amount: 5650,
          includesHst: true,
          hstAmount: 650,
          type: IncomeType.FREELANCE,
        } as Income,
      ]);

      const result = await service.getTaxReport(userId, startDate, endDate);

      expect(result.hstCollected.totalSales).toBe(16950);
      expect(result.hstCollected.hstAmount).toBe(1950);
      expect(result.hstCollected.count).toBe(2);
      expect(result.netHst).toBe(1950);
      expect(result.summary).toContain("Remit");
    });

    it("should handle no HST transactions", async () => {
      incomeRepo.find.mockResolvedValue([]);

      const result = await service.getTaxReport(userId, startDate, endDate);

      expect(result.hstCollected.hstAmount).toBe(0);
      expect(result.hstCollected.count).toBe(0);
      expect(result.netHst).toBe(0);
    });
  });
});
