import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice } from '../services/invoices.service';
import type { BusinessProfile } from '../context/business-context';

/**
 * Generate and download a professional PDF for an invoice.
 *
 * Layout:
 *   ┌────────────────────────────────────┐
 *   │  [Business Name]       INVOICE     │
 *   │  Business details      #INV-...    │
 *   │                       Issue Date   │
 *   │                       Due Date     │
 *   ├────────────────────────────────────┤
 *   │  Bill To:                          │
 *   │  Client Name                       │
 *   │  Client Email                      │
 *   │  Client Address                    │
 *   ├────────────────────────────────────┤
 *   │  Description  Qty  Unit Price  Amt │
 *   │  ─────────────────────────────────  │
 *   │  Item 1        2   $100.00   $200  │
 *   │  Item 2        1   $50.00    $50   │
 *   ├────────────────────────────────────┤
 *   │              Subtotal    $250.00   │
 *   │              Tax (13%)    $32.50   │
 *   │              Discount     -$0.00   │
 *   │              ────────────────────  │
 *   │              TOTAL        $282.50  │
 *   ├────────────────────────────────────┤
 *   │  Notes: ...                        │
 *   │  Terms: ...                        │
 *   └────────────────────────────────────┘
 */
export function generateInvoicePDF(
  invoice: Invoice,
  businessProfile?: BusinessProfile,
  labels?: Record<string, string>,
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Colour palette ──
  const primary = [0, 128, 128] as const; // teal
  const muted = [100, 100, 100] as const;

  // ── Header: business info (left) + "INVOICE" + meta (right) ──
  const businessName = businessProfile?.businessName ?? '';
  const headerY = 20;

  if (businessName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(businessName, 14, headerY);
  }

  // "INVOICE" badge (right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...primary);
  doc.text('INVOICE', pageWidth - 14, headerY, { align: 'right' });

  // Invoice number
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  doc.text(invoice.invoiceNumber, pageWidth - 14, headerY + 6, { align: 'right' });

  // Dates
  let datesY = headerY + 14;
  if (invoice.issueDate) {
    doc.setFont('helvetica', 'normal');
    doc.text(`${labels?.issueDate ?? 'Issue Date'}: ${invoice.issueDate}`, pageWidth - 14, datesY, { align: 'right' });
    datesY += 5;
  }
  if (invoice.dueDate) {
    doc.text(`${labels?.dueDate ?? 'Due Date'}: ${invoice.dueDate}`, pageWidth - 14, datesY, { align: 'right' });
    datesY += 5;
  }
  if (invoice.paidDate) {
    doc.text(`${labels?.paidDate ?? 'Paid Date'}: ${invoice.paidDate}`, pageWidth - 14, datesY, { align: 'right' });
    datesY += 5;
  }

  // ── Separator ──
  let y = Math.max(datesY, 42);
  doc.setDrawColor(...primary);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  // ── Bill To (left) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  doc.text(labels?.billTo ?? 'Bill To:', 14, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  y += 6;
  doc.text(invoice.clientName, 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  if (invoice.clientEmail) {
    y += 5;
    doc.text(invoice.clientEmail, 14, y);
  }
  if (invoice.clientAddress) {
    y += 5;
    const addressLines = doc.splitTextToSize(invoice.clientAddress, 80);
    doc.text(addressLines, 14, y);
    y += addressLines.length * 4;
  }

  // Status badge (right side)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const statusColors: Record<string, [number, number, number]> = {
    draft: [120, 120, 120],
    sent: [59, 130, 246],
    paid: [34, 197, 94],
    overdue: [239, 68, 68],
    cancelled: [120, 120, 120],
  };
  const statusColor = statusColors[invoice.status] ?? muted;
  doc.setTextColor(...statusColor);
  doc.text((invoice.status ?? 'draft').toUpperCase(), pageWidth - 14, 42, { align: 'right' });

  // ── Line items table ──
  y = Math.max(y + 8, 58);

  const itemHeader = [
    labels?.description ?? 'Description',
    labels?.qty ?? 'Qty',
    labels?.unitPrice ?? 'Unit Price',
    labels?.amount ?? 'Amount',
  ];
  const itemRows = invoice.items.map((item) => [
    item.description,
    String(item.quantity),
    formatPdfCurrency(item.unitPrice),
    formatPdfCurrency(item.total),
  ]);

  autoTable(doc, {
    startY: y,
    head: [itemHeader],
    body: itemRows,
    theme: 'plain',
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: 60,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: 40,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35 },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // ── Totals ──
  const totalsX = pageWidth - 14;
  const labelX = totalsX - 55;
  const valueX = totalsX;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(labels?.subtotal ?? 'Subtotal', labelX, y);
  doc.setTextColor(0, 0, 0);
  doc.text(formatPdfCurrency(invoice.subtotal), valueX, y, { align: 'right' });
  y += 5;

  if (invoice.taxAmount > 0) {
    doc.setTextColor(...muted);
    doc.text(`${labels?.tax ?? 'Tax'}`, labelX, y);
    doc.setTextColor(0, 0, 0);
    doc.text(formatPdfCurrency(invoice.taxAmount), valueX, y, { align: 'right' });
    y += 5;
  }

  if (invoice.discountAmount > 0) {
    doc.setTextColor(...muted);
    doc.text(`${labels?.discount ?? 'Discount'}`, labelX, y);
    doc.setTextColor(0, 0, 0);
    doc.text(`-${formatPdfCurrency(invoice.discountAmount)}`, valueX, y, { align: 'right' });
    y += 5;
  }

  // Total line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(labelX, y, valueX, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(labels?.total ?? 'Total', labelX, y);
  doc.text(formatPdfCurrency(invoice.total), valueX, y, { align: 'right' });
  y += 10;

  // ── Notes ──
  if (invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.text(`${labels?.notes ?? 'Notes'}:`, 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 28);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 4 + 4;
  }

  // ── Terms ──
  if (invoice.terms) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.text(`${labels?.terms ?? 'Terms'}:`, 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const termLines = doc.splitTextToSize(invoice.terms, pageWidth - 28);
    doc.text(termLines, 14, y);
    y += termLines.length * 4 + 4;
  }

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7);
  doc.setTextColor(...muted);
  doc.text(
    `${businessName ? businessName + ' • ' : ''}Generated by Bookkeeping App`,
    pageWidth / 2,
    footerY,
    { align: 'center' },
  );

  // ── Download ──
  const filename = `${invoice.invoiceNumber}.pdf`;
  doc.save(filename);
}

function formatPdfCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
