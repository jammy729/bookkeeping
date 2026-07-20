import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  BudgetsService,
  CreateBudgetDto,
  UpdateBudgetDto,
} from "./budgets.service";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";

@ApiTags("Budgets")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("budgets")
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new budget" })
  @ApiResponse({ status: 201, description: "Budget created successfully" })
  async create(@Request() req, @Body() createBudgetDto: CreateBudgetDto) {
    return this.budgetsService.create({
      ...createBudgetDto,
      userId: req.user.userId,
    });
  }

  @Get()
  @ApiOperation({ summary: "Get all budgets" })
  @ApiResponse({ status: 200, description: "List of budgets" })
  async findAll(@Request() req) {
    return this.budgetsService.findAll(req.user.userId);
  }

  @Get("summary")
  @ApiOperation({ summary: "Get budget summary" })
  @ApiResponse({ status: 200, description: "Budget summary" })
  async getSummary(@Request() req) {
    return this.budgetsService.getBudgetSummary(req.user.userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get budget by ID" })
  @ApiResponse({ status: 200, description: "Budget found" })
  @ApiResponse({ status: 404, description: "Budget not found" })
  async findOne(@Request() req, @Param("id", ParseUUIDPipe) id: string) {
    return this.budgetsService.findOne(id, req.user.userId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update budget" })
  @ApiResponse({ status: 200, description: "Budget updated" })
  @ApiResponse({ status: 404, description: "Budget not found" })
  async update(
    @Request() req,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(id, req.user.userId, updateBudgetDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete budget" })
  @ApiResponse({ status: 200, description: "Budget deleted" })
  @ApiResponse({ status: 404, description: "Budget not found" })
  async remove(@Request() req, @Param("id", ParseUUIDPipe) id: string) {
    await this.budgetsService.remove(id, req.user.userId);
    return { message: "Budget deleted successfully" };
  }
}
