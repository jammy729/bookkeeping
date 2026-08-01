import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category, CategoryType } from "../../entities/category.entity";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "../audit/audit.entity";

export interface CreateCategoryDto {
  name: string;
  type: CategoryType;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  type?: CategoryType;
  description?: string;
  isActive?: boolean;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private auditService: AuditService,
  ) {}

  async create(
    userId: string,
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      userId,
    });
    const saved = await this.categoryRepository.save(category);
    await this.auditService.log({
      userId,
      entityType: "category",
      entityId: saved.id,
      action: AuditAction.CREATE,
      afterState: saved,
    });
    return saved;
  }

  async findAll(userId: string, type?: CategoryType): Promise<Category[]> {
    const where: any = { userId, isActive: true };

    if (type) {
      where.type = type;
    }

    return this.categoryRepository.find({
      where,
      order: { name: "ASC" },
    });
  }

  async findOne(userId: string, id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    return category;
  }

  async update(
    userId: string,
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(userId, id);
    const beforeState = { ...category };

    Object.assign(category, updateCategoryDto);
    const saved = await this.categoryRepository.save(category);
    await this.auditService.log({
      userId,
      entityType: "category",
      entityId: saved.id,
      action: AuditAction.UPDATE,
      beforeState,
      afterState: saved,
    });
    return saved;
  }

  async delete(userId: string, id: string): Promise<void> {
    const category = await this.findOne(userId, id);
    const beforeState = { ...category };
    await this.categoryRepository.softRemove(category);
    await this.auditService.log({
      userId,
      entityType: "category",
      entityId: id,
      action: AuditAction.DELETE,
      beforeState,
    });
  }

  async restore(userId: string, id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, userId },
      withDeleted: true,
    });
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    if (!category.deletedAt) {
      return category;
    }
    await this.categoryRepository.restore({ id, userId });
    const restored = await this.findOne(userId, id);
    await this.auditService.log({
      userId,
      entityType: "category",
      entityId: id,
      action: AuditAction.RESTORE,
      beforeState: { deletedAt: category.deletedAt },
      afterState: restored,
    });
    return restored;
  }

  async getExpenseCategories(userId: string): Promise<Category[]> {
    return this.findAll(userId, CategoryType.EXPENSE);
  }

  async getIncomeCategories(userId: string): Promise<Category[]> {
    return this.findAll(userId, CategoryType.INCOME);
  }
}
