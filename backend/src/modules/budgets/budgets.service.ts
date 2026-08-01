import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Budget } from "../../entities/budget.entity";
import { Expense } from "../../entities/expense.entity";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.entity";

export interface CreateBudgetDto {
  amount: number;
  startDate: string;
  endDate: string;
  name?: string;
  period?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  categoryId?: string;
}

export interface UpdateBudgetDto {
  amount?: number;
  startDate?: string;
  endDate?: string;
  name?: string;
  period?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  categoryId?: string;
}

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    private auditService: AuditService,
  ) {}

  async create(
    userId: string,
    createBudgetDto: CreateBudgetDto,
  ): Promise<Budget> {
    const budget = this.budgetRepository.create({
      ...createBudgetDto,
      userId,
      startDate: new Date(createBudgetDto.startDate),
      endDate: new Date(createBudgetDto.endDate),
    });

    // Calculate initial spent amount
    budget.spent = await this.calculateSpent(
      budget.userId,
      budget.categoryId,
      budget.startDate,
      budget.endDate,
    );

    const saved = await this.budgetRepository.save(budget);
    await this.auditService.log({
      userId: saved.userId,
      entityType: "budget",
      entityId: saved.id,
      action: AuditAction.CREATE,
      afterState: saved,
    });
    return saved;
  }

  async findAll(userId: string): Promise<Budget[]> {
    return this.budgetRepository.find({
      where: { userId },
      relations: ["category"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string, userId: string): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({
      where: { id, userId },
      relations: ["category"],
    });

    if (!budget) {
      throw new NotFoundException("Budget not found");
    }

    // Update spent amount
    budget.spent = await this.calculateSpent(
      budget.userId,
      budget.categoryId,
      budget.startDate,
      budget.endDate,
    );

    return budget;
  }

  async update(
    id: string,
    userId: string,
    updateBudgetDto: UpdateBudgetDto,
  ): Promise<Budget> {
    const budget = await this.findOne(id, userId);

    if (updateBudgetDto.amount !== undefined)
      budget.amount = updateBudgetDto.amount;
    if (updateBudgetDto.startDate)
      budget.startDate = new Date(updateBudgetDto.startDate);
    if (updateBudgetDto.endDate)
      budget.endDate = new Date(updateBudgetDto.endDate);
    if (updateBudgetDto.name !== undefined) budget.name = updateBudgetDto.name;
    if (updateBudgetDto.period !== undefined)
      budget.period = updateBudgetDto.period;
    if (updateBudgetDto.categoryId !== undefined)
      budget.categoryId = updateBudgetDto.categoryId;

    budget.spent = await this.calculateSpent(
      budget.userId,
      budget.categoryId,
      budget.startDate,
      budget.endDate,
    );

    const saved = await this.budgetRepository.save(budget);
    await this.auditService.log({
      userId: saved.userId,
      entityType: "budget",
      entityId: saved.id,
      action: AuditAction.UPDATE,
      beforeState: budget,
      afterState: saved,
    });
    return saved;
  }

  async remove(id: string, userId: string): Promise<void> {
    const budget = await this.findOne(id, userId);
    const beforeState = { ...budget };
    await this.budgetRepository.softRemove(budget);
    await this.auditService.log({
      userId,
      entityType: "budget",
      entityId: id,
      action: AuditAction.DELETE,
      beforeState,
    });
  }

  async restore(id: string, userId: string): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({
      where: { id, userId },
      withDeleted: true,
      relations: ["category"],
    });
    if (!budget) {
      throw new NotFoundException("Budget not found");
    }
    if (!budget.deletedAt) {
      return budget;
    }
    await this.budgetRepository.restore({ id, userId });
    const restored = await this.findOne(id, userId);
    await this.auditService.log({
      userId,
      entityType: "budget",
      entityId: id,
      action: AuditAction.RESTORE,
      beforeState: { deletedAt: budget.deletedAt },
      afterState: restored,
    });
    return restored;
  }

  private async calculateSpent(
    userId: string,
    categoryId: string | null,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const where: any = {
      userId,
      date: Between(startDate, endDate),
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const expenses = await this.expenseRepository.find({ where });
    return expenses.reduce((sum, expense) => sum + +expense.amount, 0);
  }

  async getBudgetSummary(userId: string): Promise<{
    totalBudgets: number;
    totalAmount: number;
    totalSpent: number;
    remaining: number;
    percentageUsed: number;
  }> {
    const budgets = await this.findAll(userId);

    let totalAmount = 0;
    let totalSpent = 0;

    for (const budget of budgets) {
      totalAmount += budget.amount;
      const spent = await this.calculateSpent(
        budget.userId,
        budget.categoryId,
        budget.startDate,
        budget.endDate,
      );
      totalSpent += spent;
    }

    const remaining = totalAmount - totalSpent;
    const percentageUsed =
      totalAmount > 0 ? (totalSpent / totalAmount) * 100 : 0;

    return {
      totalBudgets: budgets.length,
      totalAmount,
      totalSpent,
      remaining,
      percentageUsed,
    };
  }
}
