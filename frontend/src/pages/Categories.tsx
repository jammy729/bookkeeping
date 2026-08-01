import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useExpenseCategories,
  useIncomeCategories,
  useCategoryMutations,
} from '../hooks/useCategories';
import { type Category } from '../services/categories.service';
import { categorySchema, type CategoryFormData } from '../lib/form-schemas';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { FormField } from '../components/ui/FormField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '../components/ui/alert-dialog';
import { Pencil, Trash2, Plus, Tags } from 'lucide-react';

export function Categories() {
  const { t } = useTranslation();
  const { data: expenseCategories = [], isLoading: loadingExpenses } = useExpenseCategories();
  const { data: incomeCategories = [], isLoading: loadingIncomes } = useIncomeCategories();
  const { remove: removeCategory } = useCategoryMutations();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'expense' | 'income'>('expense');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string } | null>(null);

  const loading = loadingExpenses || loadingIncomes;

  const handleDelete = (id: string) => {
    setDeleteTarget({ id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await removeCategory.mutateAsync(deleteTarget.id);
      toast.success(t('categories.toast.deleted'));
      setDeleteTarget(null);
    } catch {
      toast.error(t('categories.toast.deleteFailed'));
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

  const totalCategories = expenseCategories.length + incomeCategories.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('categories.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('categories.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleAddNew('expense')}>
            <Plus className="w-4 h-4 mr-2" />
            {t('categories.expenseTab')}
          </Button>
          <Button variant="outline" onClick={() => handleAddNew('income')}>
            <Plus className="w-4 h-4 mr-2" />
            {t('categories.incomeTab')}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('categories.stats.total')}</CardTitle>
                <Tags className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalCategories}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('categories.stats.expense')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{expenseCategories.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('categories.stats.income')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{incomeCategories.length}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expense Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('categories.expenseSection')}</span>
                <Button size="sm" variant="outline" onClick={() => handleAddNew('expense')}>
                  <Plus className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenseCategories.length === 0 ? (
                <EmptyState
                  title={t('categories.noExpenseCategories')}
                  description={t('categories.noExpenseCategoriesDesc')}
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
                <span>{t('categories.incomeSection')}</span>
                <Button size="sm" variant="outline" onClick={() => handleAddNew('income')}>
                  <Plus className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomeCategories.length === 0 ? (
                <EmptyState
                  title={t('categories.noIncomeCategories')}
                  description={t('categories.noIncomeCategoriesDesc')}
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
      <CategoryDialog
        category={selectedCategory}
        type={formType}
        open={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedCategory(null); }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.deleteTitle', { entity: 'category' })}</AlertDialogTitle>
            <AlertDialogDescription>{t('common.confirmDelete', { entity: 'category' })}</AlertDialogDescription>
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

function CategoryRow({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div>
        <div className="font-medium">{category.name}</div>
        {category.description && (
          <div className="text-sm text-muted-foreground">{category.description}</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded text-xs ${category.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
          {category.isActive ? t('categories.active') : t('categories.inactive')}
        </span>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function CategoryDialog({
  category,
  type,
  open,
  onClose,
}: {
  category: Category | null;
  type: 'expense' | 'income';
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { create, update } = useCategoryMutations();
  const { control, handleSubmit, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      type: category?.type || type,
      description: category?.description || '',
    },
  });

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (category) {
        await update.mutateAsync({ id: category.id, data });
        toast.success(t('categories.toast.updated'));
      } else {
        await create.mutateAsync(data);
        toast.success(t('categories.toast.created'));
      }
      onClose();
    } catch {
      toast.error(category ? t('categories.toast.updateFailed') : t('categories.toast.createFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? t('categories.form.titleEdit') : t('categories.form.titleCreate')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>{t('categories.form.type')}</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!!category}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">{t('categories.form.typeExpense')}</SelectItem>
                    <SelectItem value="income">{t('categories.form.typeIncome')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
            )}
          </div>
          <FormField
            label={t('categories.form.name')}
            name="name"
            control={control}
            errors={errors}
            required
            placeholder={t('categories.form.namePlaceholder')}
          />
          <FormField
            label={t('categories.form.description')}
            name="description"
            control={control}
            errors={errors}
            placeholder={t('categories.form.descriptionPlaceholder')}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? t('saving') : category ? t('update') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
