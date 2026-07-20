import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus } from 'lucide-react';

interface Budget {
  id: string;
  name: string;
  amount: number;
  period: string;
  categoryId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateBudgetDto {
  name: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  categoryId?: string;
  notes?: string;
}

interface Category {
  id: string;
  name: string;
}

export function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await api.get<Budget[]>('/budgets');
      setBudgets(response.data);
    } catch {
      toast.error('Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get<Category[]>('/categories/expenses');
      setCategories(response.data);
    } catch {
      console.error('Failed to fetch categories:');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;
    
    try {
      await api.delete(`/budgets/${id}`);
      toast.success('Budget deleted');
      fetchBudgets();
    } catch {
      toast.error('Failed to delete budget');
    }
  };

  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedBudget(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedBudget(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Budget
        </Button>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Budgets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{budgets.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(budgets.filter(b => b.period === 'monthly').reduce((sum, b) => sum + b.amount, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Yearly Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(budgets.filter(b => b.period === 'yearly').reduce((sum, b) => sum + b.amount, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budgets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Budget List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : budgets.length === 0 ? (
            <EmptyState
              title="No budgets found"
              description="Add your first budget to start tracking"
              action={
                <Button onClick={handleAddNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Budget
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Category</th>
                    <th className="text-left py-3 px-4 font-semibold">Period</th>
                    <th className="text-right py-3 px-4 font-semibold">Amount</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((budget) => (
                    <tr key={budget.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{budget.name}</div>
                          {budget.notes && (
                            <div className="text-sm text-gray-500">{budget.notes}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {budget.categoryId ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {categories.find(c => c.id === budget.categoryId)?.name || 'Unknown'}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm capitalize">
                          {budget.period}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(budget.amount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(budget)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(budget.id)}
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

      {/* Budget Form Dialog */}
      {isFormOpen && (
        <BudgetDialog
          budget={selectedBudget}
          categories={categories}
          onClose={handleFormClose}
          onSave={() => {
            fetchBudgets();
            handleFormClose();
          }}
        />
      )}
    </div>
  );
}

function BudgetDialog({
  budget,
  categories,
  onClose,
  onSave,
}: {
  budget: Budget | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<CreateBudgetDto>({
    name: budget?.name || '',
    amount: budget?.amount || 0,
    period: budget?.period as 'monthly' | 'quarterly' | 'yearly' || 'monthly',
    categoryId: budget?.categoryId || undefined,
    notes: budget?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (budget) {
        await api.put(`/budgets/${budget.id}`, formData);
        toast.success('Budget updated');
      } else {
        await api.post('/budgets', formData);
        toast.success('Budget created');
      }
      onSave();
    } catch {
      toast.error(budget ? 'Failed to update budget' : 'Failed to create budget');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {budget ? 'Edit Budget' : 'Add Budget'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                placeholder="e.g., Office Supplies Budget"
              />
            </div>

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
              <label className="block text-sm font-medium mb-1">Period *</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value as 'monthly' | 'quarterly' | 'yearly' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category (optional)</label>
              <select
                value={formData.categoryId || ''}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">No category</option>
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
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? 'Saving...' : budget ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
