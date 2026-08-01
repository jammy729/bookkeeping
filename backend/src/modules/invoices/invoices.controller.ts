import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  InvoicesService,
  CreateInvoiceDto,
  UpdateInvoiceDto,
} from "./invoices.service";
import { InvoiceStatus } from "../../entities/invoice.entity";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";

@ApiTags("Invoices")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("invoices")
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new invoice" })
  @ApiResponse({ status: 201, description: "Invoice created successfully" })
  async create(@Request() req, @Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(req.user.userId, createInvoiceDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all invoices" })
  @ApiQuery({ name: "status", required: false, enum: InvoiceStatus })
  @ApiResponse({ status: 200, description: "List of invoices" })
  async findAll(@Request() req, @Query("status") status?: InvoiceStatus) {
    return this.invoicesService.findAll(req.user.userId, status);
  }

  @Get("summary")
  @ApiOperation({ summary: "Get invoice summary" })
  @ApiResponse({ status: 200, description: "Invoice summary" })
  async getSummary(@Request() req) {
    return this.invoicesService.getSummary(req.user.userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get invoice by ID" })
  @ApiResponse({ status: 200, description: "Invoice found" })
  @ApiResponse({ status: 404, description: "Invoice not found" })
  async findOne(@Request() req, @Param("id", ParseUUIDPipe) id: string) {
    return this.invoicesService.findOne(id, req.user.userId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update invoice" })
  @ApiResponse({ status: 200, description: "Invoice updated" })
  @ApiResponse({ status: 404, description: "Invoice not found" })
  async update(
    @Request() req,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, req.user.userId, updateInvoiceDto);
  }

  @Post(":id/send")
  @ApiOperation({ summary: "Mark invoice as sent" })
  @ApiResponse({ status: 200, description: "Invoice marked as sent" })
  async markAsSent(@Request() req, @Param("id", ParseUUIDPipe) id: string) {
    return this.invoicesService.markAsSent(id, req.user.userId);
  }

  @Post(":id/paid")
  @ApiOperation({ summary: "Mark invoice as paid" })
  @ApiResponse({ status: 200, description: "Invoice marked as paid" })
  async markAsPaid(@Request() req, @Param("id", ParseUUIDPipe) id: string) {
    return this.invoicesService.markAsPaid(id, req.user.userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft delete invoice" })
  @ApiResponse({ status: 200, description: "Invoice deleted" })
  @ApiResponse({ status: 404, description: "Invoice not found" })
  async remove(@Request() req, @Param("id", ParseUUIDPipe) id: string) {
    await this.invoicesService.remove(id, req.user.userId);
    return { message: "Invoice deleted successfully" };
  }

  @Post(":id/restore")
  @ApiOperation({ summary: "Restore soft-deleted invoice" })
  async restore(@Request() req, @Param("id", ParseUUIDPipe) id: string) {
    return this.invoicesService.restore(id, req.user.userId);
  }
}
