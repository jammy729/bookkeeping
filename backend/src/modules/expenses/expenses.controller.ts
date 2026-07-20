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
import { ExpensesService, CreateExpenseDto, UpdateExpenseDto } from './expenses.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new expense' })
  create(@Request() req, @Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(req.user.userId, createExpenseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all expenses with optional filters' })
  findAll(
    @Request() req,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.expensesService.findAll(req.user.userId, { startDate, endDate, categoryId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.expensesService.findOne(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update expense' })
  update(@Request() req, @Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(req.user.userId, id, updateExpenseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense' })
  remove(@Request() req, @Param('id') id: string) {
    return this.expensesService.delete(req.user.userId, id);
  }

  @Get('summary/total')
  @ApiOperation({ summary: 'Get total expenses for a period' })
  getTotal(
    @Request() req,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    return this.expensesService.getTotalByPeriod(req.user.userId, startDate, endDate);
  }

  @Get('summary/by-category')
  @ApiOperation({ summary: 'Get expenses grouped by category' })
  getByCategory(
    @Request() req,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    return this.expensesService.getTotalByCategory(req.user.userId, startDate, endDate);
  }
}
