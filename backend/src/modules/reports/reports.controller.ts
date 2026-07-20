import { Controller, Get, Query, UseGuards, Request } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";

@ApiTags("Reports")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("tax")
  @ApiOperation({ summary: "Get HST/GST tax report" })
  @ApiQuery({ name: "startDate", description: "Start date (YYYY-MM-DD)" })
  @ApiQuery({ name: "endDate", description: "End date (YYYY-MM-DD)" })
  async getTaxReport(
    @Request() req,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.reportsService.getTaxReport(
      req.user.userId,
      startDate,
      endDate,
    );
  }

  @Get("profit-loss")
  @ApiOperation({ summary: "Get Profit & Loss statement" })
  @ApiQuery({ name: "startDate", description: "Start date (YYYY-MM-DD)" })
  @ApiQuery({ name: "endDate", description: "End date (YYYY-MM-DD)" })
  async getProfitAndLoss(
    @Request() req,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.reportsService.getProfitAndLoss(
      req.user.userId,
      startDate,
      endDate,
    );
  }

  @Get("balance-sheet")
  @ApiOperation({ summary: "Get Balance Sheet" })
  @ApiQuery({ name: "asOfDate", description: "Date (YYYY-MM-DD)" })
  async getBalanceSheet(@Request() req, @Query("asOfDate") asOfDate: string) {
    return this.reportsService.getBalanceSheet(req.user.userId, asOfDate);
  }

  @Get("cash-flow")
  @ApiOperation({ summary: "Get Cash Flow statement" })
  @ApiQuery({ name: "startDate", description: "Start date (YYYY-MM-DD)" })
  @ApiQuery({ name: "endDate", description: "End date (YYYY-MM-DD)" })
  async getCashFlow(
    @Request() req,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.reportsService.getCashFlow(req.user.userId, startDate, endDate);
  }
}
