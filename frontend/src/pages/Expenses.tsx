import { useState } from 'react';
import { useExpenses, useExpenseMutations } from '../hooks/useExpenses';
import { useExpenseCategories } from '../hooks/useCategories';
import { type Expense, type CreateExpenseDto, type UpdateExpenseDto } from '../services/expenses.service';
import { type Category } from '../services/categories.service';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus } from 'lucide-react';

export function Expenses() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: expenses = [], isLoading: loading } = useExpenses({ startDate, endDate });
  const { data: categories = [] } = useExpenseCategories();
  const { remove: removeExpense } = useExpenseMutations();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await removeExpense.mutateAsync(id);
      toast.success('Expense deleted');
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedExpense(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedExpense(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : expenses.length === 0 ? (
            <EmptyState
              title="No expenses found"
              description="Add your first expense to get started"
              action={
                <Button onClick={handleAddNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
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
                    <th className="text-left py-3 px-4 font-semibold">Category</th>
                    <th className="text-right py-3 px-4 font-semibold">Amount</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{formatDate(expense.date)}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{expense.description}</div>
                          {expense.notes && (
                            <div className="text-sm text-gray-500">{expense.notes}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {expense.category ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {expense.category.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
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

      {/* Expense Form Dialog */}
      {isFormOpen && (
        <ExpenseDialog
          expense={selectedExpense}
          categories={categories}
          onClose={handleFormClose}
          onSave={handleFormClose}
        />
      )}
    </div>
  );
}

// Expense Form Dialog Component
function ExpenseDialog({
  expense,
  categories,
  onClose,
  onSave,
}: {
  expense: Expense | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}) {
  const { create, update } = useExpenseMutations();
  const [formData, setFormData] = useState<CreateExpenseDto & UpdateExpenseDto>({
    amount: expense?.amount || 0,
    description: expense?.description || '',
    date: expense?.date || new Date().toISOString().split('T')[0],
    categoryId: expense?.categoryId || undefined,
    notes: expense?.notes || '',
    isRecurring: expense?.isRecurring || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (expense) {
        await update.mutateAsync({ id: expense.id, data: formData });
        toast.success('Expense updated');
      } else {
        await create.mutateAsync(formData as CreateExpenseDto);
        toast.success('Expense created');
      }
      onSave();
    } catch {
      toast.error(expense ? 'Failed to update expense' : 'Failed to create expense');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {expense ? 'Edit Expense' : 'Add Expense'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
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
              />
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
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.categoryId || ''}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring || false}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
              />
              <label htmlFor="isRecurring" className="text-sm">Recurring expense</label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending || update.isPending} className="flex-1">
                {create.isPending || update.isPending ? 'Saving...' : expense ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
