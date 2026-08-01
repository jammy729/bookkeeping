import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Income } from "../../entities/income.entity";
import { Expense } from "../../entities/expense.entity";
import { Invoice, InvoiceStatus } from "../../entities/invoice.entity";
import { Budget } from "../../entities/budget.entity";
import { Attachment } from "../../entities/attachment.entity";

export interface TaxReportDto {
  period: {
    startDate: string;
    endDate: string;
  };
  hstCollected: {
    totalSales: number;
    hstAmount: number;
    count: number;
  };
  hstPaid: {
    totalExpenses: number;
    hstAmount: number;
    count: number;
  };
  netHst: number;
  summary: string;
}

export interface ProfitLossDto {
  period: {
    startDate: string;
    endDate: string;
  };
  income: {
    total: number;
    byCategory: Record<string, number>;
  };
  expenses: {
    total: number;
    byCategory: Record<string, number>;
  };
  ownerDistributions: {
    total: number;
  };
  netProfit: number;
  margin: number;
}

export interface BalanceSheetDto {
  asOfDate: string;
  assets: {
    accountsReceivable: number;
    totalAssets: number;
  };
  liabilities: {
    accountsPayable: number;
    hstPayable: number;
    totalLiabilities: number;
  };
  equity: {
    retainedEarnings: number;
    totalEquity: number;
  };
}

export interface CashFlowDto {
  period: {
    startDate: string;
    endDate: string;
  };
  operatingActivities: {
    cashFromCustomers: number;
    cashToSuppliers: number;
    netCash: number;
  };
  financingActivities: {
    ownerDistributionsPaid: number;
    netCash: number;
  };
}

export interface MonthlySummaryDto {
  monthlyData: { month: string; income: number; expenses: number }[];
  totals: {
    totalIncome: number;
    totalExpenses: number;
    ownerDistributions: number;
    netIncome: number;
  };
  categoryBreakdown: { name: string; value: number }[];
  incomeByType: { name: string; value: number }[];
}

export interface ActionItemsDto {
  uncategorizedCount: number;
  budgetAlerts: number;
  pendingReceipts: number;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Income)
    private incomeRepository: Repository<Income>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
  ) {}

  async getMonthlySummary(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<MonthlySummaryDto> {
    const expenseMonthly = await this.expenseRepository
      .createQueryBuilder("expense")
      .select("TO_CHAR(expense.date, 'YYYY-MM')", "month")
      .addSelect("SUM(expense.amount)", "total")
      .where("expense.userId = :userId", { userId })
      .andWhere("expense.date BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("expense.deletedAt IS NULL")
      .groupBy("TO_CHAR(expense.date, 'YYYY-MM')")
      .orderBy("TO_CHAR(expense.date, 'YYYY-MM')", "ASC")
      .getRawMany();

    const incomeMonthly = await this.incomeRepository
      .createQueryBuilder("income")
      .select("TO_CHAR(income.date, 'YYYY-MM')", "month")
      .addSelect("SUM(income.amount)", "total")
      .where("income.userId = :userId", { userId })
      .andWhere("income.date BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("income.deletedAt IS NULL")
      .groupBy("TO_CHAR(income.date, 'YYYY-MM')")
      .orderBy("TO_CHAR(income.date, 'YYYY-MM')", "ASC")
      .getRawMany();

    const expenseByMonth = new Map(
      expenseMonthly.map((r) => [r.month, parseFloat(r.total) || 0]),
    );
    const incomeByMonth = new Map(
      incomeMonthly.map((r) => [r.month, parseFloat(r.total) || 0]),
    );

    const allMonths = new Set([
      ...expenseByMonth.keys(),
      ...incomeByMonth.keys(),
    ]);
    const monthlyData = Array.from(allMonths)
      .sort()
      .map((month) => ({
        month,
        income: incomeByMonth.get(month) || 0,
        expenses: expenseByMonth.get(month) || 0,
      }));

    // Totals
    const totalIncome = Array.from(incomeByMonth.values()).reduce(
      (a, b) => a + b,
      0,
    );
    const totalExpenses = Array.from(expenseByMonth.values()).reduce(
      (a, b) => a + b,
      0,
    );

    // Owner distributions
    const ownerDistResult = await this.expenseRepository
      .createQueryBuilder("expense")
      .select("SUM(expense.amount)", "total")
      .leftJoin("expense.category", "category")
      .where("expense.userId = :userId", { userId })
      .andWhere("expense.date BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("expense.deletedAt IS NULL")
      .andWhere("category.name = 'Owner Distribution'")
      .getRawOne();

    const ownerDistributions = parseFloat(ownerDistResult?.total) || 0;

    // Category breakdown
    const categoryResults = await this.expenseRepository
      .createQueryBuilder("expense")
      .select("COALESCE(cat.name, 'Uncategorized')", "name")
      .addSelect("SUM(expense.amount)", "value")
      .leftJoin("expense.category", "cat")
      .where("expense.userId = :userId", { userId })
      .andWhere("expense.date BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("expense.deletedAt IS NULL")
      .groupBy("cat.name")
      .getRawMany();

    const categoryBreakdown = categoryResults.map((r) => ({
      name: r.name,
      value: parseFloat(r.value) || 0,
    }));

    // Income by type
    const typeResults = await this.incomeRepository
      .createQueryBuilder("income")
      .select("income.type", "name")
      .addSelect("SUM(income.amount)", "value")
      .where("income.userId = :userId", { userId })
      .andWhere("income.date BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("income.deletedAt IS NULL")
      .groupBy("income.type")
      .getRawMany();

    const incomeByType = typeResults.map((r) => ({
      name: r.name,
      value: parseFloat(r.value) || 0,
    }));

    return {
      monthlyData,
      totals: {
        totalIncome,
        totalExpenses,
        ownerDistributions,
        netIncome: totalIncome - totalExpenses,
      },
      categoryBreakdown,
      incomeByType,
    };
  }

  async getActionItems(userId: string): Promise<ActionItemsDto> {
    const uncategorizedResult = await this.expenseRepository
      .createQueryBuilder("expense")
      .select("COUNT(expense.id)", "count")
      .where("expense.userId = :userId", { userId })
      .andWhere("expense.deletedAt IS NULL")
      .andWhere("expense.categoryId IS NULL")
      .getRawOne();

    const uncategorizedCount = parseInt(uncategorizedResult?.count) || 0;

    const budgets = await this.budgetRepository
      .createQueryBuilder("budget")
      .where("budget.userId = :userId", { userId })
      .getMany();

    const budgetAlerts = budgets.filter((b) => {
      const spent = parseFloat(String(b.spent || 0));
      const amount = parseFloat(String(b.amount || 1));
      return amount > 0 && spent / amount >= 0.8;
    }).length;

    const pendingResult = await this.attachmentRepository
      .createQueryBuilder("attachment")
      .select("COUNT(attachment.id)", "count")
      .where("attachment.entityId IS NULL")
      .andWhere("attachment.userId = :userId", { userId })
      .getRawOne();

    const pendingReceipts = parseInt(pendingResult?.count) || 0;

    return { uncategorizedCount, budgetAlerts, pendingReceipts };
  }

  async getTaxReport(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<TaxReportDto> {
    // HST Collected (from income with HST)
    const hstIncomes = await this.incomeRepository.find({
      where: {
        userId,
        date: Between(startDate, endDate) as any,
        includesHst: true,
      },
    });

    const hstCollected = hstIncomes.reduce(
      (sum, income) => sum + (income.hstAmount || 0),
      0,
    );

    // Note: Expense entity doesn't have HST fields currently
    const hstPaid = 0;
    const totalExpenses = 0;

    const totalSales = hstIncomes.reduce(
      (sum, income) => sum + income.amount,
      0,
    );
    const netHst = hstCollected - hstPaid;

    return {
      period: { startDate, endDate },
      hstCollected: {
        totalSales,
        hstAmount: hstCollected,
        count: hstIncomes.length,
      },
      hstPaid: {
        totalExpenses,
        hstAmount: hstPaid,
        count: 0,
      },
      netHst,
      summary:
        netHst >= 0
          ? `Remit $${netHst.toFixed(2)} to CRA`
          : `Claim $${Math.abs(netHst).toFixed(2)} refund from CRA`,
    };
  }

  async getProfitAndLoss(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<ProfitLossDto> {
    // Get all income
    const incomes = await this.incomeRepository.find({
      where: {
        userId,
        date: Between(startDate, endDate) as any,
      },
    });

    // Get all expenses (excluding Owner Distribution)
    const allExpenses = await this.expenseRepository.find({
      where: {
        userId,
        date: Between(startDate, endDate) as any,
      },
      relations: ["category"],
    });

    // Separate owner distributions from regular expenses
    const ownerDistributionExpenses = allExpenses.filter(
      (e) => e.category?.name === "Owner Distribution",
    );
    const regularExpenses = allExpenses.filter(
      (e) => e.category?.name !== "Owner Distribution",
    );

    // Calculate totals
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpenses = regularExpenses.reduce(
      (sum, exp) => sum + +exp.amount,
      0,
    );
    const ownerDistributions = ownerDistributionExpenses.reduce(
      (sum, exp) => sum + +exp.amount,
      0,
    );
    const netProfit = totalIncome - totalExpenses;
    const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Group by category/type
    const incomeByCategory: Record<string, number> = {};
    incomes.forEach((inc) => {
      const key = inc.type || "Other";
      incomeByCategory[key] = (incomeByCategory[key] || 0) + inc.amount;
    });

    const expensesByCategory: Record<string, number> = {};
    regularExpenses.forEach((exp) => {
      const key = exp.category?.name || "Uncategorized";
      expensesByCategory[key] = (expensesByCategory[key] || 0) + +exp.amount;
    });

    return {
      period: { startDate, endDate },
      income: {
        total: totalIncome,
        byCategory: incomeByCategory,
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
      },
      ownerDistributions: {
        total: ownerDistributions,
      },
      netProfit,
      margin,
    };
  }

  async getBalanceSheet(
    userId: string,
    asOfDate: string,
  ): Promise<BalanceSheetDto> {
    // Accounts Receivable (unpaid invoices - status SENT)
    const unpaidInvoices = await this.invoiceRepository.find({
      where: {
        userId,
        status: InvoiceStatus.SENT,
      },
    });

    const accountsReceivable = unpaidInvoices.reduce(
      (sum, inv) => sum + inv.total,
      0,
    );

    // HST Payable
    const allHstIncomes = await this.incomeRepository.find({
      where: { userId, includesHst: true },
    });

    const hstCollected = allHstIncomes.reduce(
      (sum, inc) => sum + (inc.hstAmount || 0),
      0,
    );

    const hstPayable = hstCollected;

    // Retained Earnings (all income - all expenses including owner distributions)
    const allIncomes = await this.incomeRepository.find({ where: { userId } });
    const allExpenses = await this.expenseRepository.find({
      where: { userId },
    });

    const totalIncome = allIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpenses = allExpenses.reduce(
      (sum, exp) => sum + +exp.amount,
      0,
    );
    const retainedEarnings = totalIncome - totalExpenses;

    const accountsPayable = 0;
    const totalLiabilities = accountsPayable + hstPayable;
    const totalAssets = accountsReceivable;
    const totalEquity = retainedEarnings;

    return {
      asOfDate,
      assets: {
        accountsReceivable,
        totalAssets,
      },
      liabilities: {
        accountsPayable,
        hstPayable,
        totalLiabilities,
      },
      equity: {
        retainedEarnings,
        totalEquity,
      },
    };
  }

  async getCashFlow(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<CashFlowDto> {
    // Cash from customers (paid income)
    const paidIncomes = await this.incomeRepository.find({
      where: {
        userId,
        date: Between(startDate, endDate) as any,
        isPaid: true,
      },
    });

    const cashFromCustomers = paidIncomes.reduce(
      (sum, inc) => sum + inc.amount,
      0,
    );

    // Get all expenses and separate owner distributions
    const allExpenses = await this.expenseRepository.find({
      where: {
        userId,
        date: Between(startDate, endDate) as any,
      },
      relations: ["category"],
    });

    const ownerDistributionExpenses = allExpenses.filter(
      (e) => e.category?.name === "Owner Distribution",
    );
    const regularExpenses = allExpenses.filter(
      (e) => e.category?.name !== "Owner Distribution",
    );

    const cashToSuppliers = regularExpenses.reduce(
      (sum, exp) => sum + +exp.amount,
      0,
    );

    const operatingNetCash = cashFromCustomers - cashToSuppliers;

    // Financing Activities: Owner distributions paid
    const ownerDistributionsPaid = ownerDistributionExpenses.reduce(
      (sum, exp) => sum + +exp.amount,
      0,
    );
    const financingNetCash = -ownerDistributionsPaid;

    return {
      period: { startDate, endDate },
      operatingActivities: {
        cashFromCustomers,
        cashToSuppliers,
        netCash: operatingNetCash,
      },
      financingActivities: {
        ownerDistributionsPaid,
        netCash: financingNetCash,
      },
    };
  }
}
