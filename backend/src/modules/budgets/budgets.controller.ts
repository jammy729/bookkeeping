import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BudgetsService, CreateBudgetDto, UpdateBudgetDto } from './budgets.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Budgets')
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({ status: 201, description: 'Budget created successfully' })
  async create(@Body() createBudgetDto: CreateBudgetDto) {
    return this.budgetsService.create(createBudgetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets' })
  @ApiResponse({ status: 200, description: 'List of budgets' })
  async findAll(@Query('userId') userId: string) {
    return this.budgetsService.findAll(userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get budget summary' })
  @ApiResponse({ status: 200, description: 'Budget summary' })
  async getSummary(@Query('userId') userId: string) {
    return this.budgetsService.getBudgetSummary(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget by ID' })
  @ApiResponse({ status: 200, description: 'Budget found' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Query('userId') userId: string) {
    return this.budgetsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update budget' })
  @ApiResponse({ status: 200, description: 'Budget updated' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(id, userId, updateBudgetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete budget' })
  @ApiResponse({ status: 200, description: 'Budget deleted' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Query('userId') userId: string) {
    await this.budgetsService.remove(id, userId);
    return { message: 'Budget deleted successfully' };
  }
}
