import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, CategoryType } from '../../entities/category.entity';

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
  ) {}

  async create(userId: string, createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      userId,
    });
    return this.categoryRepository.save(category);
  }

  async findAll(userId: string, type?: CategoryType): Promise<Category[]> {
    const where: any = { userId, isActive: true };
    
    if (type) {
      where.type = type;
    }

    return this.categoryRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(userId: string, id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(userId, id);
    
    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async delete(userId: string, id: string): Promise<void> {
    const category = await this.findOne(userId, id);
    await this.categoryRepository.remove(category);
  }

  async getExpenseCategories(userId: string): Promise<Category[]> {
    return this.findAll(userId, CategoryType.EXPENSE);
  }

  async getIncomeCategories(userId: string): Promise<Category[]> {
    return this.findAll(userId, CategoryType.INCOME);
  }
}
