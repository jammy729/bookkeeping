import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Income, IncomeType } from "../../entities/income.entity";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.entity";

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
    private auditService: AuditService,
  ) {}

  async create(
    userId: string,
    createIncomeDto: CreateIncomeDto,
  ): Promise<Income> {
    const income = this.incomeRepository.create({
      ...createIncomeDto,
      userId,
    });
    const saved = await this.incomeRepository.save(income);
    await this.auditService.log({
      userId,
      entityType: "income",
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
      type?: IncomeType;
      isPaid?: boolean;
      page?: number;
      limit?: number;
      search?: string;
    },
  ): Promise<any> {
    const page = filters?.page;
    const limit = filters?.limit;

    const query = this.incomeRepository
      .createQueryBuilder("income")
      .where("income.userId = :userId", { userId })
      .andWhere("income.deletedAt IS NULL");

    if (filters?.startDate && filters?.endDate) {
      query.andWhere("income.date BETWEEN :startDate AND :endDate", {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters?.type) {
      query.andWhere("income.type = :type", { type: filters.type });
    }

    if (filters?.isPaid !== undefined) {
      query.andWhere("income.isPaid = :isPaid", { isPaid: filters.isPaid });
    }

    if (filters?.search) {
      query.andWhere(
        "(income.description ILIKE :search OR income.clientName ILIKE :search OR income.notes ILIKE :search)",
        { search: `%${filters.search}%` },
      );
    }

    if (page && limit) {
      const skip = (page - 1) * limit;
      const [data, total] = await query
        .orderBy("income.date", "DESC")
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    }

    return query.orderBy("income.date", "DESC").getMany();
  }

  async findOne(userId: string, id: string): Promise<Income> {
    const income = await this.incomeRepository.findOne({
      where: { id, userId },
    });

    if (!income) {
      throw new NotFoundException("Income not found");
    }

    return income;
  }

  async update(
    userId: string,
    id: string,
    updateIncomeDto: UpdateIncomeDto,
  ): Promise<Income> {
    const income = await this.findOne(userId, id);
    const beforeState = { ...income };

    Object.assign(income, updateIncomeDto);
    const saved = await this.incomeRepository.save(income);
    await this.auditService.log({
      userId,
      entityType: "income",
      entityId: saved.id,
      action: AuditAction.UPDATE,
      beforeState,
      afterState: saved,
    });
    return saved;
  }

  async delete(userId: string, id: string): Promise<void> {
    const income = await this.findOne(userId, id);
    const beforeState = { ...income };
    await this.incomeRepository.softRemove(income);
    await this.auditService.log({
      userId,
      entityType: "income",
      entityId: id,
      action: AuditAction.DELETE,
      beforeState,
    });
  }

  async restore(userId: string, id: string): Promise<Income> {
    const income = await this.incomeRepository.findOne({
      where: { id, userId },
      withDeleted: true,
    });
    if (!income) {
      throw new NotFoundException("Income not found");
    }
    if (!income.deletedAt) {
      return income;
    }
    await this.incomeRepository.restore({ id, userId });
    const restored = await this.findOne(userId, id);
    await this.auditService.log({
      userId,
      entityType: "income",
      entityId: id,
      action: AuditAction.RESTORE,
      beforeState: { deletedAt: income.deletedAt },
      afterState: restored,
    });
    return restored;
  }

  async getTotalByPeriod(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.incomeRepository
      .createQueryBuilder("income")
      .select("SUM(income.amount)", "total")
      .where("income.userId = :userId", { userId })
      .andWhere("income.date BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("income.deletedAt IS NULL")
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  async getTotalByType(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ type: string; total: number }[]> {
    const results = await this.incomeRepository
      .createQueryBuilder("income")
      .select("income.type", "type")
      .addSelect("SUM(income.amount)", "total")
      .where("income.userId = :userId", { userId })
      .andWhere("income.date BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("income.deletedAt IS NULL")
      .groupBy("income.type")
      .getRawMany();

    return results.map((r) => ({
      type: r.type,
      total: parseFloat(r.total) || 0,
    }));
  }

  async getTotalByClient(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ clientName: string; total: number; count: number }[]> {
    const results = await this.incomeRepository
      .createQueryBuilder("income")
      .select("income.clientName", "clientName")
      .addSelect("SUM(income.amount)", "total")
      .addSelect("COUNT(income.id)", "count")
      .where("income.userId = :userId", { userId })
      .andWhere("income.date BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("income.deletedAt IS NULL")
      .groupBy("income.clientName")
      .getRawMany();

    return results.map((r) => ({
      clientName: r.clientName || "No Client",
      total: parseFloat(r.total) || 0,
      count: parseInt(r.count) || 0,
    }));
  }

  async getMonthlyTotals(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ month: string; total: number }[]> {
    const results = await this.incomeRepository
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

    return results.map((r) => ({
      month: r.month,
      total: parseFloat(r.total) || 0,
    }));
  }

  async bulkImport(
    userId: string,
    rows: CreateIncomeDto[],
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
          type: dto.type,
          clientName: dto.clientName,
          invoiceNumber: dto.invoiceNumber,
          isPaid: dto.isPaid,
          paidDate: dto.paidDate,
          notes: dto.notes,
          hstAmount: dto.hstAmount,
          includesHst: dto.includesHst,
        });
        imported++;
      } catch (err) {
        errors.push(`Row ${i + 1}: ${(err as Error).message}`);
      }
    }

    return { imported, errors };
  }
}
