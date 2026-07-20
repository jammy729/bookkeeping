import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Income, IncomeType } from '../../entities/income.entity';

export interface CreateIncomeDto {
  amount: number;
  description: string;
  type: IncomeType;
  date: Date;
  clientName?: string;
  invoiceNumber?: string;
  isPaid?: boolean;
  paidDate?: Date;
  notes?: string;
  hstAmount?: number;
  includesHst?: boolean;
  payPeriodWeeks?: number;
  payPeriodCount?: number;
}

export interface UpdateIncomeDto {
  amount?: number;
  description?: string;
  type?: IncomeType;
  date?: Date;
  clientName?: string;
  invoiceNumber?: string;
  isPaid?: boolean;
  paidDate?: Date;
  notes?: string;
  hstAmount?: number;
  includesHst?: boolean;
  payPeriodWeeks?: number;
  payPeriodCount?: number;
}

@Injectable()
export class IncomeService {
  constructor(
    @InjectRepository(Income)
    private incomeRepository: Repository<Income>,
  ) {}

  async create(userId: string, createIncomeDto: CreateIncomeDto): Promise<Income> {
    const income = this.incomeRepository.create({
      ...createIncomeDto,
      userId,
    });
    return this.incomeRepository.save(income);
  }

  async findAll(userId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    type?: IncomeType;
    isPaid?: boolean;
  }): Promise<Income[]> {
    const where: any = { userId };

    if (filters?.startDate && filters?.endDate) {
      where.date = Between(filters.startDate, filters.endDate);
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.isPaid !== undefined) {
      where.isPaid = filters.isPaid;
    }

    return this.incomeRepository.find({
      where,
      order: { date: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Income> {
    const income = await this.incomeRepository.findOne({
      where: { id, userId },
    });

    if (!income) {
      throw new NotFoundException('Income not found');
    }

    return income;
  }

  async update(userId: string, id: string, updateIncomeDto: UpdateIncomeDto): Promise<Income> {
    const income = await this.findOne(userId, id);
    
    Object.assign(income, updateIncomeDto);
    return this.incomeRepository.save(income);
  }

  async delete(userId: string, id: string): Promise<void> {
    const income = await this.findOne(userId, id);
    await this.incomeRepository.remove(income);
  }

  async getTotalByPeriod(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.incomeRepository
      .createQueryBuilder('income')
      .select('SUM(income.amount)', 'total')
      .where('income.userId = :userId', { userId })
      .andWhere('income.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  async getTotalByType(userId: string, startDate: Date, endDate: Date): Promise<{ type: string; total: number }[]> {
    const results = await this.incomeRepository
      .createQueryBuilder('income')
      .select('income.type', 'type')
      .addSelect('SUM(income.amount)', 'total')
      .where('income.userId = :userId', { userId })
      .andWhere('income.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('income.type')
      .getRawMany();

    return results.map(r => ({
      type: r.type,
      total: parseFloat(r.total) || 0,
    }));
  }

  async getTotalByClient(userId: string, startDate: Date, endDate: Date): Promise<{ clientName: string; total: number; count: number }[]> {
    const results = await this.incomeRepository
      .createQueryBuilder('income')
      .select('income.clientName', 'clientName')
      .addSelect('SUM(income.amount)', 'total')
      .addSelect('COUNT(income.id)', 'count')
      .where('income.userId = :userId', { userId })
      .andWhere('income.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('income.clientName')
      .getRawMany();

    return results.map(r => ({
      clientName: r.clientName || 'No Client',
      total: parseFloat(r.total) || 0,
      count: parseInt(r.count) || 0,
    }));
  }
}
