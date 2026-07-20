import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Expense } from '../../entities/expense.entity';

export interface CreateExpenseDto {
  amount: number;
  description: string;
  date: Date;
  categoryId?: string;
  notes?: string;
  isRecurring?: boolean;
}

export interface UpdateExpenseDto {
  amount?: number;
  description?: string;
  date?: Date;
  categoryId?: string;
  notes?: string;
  isRecurring?: boolean;
}

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  async create(userId: string, createExpenseDto: CreateExpenseDto): Promise<Expense> {
    const expense = this.expenseRepository.create({
      ...createExpenseDto,
      userId,
    });
    return this.expenseRepository.save(expense);
  }

  async findAll(userId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
  }): Promise<Expense[]> {
    const where: any = { userId };

    if (filters?.startDate && filters?.endDate) {
      where.date = Between(filters.startDate, filters.endDate);
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    return this.expenseRepository.find({
      where,
      relations: ['category'],
      order: { date: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id, userId },
      relations: ['category'],
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async update(userId: string, id: string, updateExpenseDto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.findOne(userId, id);
    
    Object.assign(expense, updateExpenseDto);
    return this.expenseRepository.save(expense);
  }

  async delete(userId: string, id: string): Promise<void> {
    const expense = await this.findOne(userId, id);
    await this.expenseRepository.remove(expense);
  }

  async getTotalByPeriod(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'total')
      .where('expense.userId = :userId', { userId })
      .andWhere('expense.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  async getTotalByCategory(userId: string, startDate: Date, endDate: Date): Promise<{ categoryId: string; categoryName: string; total: number }[]> {
    const results = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('expense.categoryId', 'categoryId')
      .addSelect('cat.name', 'categoryName')
      .addSelect('SUM(expense.amount)', 'total')
      .innerJoin('categories', 'cat', 'cat.id = expense.categoryId')
      .where('expense.userId = :userId', { userId })
      .andWhere('expense.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('expense.categoryId')
      .addGroupBy('cat.name')
      .getRawMany();

    return results.map(r => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      total: parseFloat(r.total) || 0,
    }));
  }
}
