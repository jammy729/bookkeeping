import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Income } from "../../entities/income.entity";
import { Expense } from "../../entities/expense.entity";
import { Invoice, InvoiceStatus } from "../../entities/invoice.entity";

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

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Income)
    private incomeRepository: Repository<Income>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {}

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
