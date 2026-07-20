import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { Budget } from '../../entities/budget.entity';
import { Expense } from '../../entities/expense.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Budget, Expense]),
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
