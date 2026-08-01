import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThanOrEqual } from "typeorm";
import { Expense, RecurrenceFrequency } from "../../entities/expense.entity";
import { Attachment } from "../../entities/attachment.entity";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.entity";

export interface CreateExpenseDto {
  amount: number;
  description: string;
  date: Date;
  categoryId?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrenceFrequency?: RecurrenceFrequency;
  nextOccurrence?: Date;
}

export interface UpdateExpenseDto {
  amount?: number;
  description?: string;
  date?: Date;
  categoryId?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrenceFrequency?: RecurrenceFrequency;
  nextOccurrence?: Date;
}

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
    private auditService: AuditService,
  ) {}

  async create(
    userId: string,
    createExpenseDto: CreateExpenseDto,
  ): Promise<Expense> {
    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      userId,
    });
    const saved = await this.expenseRepository.save(expense);
    await this.auditService.log({
      userId,
      entityType: "expense",
      entityId: saved.id,
      action: AuditAction.CREATE,
      afterState: saved,
    });
    return saved;
  }

  async findAll(
    userId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      categoryId?: string;
      page?: number;
      limit?: number;
      search?: string;
    },
  ): Promise<any> {
    const page = filters?.page;
    const limit = filters?.limit;

    const query = this.expenseRepository
      .createQueryBuilder("expense")
      .leftJoinAndSelect("expense.category", "category")
      .where("expense.userId = :userId", { userId })
      .andWhere("expense.deletedAt IS NULL");

    if (filters?.startDate && filters?.endDate) {
      query.andWhere("expense.date BETWEEN :startDate AND :endDate", {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters?.categoryId) {
      query.andWhere("expense.categoryId = :categoryId", {
        categoryId: filters.categoryId,
      });
    }

    if (filters?.search) {
      query.andWhere(
        "(expense.description ILIKE :search OR expense.notes ILIKE :search)",
        { search: `%${filters.search}%` },
      );
    }

    if (page && limit) {
      const skip = (page - 1) * limit;
      const [expenses, total] = await query
        .orderBy("expense.date", "DESC")
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      const expenseIds = expenses.map((e) => e.id);
      const attachments =
        expenseIds.length > 0
          ? await this.attachmentRepository.find({
              where: expenseIds.map((id) => ({
                entityType: "expense",
                entityId: id,
                userId,
              })),
            })
          : [];

      const attachmentsByExpense = new Map<string, Attachment[]>();
      for (const att of attachments) {
        if (!att.entityId) continue;
        const list = attachmentsByExpense.get(att.entityId) || [];
        list.push(att);
        attachmentsByExpense.set(att.entityId, list);
      }

      return {
        data: expenses.map((expense) => ({
          ...expense,
          attachments: attachmentsByExpense.get(expense.id) || [],
        })),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    }

    const expenses = await query.orderBy("expense.date", "DESC").getMany();

    const expenseIds = expenses.map((e) => e.id);
    const attachments =
      expenseIds.length > 0
        ? await this.attachmentRepository.find({
            where: expenseIds.map((id) => ({
              entityType: "expense",
              entityId: id,
              userId,
            })),
          })
        : [];

    const attachmentsByExpense = new Map<string, Attachment[]>();
    for (const att of attachments) {
      if (!att.entityId) continue;
      const list = attachmentsByExpense.get(att.entityId) || [];
      list.push(att);
      attachmentsByExpense.set(att.entityId, list);
    }

    return expenses.map((expense) => ({
      ...expense,
      attachments: attachmentsByExpense.get(expense.id) || [],
    }));
  }

  async findOne(userId: string, id: string): Promise<any> {
    const expense = await this.expenseRepository.findOne({
      where: { id, userId },
      relations: ["category"],
    });

    if (!expense) {
      throw new NotFoundException("Expense not found");
    }

    const attachments = await this.attachmentRepository.find({
      where: { entityType: "expense", entityId: id },
    });

    return { ...expense, attachments };
  }

  async update(
    userId: string,
    id: string,
    updateExpenseDto: UpdateExpenseDto,
  ): Promise<Expense> {
    const expense = await this.findOne(userId, id);
    const beforeState = { ...expense };
    delete beforeState.attachments;

    Object.assign(expense, updateExpenseDto);
    const saved = await this.expenseRepository.save(expense);
    await this.auditService.log({
      userId,
      entityType: "expense",
      entityId: saved.id,
      action: AuditAction.UPDATE,
      beforeState,
      afterState: saved,
    });
    return saved;
  }

  async delete(userId: string, id: string): Promise<void> {
    const expense = await this.findOne(userId, id);
    const beforeState = { ...expense };
    delete beforeState.attachments;

    const attachments = await this.attachmentRepository.find({
      where: { entityType: "expense", entityId: id },
    });
    for (const att of attachments) {
      att.entityType = "receipt";
      att.entityId = null;
      await this.attachmentRepository.save(att);
    }

    await this.expenseRepository.softRemove(expense);
    await this.auditService.log({
      userId,
      entityType: "expense",
      entityId: id,
      action: AuditAction.DELETE,
      beforeState,
    });
  }

  async restore(userId: string, id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id, userId },
      withDeleted: true,
    });
    if (!expense) {
      throw new NotFoundException("Expense not found");
    }
    if (!expense.deletedAt) {
      return expense;
    }
    await this.expenseRepository.restore({ id, userId });
    const restored = await this.findOne(userId, id);
    await this.auditService.log({
      userId,
      entityType: "expense",
      entityId: id,
      action: AuditAction.RESTORE,
      beforeState: { deletedAt: expense.deletedAt },
      afterState: restored,
    });
    return restored;
  }

  async getTotalByPeriod(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.expenseRepository
      .createQueryBuilder("expense")
      .select("SUM(expense.amount)", "total")
      .where("expense.userId = :userId", { userId })
      .andWhere("expense.date BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("expense.deletedAt IS NULL")
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  async getTotalByCategory(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ categoryId: string; categoryName: string; total: number }[]> {
    const results = await this.expenseRepository
      .createQueryBuilder("expense")
      .select("expense.categoryId", "categoryId")
      .addSelect("cat.name", "categoryName")
      .addSelect("SUM(expense.amount)", "total")
      .innerJoin("categories", "cat", "cat.id = expense.categoryId")
      .where("expense.userId = :userId", { userId })
      .andWhere("expense.date BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("expense.deletedAt IS NULL")
      .groupBy("expense.categoryId")
      .addGroupBy("cat.name")
      .getRawMany();

    return results.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      total: parseFloat(r.total) || 0,
    }));
  }

  async getMonthlyTotals(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ month: string; total: number }[]> {
    const results = await this.expenseRepository
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

    return results.map((r) => ({
      month: r.month,
      total: parseFloat(r.total) || 0,
    }));
  }

  async generateRecurring(
    userId: string,
  ): Promise<{ created: number; expenses: Expense[] }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all recurring expenses where nextOccurrence is today or in the past
    const dueRecurring = await this.expenseRepository.find({
      where: {
        userId,
        isRecurring: true,
        nextOccurrence: LessThanOrEqual(today),
      },
      relations: ["category"],
    });

    const created: Expense[] = [];

    for (const source of dueRecurring) {
      if (!source.recurrenceFrequency || !source.nextOccurrence) continue;

      // Create new expense from the recurring template
      const newExpense = this.expenseRepository.create({
        amount: source.amount,
        description: source.description,
        date: source.nextOccurrence,
        categoryId: source.categoryId,
        notes: source.notes,
        userId,
        isRecurring: false, // New instance is not itself recurring
      });

      const saved = await this.expenseRepository.save(newExpense);
      created.push(saved);

      await this.auditService.log({
        userId,
        entityType: "expense",
        entityId: saved.id,
        action: AuditAction.CREATE,
        afterState: saved,
      });

      // Advance nextOccurrence on the source
      source.nextOccurrence = this.computeNextOccurrence(
        source.nextOccurrence,
        source.recurrenceFrequency,
      );
      await this.expenseRepository.save(source);
    }

    return { created: created.length, expenses: created };
  }

  private computeNextOccurrence(
    current: Date,
    frequency: RecurrenceFrequency,
  ): Date {
    const next = new Date(current);
    switch (frequency) {
      case RecurrenceFrequency.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case RecurrenceFrequency.BIWEEKLY:
        next.setDate(next.getDate() + 14);
        break;
      case RecurrenceFrequency.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case RecurrenceFrequency.QUARTERLY:
        next.setMonth(next.getMonth() + 3);
        break;
      case RecurrenceFrequency.YEARLY:
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }

  async bulkImport(
    userId: string,
    rows: CreateExpenseDto[],
  ): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      try {
        const dto = rows[i];
        await this.create(userId, {
          amount: dto.amount,
          description: dto.description,
          date: dto.date,
          categoryId: dto.categoryId,
          notes: dto.notes,
        });
        imported++;
      } catch (err) {
        errors.push(`Row ${i + 1}: ${(err as Error).message}`);
      }
    }

    return { imported, errors };
  }
}
