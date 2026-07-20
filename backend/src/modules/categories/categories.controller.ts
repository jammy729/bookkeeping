import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CategoriesService, CreateCategoryDto, UpdateCategoryDto } from './categories.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CategoryType } from '../../entities/category.entity';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  create(@Request() req, @Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(req.user.userId, createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  findAll(@Request() req, @Query('type') type?: CategoryType) {
    return this.categoriesService.findAll(req.user.userId, type);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Get expense categories' })
  getExpenseCategories(@Request() req) {
    return this.categoriesService.getExpenseCategories(req.user.userId);
  }

  @Get('incomes')
  @ApiOperation({ summary: 'Get income categories' })
  getIncomeCategories(@Request() req) {
    return this.categoriesService.getIncomeCategories(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.categoriesService.findOne(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category' })
  update(@Request() req, @Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(req.user.userId, id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  remove(@Request() req, @Param('id') id: string) {
    return this.categoriesService.delete(req.user.userId, id);
  }
}
