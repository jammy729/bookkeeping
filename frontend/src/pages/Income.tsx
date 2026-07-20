import { useState } from 'react';
import { useIncome, useIncomeMutations } from '../hooks/useIncome';
import { useClients } from '../hooks/useClients';
import { type Income, type CreateIncomeDto, type UpdateIncomeDto } from '../services/income.service';
import { type Client } from '../services/clients.service';
import { useDateRange } from '../hooks/useDateRange';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, UserPlus } from 'lucide-react';

const INCOME_TYPES = [
  { value: 'contractor_payment', label: 'Contractor Payment' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'other', label: 'Other' },
];

export function Income() {
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    fromYear, setFromYear,
    fromMonth, setFromMonth,
    toYear, setToYear,
    toMonth, setToMonth,
    dateRange,
  } = useDateRange();

  const { data: incomes = [], isLoading: loading } = useIncome(dateRange);
  const { remove: removeIncome } = useIncomeMutations();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income record?')) return;
    
    try {
      await removeIncome.mutateAsync(id);
      toast.success('Income record deleted');
    } catch {
      toast.error('Failed to delete income record');
    }
  };

  const handleEdit = (income: Income) => {
    setSelectedIncome(income);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedIncome(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedIncome(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeLabel = (type: string) => {
    return INCOME_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Income</h1>
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add Income
          </Button>
        </div>

        {/* Date Range Filter */}
        <DateRangeFilter
          fromYear={fromYear}
          fromMonth={fromMonth}
          toYear={toYear}
          toMonth={toMonth}
          onFromYearChange={setFromYear}
          onFromMonthChange={setFromMonth}
          onToYearChange={setToYear}
          onToMonthChange={setToMonth}
        />

        {/* Income Table */}
        <Card>
          <CardHeader>
            <CardTitle>Income Records</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : incomes.length === 0 ? (
              <EmptyState
                title="No income records found"
                description="Add your first income record to get started"
                action={
                  <Button onClick={handleAddNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Income
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Description</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Client</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-right py-3 px-4 font-semibold">Amount (CAD)</th>
                      <th className="text-right py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomes.map((income) => (
                      <tr key={income.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{formatDate(income.date)}</td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{income.description}</div>
                            {income.notes && (
                              <div className="text-sm text-gray-500">{income.notes}</div>
                            )}
                            {income.includesHst && income.hstAmount && (
                              <div className="text-xs text-gray-400">
                                (incl. HST: {formatCurrency(income.hstAmount)})
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                            {getTypeLabel(income.type)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {income.clientName || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${income.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {income.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(income.amount)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(income)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(income.id)}
                              className="text-red-600 hover:text-red-700"
                            >
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
      </div>

      {/* Income Form Dialog */}
      {isFormOpen && (
        <IncomeDialog
          income={selectedIncome}
          onClose={handleFormClose}
          onSave={handleFormClose}
        />
      )}
    </>
  );
}

// Income Form Dialog Component
function IncomeDialog({
  income,
  onClose,
  onSave,
}: {
  income: Income | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const { data: clients = [] } = useClients(true);
  const { create, update } = useIncomeMutations();
  const [formData, setFormData] = useState<CreateIncomeDto & UpdateIncomeDto>({
    amount: income?.amount || 0,
    description: income?.description || '',
    type: income?.type || 'contractor_payment',
    date: income?.date || new Date().toISOString().split('T')[0],
    clientName: income?.clientName || '',
    invoiceNumber: income?.invoiceNumber || undefined,
    isPaid: income?.isPaid ?? false,
    paidDate: income?.paidDate || undefined,
    notes: income?.notes || undefined,
    hstAmount: income?.hstAmount || undefined,
    includesHst: income?.includesHst ?? false,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (income) {
        await update.mutateAsync({ id: income.id, data: formData });
        toast.success('Income record updated');
      } else {
        await create.mutateAsync(formData as CreateIncomeDto);
        toast.success('Income record created');
      }
      onSave();
    } catch {
      toast.error(income ? 'Failed to update income' : 'Failed to create income');
    }
  };

  const handleHstToggle = (checked: boolean) => {
    setFormData({ ...formData, includesHst: checked });
    if (checked) {
      const baseAmount = formData.amount / 1.13;
      const hst = formData.amount - baseAmount;
      setFormData(prev => ({ ...prev, hstAmount: Math.round(hst * 100) / 100 }));
    } else {
      setFormData(prev => ({ ...prev, hstAmount: undefined }));
    }
  };

  const handleAmountChange = (value: number) => {
    setFormData({ ...formData, amount: value });
    if (formData.includesHst) {
      const baseAmount = value / 1.13;
      const hst = value - baseAmount;
      setFormData(prev => ({ ...prev, hstAmount: Math.round(hst * 100) / 100 }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {income ? 'Edit Income' : 'Add Income'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount (CAD) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                placeholder="e.g., Web development project"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as CreateIncomeDto['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {INCOME_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Client Name</label>
              <div className="flex gap-2">
                <select
                  value={formData.clientName || ''}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a client...</option>
                  {(clients as Client[]).map((client) => (
                    <option key={client.id} value={client.name}>
                      {client.name}
                    </option>
                  ))}
                </select>
                <a href="/clients" className="inline-flex">
                  <Button type="button" variant="outline" size="sm" title="Add new client">
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </a>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select from existing clients or <a href="/clients" className="text-blue-600 hover:underline">manage clients</a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Invoice Number</label>
              <input
                type="text"
                value={formData.invoiceNumber || ''}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., INV-2024-001"
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="includesHst"
                  checked={formData.includesHst ?? false}
                  onChange={(e) => handleHstToggle(e.target.checked)}
                />
                <label htmlFor="includesHst" className="text-sm font-medium">
                  Includes HST (13%)
                </label>
              </div>
              
              {formData.includesHst && (
                <div>
                  <label className="block text-sm font-medium mb-1">HST Amount (13%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.hstAmount || ''}
                    onChange={(e) => setFormData({ ...formData, hstAmount: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    placeholder="Auto-calculated"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Base: {formatCurrency(formData.amount - (formData.hstAmount || 0))} | 
                    HST: {formatCurrency(formData.hstAmount || 0)} | 
                    Total: {formatCurrency(formData.amount)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPaid"
                checked={formData.isPaid ?? false}
                onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
              />
              <label htmlFor="isPaid" className="text-sm">Mark as paid</label>
            </div>

            {formData.isPaid && (
              <div>
                <label className="block text-sm font-medium mb-1">Paid Date</label>
                <input
                  type="date"
                  value={formData.paidDate || ''}
                  onChange={(e) => setFormData({ ...formData, paidDate: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending || update.isPending} className="flex-1">
                {create.isPending || update.isPending ? 'Saving...' : income ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
