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
} from "@nestjs/common";
import {
  InvoicesService,
  CreateInvoiceDto,
  UpdateInvoiceDto,
} from "./invoices.service";
import { InvoiceStatus } from "../../entities/invoice.entity";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";

@ApiTags("Invoices")
@Controller("invoices")
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new invoice" })
  @ApiResponse({ status: 201, description: "Invoice created successfully" })
  async create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all invoices" })
  @ApiQuery({ name: "status", required: false, enum: InvoiceStatus })
  @ApiResponse({ status: 200, description: "List of invoices" })
  async findAll(
    @Query("userId") userId: string,
    @Query("status") status?: InvoiceStatus,
  ) {
    return this.invoicesService.findAll(userId, status);
  }

  @Get("summary")
  @ApiOperation({ summary: "Get invoice summary" })
  @ApiResponse({ status: 200, description: "Invoice summary" })
  async getSummary(@Query("userId") userId: string) {
    return this.invoicesService.getSummary(userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get invoice by ID" })
  @ApiResponse({ status: 200, description: "Invoice found" })
  @ApiResponse({ status: 404, description: "Invoice not found" })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("userId") userId: string,
  ) {
    return this.invoicesService.findOne(id, userId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update invoice" })
  @ApiResponse({ status: 200, description: "Invoice updated" })
  @ApiResponse({ status: 404, description: "Invoice not found" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("userId") userId: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, userId, updateInvoiceDto);
  }

  @Post(":id/send")
  @ApiOperation({ summary: "Mark invoice as sent" })
  @ApiResponse({ status: 200, description: "Invoice marked as sent" })
  async markAsSent(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("userId") userId: string,
  ) {
    return this.invoicesService.markAsSent(id, userId);
  }

  @Post(":id/paid")
  @ApiOperation({ summary: "Mark invoice as paid" })
  @ApiResponse({ status: 200, description: "Invoice marked as paid" })
  async markAsPaid(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("userId") userId: string,
  ) {
    return this.invoicesService.markAsPaid(id, userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete invoice" })
  @ApiResponse({ status: 200, description: "Invoice deleted" })
  @ApiResponse({ status: 404, description: "Invoice not found" })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("userId") userId: string,
  ) {
    await this.invoicesService.remove(id, userId);
    return { message: "Invoice deleted successfully" };
  }
}
