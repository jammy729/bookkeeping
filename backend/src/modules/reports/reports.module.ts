import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { Income } from "../../entities/income.entity";
import { Expense } from "../../entities/expense.entity";
import { Invoice } from "../../entities/invoice.entity";
import { Budget } from "../../entities/budget.entity";
import { Attachment } from "../../entities/attachment.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Income, Expense, Invoice, Budget, Attachment]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
