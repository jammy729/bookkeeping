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
} from "@nestjs/common";
import {
  IncomeService,
  CreateIncomeDto,
  UpdateIncomeDto,
} from "./income.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";

@ApiTags("Income")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("income")
export class IncomeController {
  constructor(private incomeService: IncomeService) {}

  @Post()
  @ApiOperation({ summary: "Create a new income record" })
  create(@Request() req, @Body() createIncomeDto: CreateIncomeDto) {
    return this.incomeService.create(req.user.userId, createIncomeDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all income records with optional filters" })
  findAll(
    @Request() req,
    @Query("startDate") startDate?: Date,
    @Query("endDate") endDate?: Date,
    @Query("type") type?: string,
    @Query("isPaid") isPaid?: boolean,
  ) {
    return this.incomeService.findAll(req.user.userId, {
      startDate,
      endDate,
      type: type as any,
      isPaid,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get income by ID" })
  findOne(@Request() req, @Param("id") id: string) {
    return this.incomeService.findOne(req.user.userId, id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update income" })
  update(
    @Request() req,
    @Param("id") id: string,
    @Body() updateIncomeDto: UpdateIncomeDto,
  ) {
    return this.incomeService.update(req.user.userId, id, updateIncomeDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete income" })
  remove(@Request() req, @Param("id") id: string) {
    return this.incomeService.delete(req.user.userId, id);
  }

  @Get("summary/total")
  @ApiOperation({ summary: "Get total income for a period" })
  getTotal(
    @Request() req,
    @Query("startDate") startDate: Date,
    @Query("endDate") endDate: Date,
  ) {
    return this.incomeService.getTotalByPeriod(
      req.user.userId,
      startDate,
      endDate,
    );
  }

  @Get("summary/by-type")
  @ApiOperation({ summary: "Get income grouped by type" })
  getByType(
    @Request() req,
    @Query("startDate") startDate: Date,
    @Query("endDate") endDate: Date,
  ) {
    return this.incomeService.getTotalByType(
      req.user.userId,
      startDate,
      endDate,
    );
  }

  @Get("summary/by-client")
  @ApiOperation({ summary: "Get income grouped by client" })
  getByClient(
    @Request() req,
    @Query("startDate") startDate: Date,
    @Query("endDate") endDate: Date,
  ) {
    return this.incomeService.getTotalByClient(
      req.user.userId,
      startDate,
      endDate,
    );
  }
}
