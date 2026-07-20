import { useState } from 'react';
import {
  useExpenseCategories,
  useIncomeCategories,
  useCategoryMutations,
} from '../hooks/useCategories';
import { type Category, type CreateCategoryDto, type UpdateCategoryDto } from '../services/categories.service';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus } from 'lucide-react';

export function Categories() {
  const { data: expenseCategories = [], isLoading: loadingExpenses } = useExpenseCategories();
  const { data: incomeCategories = [], isLoading: loadingIncomes } = useIncomeCategories();
  const { remove: removeCategory } = useCategoryMutations();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'expense' | 'income'>('expense');

  const loading = loadingExpenses || loadingIncomes;

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await removeCategory.mutateAsync(id);
      toast.success('Category deleted');
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormType(category.type);
    setIsFormOpen(true);
  };

  const handleAddNew = (type: 'expense' | 'income') => {
    setSelectedCategory(null);
    setFormType(type);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedCategory(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleAddNew('expense')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense Category
          </Button>
          <Button variant="outline" onClick={() => handleAddNew('income')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Income Category
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expense Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Expense Categories</span>
                <Button size="sm" variant="outline" onClick={() => handleAddNew('expense')}>
                  <Plus className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenseCategories.length === 0 ? (
                <EmptyState
                  title="No expense categories"
                  description="Add your first expense category"
                />
              ) : (
                <div className="space-y-2">
                  {expenseCategories.map((category) => (
                    <CategoryRow
                      key={category.id}
                      category={category}
                      onEdit={() => handleEdit(category)}
                      onDelete={() => handleDelete(category.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Income Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Income Categories</span>
                <Button size="sm" variant="outline" onClick={() => handleAddNew('income')}>
                  <Plus className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomeCategories.length === 0 ? (
                <EmptyState
                  title="No income categories"
                  description="Add your first income category"
                />
              ) : (
                <div className="space-y-2">
                  {incomeCategories.map((category) => (
                    <CategoryRow
                      key={category.id}
                      category={category}
                      onEdit={() => handleEdit(category)}
                      onDelete={() => handleDelete(category.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Form Dialog */}
      {isFormOpen && (
        <CategoryDialog
          category={selectedCategory}
          type={formType}
          onClose={handleFormClose}
          onSave={handleFormClose}
        />
      )}
    </div>
  );
}

function CategoryRow({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
      <div>
        <div className="font-medium">{category.name}</div>
        {category.description && (
          <div className="text-sm text-gray-500">{category.description}</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded text-xs ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          {category.isActive ? 'Active' : 'Inactive'}
        </span>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function CategoryDialog({
  category,
  type,
  onClose,
  onSave,
}: {
  category: Category | null;
  type: 'expense' | 'income';
  onClose: () => void;
  onSave: () => void;
}) {
  const { create, update } = useCategoryMutations();
  const [formData, setFormData] = useState<CreateCategoryDto & UpdateCategoryDto>({
    name: category?.name || '',
    type: category?.type || type,
    description: category?.description || '',
    isActive: category?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (category) {
        await update.mutateAsync({ id: category.id, data: formData });
        toast.success('Category updated');
      } else {
        await create.mutateAsync(formData as CreateCategoryDto);
        toast.success('Category created');
      }
      onSave();
    } catch {
      toast.error(category ? 'Failed to update category' : 'Failed to create category');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {category ? 'Edit Category' : 'Add Category'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'expense' | 'income' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={!!category}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                placeholder="e.g., Office Supplies, Consulting Income"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Optional description for this category"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive ?? true}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <label htmlFor="isActive" className="text-sm">Active (show in forms)</label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending || update.isPending} className="flex-1">
                {create.isPending || update.isPending ? 'Saving...' : category ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
