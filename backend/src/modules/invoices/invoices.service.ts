import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThan } from 'typeorm';
import { Invoice, InvoiceStatus } from '../../entities/invoice.entity';
import { InvoiceItem } from '../../entities/invoice-item.entity';

export interface CreateInvoiceDto {
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  items: CreateInvoiceItemDto[];
  issueDate: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  taxRate?: number;
  discountAmount?: number;
  userId: string;
}

export interface CreateInvoiceItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface UpdateInvoiceDto {
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientAddress?: string;
  items?: CreateInvoiceItemDto[];
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  status?: InvoiceStatus;
  taxRate?: number;
  discountAmount?: number;
}

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemRepository: Repository<InvoiceItem>,
  ) {}

  async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const lastInvoice = await this.invoiceRepository.findOne({
      where: { invoiceNumber: Like(`INV-${year}${month}-%`) },
      order: { invoiceNumber: 'DESC' },
    });

    let sequence = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-');
      const lastSeq = parseInt(parts[2], 10);
      sequence = lastSeq + 1;
    }

    return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber();

    // Calculate totals
    const subtotal = createInvoiceDto.items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice),
      0,
    );
    const taxAmount = (subtotal * (createInvoiceDto.taxRate || 0)) / 100;
    const discountAmount = createInvoiceDto.discountAmount || 0;
    const total = subtotal + taxAmount - discountAmount;

    const invoice = this.invoiceRepository.create({
      invoiceNumber,
      clientId: createInvoiceDto.clientId,
      clientName: createInvoiceDto.clientName,
      clientEmail: createInvoiceDto.clientEmail,
      clientAddress: createInvoiceDto.clientAddress,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      status: InvoiceStatus.DRAFT,
      issueDate: new Date(createInvoiceDto.issueDate),
      dueDate: createInvoiceDto.dueDate ? new Date(createInvoiceDto.dueDate) : null,
      notes: createInvoiceDto.notes,
      terms: createInvoiceDto.terms,
      userId: createInvoiceDto.userId,
      items: createInvoiceDto.items.map((item) =>
        this.invoiceItemRepository.create({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        }),
      ),
    });

    return this.invoiceRepository.save(invoice);
  }

  async findAll(userId: string, status?: InvoiceStatus): Promise<Invoice[]> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return this.invoiceRepository.find({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, userId },
      relations: ['items'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async update(id: string, userId: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id, userId);

    // Update basic fields
    if (updateInvoiceDto.clientId) invoice.clientId = updateInvoiceDto.clientId;
    if (updateInvoiceDto.clientName) invoice.clientName = updateInvoiceDto.clientName;
    if (updateInvoiceDto.clientEmail) invoice.clientEmail = updateInvoiceDto.clientEmail;
    if (updateInvoiceDto.clientAddress) invoice.clientAddress = updateInvoiceDto.clientAddress;
    if (updateInvoiceDto.issueDate) invoice.issueDate = new Date(updateInvoiceDto.issueDate);
    if (updateInvoiceDto.dueDate) invoice.dueDate = new Date(updateInvoiceDto.dueDate);
    if (updateInvoiceDto.notes !== undefined) invoice.notes = updateInvoiceDto.notes;
    if (updateInvoiceDto.terms !== undefined) invoice.terms = updateInvoiceDto.terms;
    if (updateInvoiceDto.status) invoice.status = updateInvoiceDto.status;

    // Update items and recalculate totals if provided
    if (updateInvoiceDto.items) {
      // Remove existing items
      await this.invoiceItemRepository.delete({ invoiceId: id });

      // Create new items
      const subtotal = updateInvoiceDto.items.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice),
        0,
      );
      const taxAmount = (subtotal * (updateInvoiceDto.taxRate || 0)) / 100;
      const discountAmount = updateInvoiceDto.discountAmount || 0;
      const total = subtotal + taxAmount - discountAmount;

      invoice.subtotal = subtotal;
      invoice.taxAmount = taxAmount;
      invoice.discountAmount = discountAmount;
      invoice.total = total;

      invoice.items = updateInvoiceDto.items.map((item) =>
        this.invoiceItemRepository.create({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          invoiceId: id,
        }),
      );
    }

    return this.invoiceRepository.save(invoice);
  }

  async markAsSent(id: string, userId: string): Promise<Invoice> {
    const invoice = await this.findOne(id, userId);
    invoice.status = InvoiceStatus.SENT;
    return this.invoiceRepository.save(invoice);
  }

  async markAsPaid(id: string, userId: string): Promise<Invoice> {
    const invoice = await this.findOne(id, userId);
    invoice.status = InvoiceStatus.PAID;
    invoice.paidDate = new Date();
    return this.invoiceRepository.save(invoice);
  }

  async markAsOverdue(): Promise<void> {
    const today = new Date();
    await this.invoiceRepository.update(
      {
        status: InvoiceStatus.SENT,
        dueDate: LessThan(today),
      },
      { status: InvoiceStatus.OVERDUE },
    );
  }

  async remove(id: string, userId: string): Promise<void> {
    const invoice = await this.findOne(id, userId);
    await this.invoiceRepository.remove(invoice);
  }

  async getSummary(userId: string): Promise<{
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    overdueAmount: number;
  }> {
    const invoices = await this.findAll(userId);

    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = invoices
      .filter((inv) => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => sum + inv.total, 0);
    const outstandingAmount = invoices
      .filter((inv) => inv.status === InvoiceStatus.SENT)
      .reduce((sum, inv) => sum + inv.total, 0);
    const overdueAmount = invoices
      .filter((inv) => inv.status === InvoiceStatus.OVERDUE)
      .reduce((sum, inv) => sum + inv.total, 0);

    return {
      totalInvoices,
      totalAmount,
      paidAmount,
      outstandingAmount,
      overdueAmount,
    };
  }
}
