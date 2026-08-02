import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import i18n from '../i18n';
import { useInvoices, useInvoiceSummary, useInvoiceMutations } from '../hooks/useInvoices';
import { useClients } from '../hooks/useClients';
import { useBusiness } from '../context/business-context';
import { type Invoice, type InvoiceStatus } from '../services/invoices.service';
import { invoiceSchema, type InvoiceFormData } from '../lib/form-schemas';
import { formatCurrency } from '../lib/utils';
import { generateInvoicePDF } from '../lib/invoice-pdf';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { FormField } from '../components/ui/FormField';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '../components/ui/alert-dialog';
import { Pencil, Trash2, Plus, FileText, Send, CheckCircle, Eye, Download } from 'lucide-react';

const STATUS_OPTIONS: { value: InvoiceStatus | ''; label: string }[] = [
  { value: '', label: 'all' },
  { value: 'draft', label: 'draft' },
  { value: 'sent', label: 'sent' },
  { value: 'paid', label: 'paid' },
  { value: 'overdue', label: 'overdue' },
  { value: 'cancelled', label: 'cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-muted text-muted-foreground line-through',
};

export function Invoices() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data: invoices = [], isLoading: loading } = useInvoices(statusFilter || undefined);
  const { data: summary } = useInvoiceSummary();
  const { remove: removeInvoice } = useInvoiceMutations();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string } | null>(null);
  const businessCtx = useBusiness();

  const handleDelete = (id: string) => {
    setDeleteTarget({ id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await removeInvoice.mutateAsync(deleteTarget.id);
      toast.success(t('invoices.toast.deleted'));
      setDeleteTarget(null);
    } catch {
      toast.error(t('invoices.toast.deleteFailed'));
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedInvoice(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('invoices.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('invoices.description')}</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          {t('invoices.create')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('invoices.stats.total')}</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summary?.totalInvoices ?? 0}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(summary?.totalAmount ?? 0, i18n.language)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('invoices.stats.paid')}</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(summary?.paidAmount ?? 0, i18n.language)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('invoices.stats.outstanding')}</CardTitle>
                <Send className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(summary?.outstandingAmount ?? 0, i18n.language)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('invoices.stats.overdue')}</CardTitle>
                <Eye className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(summary?.overdueAmount ?? 0, i18n.language)}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('invoices.list')}</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('invoices.filter.all')} />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.value ? t(`invoices.status.${opt.value}`) : t('invoices.filter.all')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <EmptyState
              title={t('invoices.empty.title')}
              description={t('invoices.empty.description')}
              action={
                <Button onClick={handleAddNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('invoices.create')}
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">{t('invoices.table.invoice')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('invoices.table.client')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('invoices.table.issueDate')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('invoices.table.dueDate')}</th>
                    <th className="text-right py-3 px-4 font-semibold">{t('invoices.table.amount')}</th>
                    <th className="text-center py-3 px-4 font-semibold">{t('invoices.table.status')}</th>
                    <th className="text-right py-3 px-4 font-semibold">{t('invoices.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm font-medium">{invoice.invoiceNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{invoice.clientName}</div>
                          <div className="text-sm text-muted-foreground">{invoice.clientEmail}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{invoice.issueDate}</td>
                      <td className="py-3 px-4 text-sm">{invoice.dueDate || '-'}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(invoice.total, i18n.language)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[invoice.status]}`}>
                          {t(`invoices.status.${invoice.status}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          {invoice.status === 'draft' && (
                            <SendInvoiceButton invoiceId={invoice.id} />
                          )}
                          {invoice.status === 'sent' && (
                            <PaidInvoiceButton invoiceId={invoice.id} />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              generateInvoicePDF(invoice, businessCtx.profile, {
                                issueDate: t('invoices.table.issueDate'),
                                dueDate: t('invoices.table.dueDate'),
                                paidDate: t('invoices.form.paidDate', 'Paid Date'),
                                billTo: t('invoices.pdf.billTo', 'Bill To'),
                                description: t('invoices.pdf.description', 'Description'),
                                qty: t('invoices.pdf.qty', 'Qty'),
                                unitPrice: t('invoices.pdf.unitPrice', 'Unit Price'),
                                amount: t('invoices.pdf.amount', 'Amount'),
                                subtotal: t('invoices.form.subtotal'),
                                tax: t('invoices.form.tax'),
                                discount: t('invoices.form.discountLabel', 'Discount'),
                                total: t('invoices.form.total'),
                                notes: t('invoices.form.notes'),
                                terms: t('invoices.pdf.terms', 'Terms'),
                              })
                            }
                            title={t('invoices.actions.downloadPdf', 'Download PDF')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(invoice)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(invoice.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <InvoiceDialog
        invoice={selectedInvoice}
        open={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedInvoice(null); }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.deleteTitle', { entity: 'invoice' })}</AlertDialogTitle>
            <AlertDialogDescription>{t('dialog.confirmDelete', { entity: 'invoice' })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SendInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const { t } = useTranslation();
  const { markAsSent } = useInvoiceMutations();

  const handleSend = async () => {
    try {
      await markAsSent.mutateAsync(invoiceId);
      toast.success(t('invoices.toast.sent'));
    } catch {
      toast.error(t('invoices.toast.sendFailed'));
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleSend} title={t('invoices.actions.send')}>
      <Send className="w-4 h-4 text-blue-500" />
    </Button>
  );
}

function PaidInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const { t } = useTranslation();
  const { markAsPaid } = useInvoiceMutations();

  const handlePaid = async () => {
    try {
      await markAsPaid.mutateAsync(invoiceId);
      toast.success(t('invoices.toast.paid'));
    } catch {
      toast.error(t('invoices.toast.paidFailed'));
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handlePaid} title={t('invoices.actions.markPaid')}>
      <CheckCircle className="w-4 h-4 text-green-500" />
    </Button>
  );
}

function InvoiceDialog({
  invoice,
  open,
  onClose,
}: {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { data: clients = [] } = useClients();
  const { create, update } = useInvoiceMutations();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoice
      ? {
          clientId: invoice.clientId,
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail || '',
          clientAddress: invoice.clientAddress || '',
          items: invoice.items.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate || '',
          notes: invoice.notes || '',
          terms: invoice.terms || '',
          taxRate: invoice.taxAmount > 0 && invoice.subtotal > 0 ? (invoice.taxAmount / invoice.subtotal) * 100 : 0,
          discountAmount: invoice.discountAmount || 0,
        }
      : {
          clientId: '',
          clientName: '',
          clientEmail: '',
          clientAddress: '',
          items: [{ description: '', quantity: 1, unitPrice: 0 }],
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          notes: '',
          terms: '',
          taxRate: 0,
          discountAmount: 0,
        },
  });

  const items = watch("items");
  const taxRate = watch("taxRate");
  const discountAmount = watch("discountAmount");
  const clientId = watch("clientId");

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = (subtotal * (taxRate || 0)) / 100;
  const total = subtotal + taxAmount - (discountAmount || 0);

  const selectClient = (id: string) => {
    const client = clients.find((c) => c.id === id);
    if (client) {
      setValue("clientId", client.id, { shouldValidate: true });
      setValue("clientName", client.name, { shouldValidate: true });
      setValue("clientEmail", client.email || "", { shouldValidate: true });
      setValue("clientAddress", client.address || "", { shouldValidate: true });
    }
  };

  const updateItem = (index: number, field: keyof InvoiceFormData['items'][number], value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setValue("items", updated, { shouldValidate: true });
  };

  const addItem = () => {
    setValue("items", [...items, { description: "", quantity: 1, unitPrice: 0 }], { shouldValidate: true });
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setValue("items", items.filter((_, i) => i !== index), { shouldValidate: true });
  };

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      if (invoice) {
        await update.mutateAsync({ id: invoice.id, data });
        toast.success(t('invoices.toast.updated'));
      } else {
        await create.mutateAsync(data);
        toast.success(t('invoices.toast.created'));
      }
      onClose();
    } catch {
      toast.error(invoice ? t('invoices.toast.updateFailed') : t('invoices.toast.createFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? t('invoices.form.titleEdit') : t('invoices.form.titleCreate')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>{t('invoices.form.client')}</Label>
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => { field.onChange(v); selectClient(v); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('invoices.form.selectClient')} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.clientId && (
              <p className="text-sm text-destructive mt-1">{errors.clientId.message}</p>
            )}
          </div>
          {clientId && (
            <div className="text-sm text-muted-foreground">
              {watch("clientEmail") && <div>{watch("clientEmail")}</div>}
              {watch("clientAddress") && <div>{watch("clientAddress")}</div>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t('invoices.form.issueDate')}
              name="issueDate"
              control={control}
              errors={errors}
              type="date"
              required
            />
            <FormField
              label={t('invoices.form.dueDate')}
              name="dueDate"
              control={control}
              errors={errors}
              type="date"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('invoices.form.items')}</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-3 h-3 mr-1" /> {t('invoices.form.addItem')}
              </Button>
            </div>
            {errors.items && (
              <p className="text-sm text-destructive">{errors.items.message}</p>
            )}
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder={t('invoices.form.itemDescription')}
                      value={item.description}
                      onChange={(e) => updateItem(i, 'description', e.target.value)}
                    />
                    {errors.items?.[i]?.description && (
                      <p className="text-sm text-destructive mt-1">{errors.items[i]?.description?.message}</p>
                    )}
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      min="1"
                      placeholder={t('invoices.form.qty')}
                      value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-28">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={t('invoices.form.price')}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="pl-7 font-mono"
                      />
                    </div>
                  </div>
                  <div className="w-24 pt-2 text-right text-sm font-medium">
                    {formatCurrency(item.quantity * item.unitPrice, i18n.language)}
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} className="text-destructive mt-1">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t('invoices.form.taxRate')}
              name="taxRate"
              control={control}
              errors={errors}
              type="number"
              step="0.01"
              placeholder="e.g., 13"
            />
            <CurrencyInput
              label={t('invoices.form.discount')}
              name="discountAmount"
              control={control}
              errors={errors}
            />
          </div>

          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('invoices.form.subtotal')}</span>
              <span>{formatCurrency(subtotal, i18n.language)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('invoices.form.tax')} ({taxRate}%)</span>
                <span>{formatCurrency(taxAmount, i18n.language)}</span>
              </div>
            )}
            {(discountAmount || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('invoices.form.discount')}</span>
                <span>-{formatCurrency(discountAmount || 0, i18n.language)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t">
              <span>{t('invoices.form.total')}</span>
              <span>{formatCurrency(total, i18n.language)}</span>
            </div>
          </div>

          <FormField
            label={t('invoices.form.notes')}
            name="notes"
            control={control}
            errors={errors}
            placeholder={t('invoices.form.notesPlaceholder')}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? t('saving') : invoice ? t('update') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
