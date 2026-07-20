import { Controller, Get, Query } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";

@ApiTags("Reports")
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("tax")
  @ApiOperation({ summary: "Get HST/GST tax report" })
  @ApiQuery({ name: "userId", description: "User ID" })
  @ApiQuery({ name: "startDate", description: "Start date (YYYY-MM-DD)" })
  @ApiQuery({ name: "endDate", description: "End date (YYYY-MM-DD)" })
  @ApiResponse({ status: 200, description: "Tax report" })
  async getTaxReport(
    @Query("userId") userId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.reportsService.getTaxReport(userId, startDate, endDate);
  }

  @Get("profit-loss")
  @ApiOperation({ summary: "Get Profit & Loss statement" })
  @ApiQuery({ name: "userId", description: "User ID" })
  @ApiQuery({ name: "startDate", description: "Start date (YYYY-MM-DD)" })
  @ApiQuery({ name: "endDate", description: "End date (YYYY-MM-DD)" })
  @ApiResponse({ status: 200, description: "P&L statement" })
  async getProfitAndLoss(
    @Query("userId") userId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.reportsService.getProfitAndLoss(userId, startDate, endDate);
  }

  @Get("balance-sheet")
  @ApiOperation({ summary: "Get Balance Sheet" })
  @ApiQuery({ name: "userId", description: "User ID" })
  @ApiQuery({ name: "asOfDate", description: "Date (YYYY-MM-DD)" })
  @ApiResponse({ status: 200, description: "Balance sheet" })
  async getBalanceSheet(
    @Query("userId") userId: string,
    @Query("asOfDate") asOfDate: string,
  ) {
    return this.reportsService.getBalanceSheet(userId, asOfDate);
  }

  @Get("cash-flow")
  @ApiOperation({ summary: "Get Cash Flow statement" })
  @ApiQuery({ name: "userId", description: "User ID" })
  @ApiQuery({ name: "startDate", description: "Start date (YYYY-MM-DD)" })
  @ApiQuery({ name: "endDate", description: "End date (YYYY-MM-DD)" })
  @ApiResponse({ status: 200, description: "Cash flow statement" })
  async getCashFlow(
    @Query("userId") userId: string,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.reportsService.getCashFlow(userId, startDate, endDate);
  }
}
