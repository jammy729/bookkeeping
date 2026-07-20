import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Income } from "../../entities/income.entity";
import { IncomeService } from "./income.service";
import { IncomeController } from "./income.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Income])],
  providers: [IncomeService],
  controllers: [IncomeController],
  exports: [IncomeService],
})
export class IncomeModule {}
