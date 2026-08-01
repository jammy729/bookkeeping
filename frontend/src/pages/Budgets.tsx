import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import i18n from '../i18n';
import { useBudgets, useBudgetMutations } from '../hooks/useBudgets';
import { useExpenseCategories } from '../hooks/useCategories';
import { type Budget } from '../services/budgets.service';
import { budgetSchema, type BudgetFormData } from '../lib/form-schemas';
import { formatCurrency } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { FormField } from '../components/ui/FormField';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '../components/ui/alert-dialog';
import { Pencil, Trash2, Plus, Wallet, TrendingDown, PiggyBank } from 'lucide-react';

export function Budgets() {
  const { t } = useTranslation();
  const { data: budgets = [], isLoading: loading } = useBudgets();
  const { data: categories = [] } = useExpenseCategories();
  const { remove: removeBudget } = useBudgetMutations();
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string } | null>(null);

  const handleDelete = (id: string) => {
    setDeleteTarget({ id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await removeBudget.mutateAsync(deleteTarget.id);
      toast.success(t('budgets.toast.deleted'));
      setDeleteTarget(null);
    } catch {
      toast.error(t('budgets.toast.deleteFailed'));
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

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('budgets.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('budgets.description')}</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          {t('budgets.addBudget')}
        </Button>
      </div>

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
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('budgets.stats.total')}</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(totalBudgeted, i18n.language)}</p>
                <p className="text-xs text-muted-foreground">{budgets.length} {t('budgets.stats.budgets')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('budgets.stats.spent')}</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent, i18n.language)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('budgets.stats.remaining')}</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${totalBudgeted - totalSpent < 0 ? 'text-destructive' : ''}`}>
                  {formatCurrency(totalBudgeted - totalSpent, i18n.language)}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('budgets.list')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : budgets.length === 0 ? (
            <EmptyState
              title={t('budgets.noBudgets')}
              description={t('budgets.noBudgetsDesc')}
              action={
                <Button onClick={handleAddNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('budgets.addBudget')}
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">{t('budgets.table.name')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('budgets.table.category')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('budgets.table.period')}</th>
                    <th className="text-right py-3 px-4 font-semibold">{t('budgets.table.budgeted')}</th>
                    <th className="text-right py-3 px-4 font-semibold">{t('budgets.table.spent')}</th>
                    <th className="text-right py-3 px-4 font-semibold">{t('budgets.table.remaining')}</th>
                    <th className="text-center py-3 px-4 font-semibold">{t('budgets.table.progress')}</th>
                    <th className="text-right py-3 px-4 font-semibold">{t('budgets.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((budget) => {
                    const remaining = budget.amount - budget.spent;
                    const percentUsed = budget.amount > 0 ? Math.min((budget.spent / budget.amount) * 100, 100) : 0;
                    const isOver = budget.spent > budget.amount;
                    return (
                      <tr key={budget.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium">{budget.name || '-'}</div>
                        </td>
                        <td className="py-3 px-4">
                          {budget.category ? (
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                              {budget.category.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-muted rounded text-sm capitalize">
                            {t(`budgets.periods.${budget.period}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(budget.amount, i18n.language)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {formatCurrency(budget.spent, i18n.language)}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${isOver ? 'text-destructive' : 'text-green-600'}`}>
                          {isOver ? `-${formatCurrency(Math.abs(remaining), i18n.language)}` : formatCurrency(remaining, i18n.language)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isOver ? 'bg-destructive' : percentUsed > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(percentUsed, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs w-10 text-right ${isOver ? 'text-destructive' : ''}`}>
                              {percentUsed.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(budget)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(budget.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <BudgetDialog
        budget={selectedBudget}
        categories={categories}
        open={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedBudget(null); }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.deleteTitle', { entity: 'budget' })}</AlertDialogTitle>
            <AlertDialogDescription>{t('common.confirmDelete', { entity: 'budget' })}</AlertDialogDescription>
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

function BudgetDialog({
  budget,
  categories,
  open,
  onClose,
}: {
  budget: Budget | null;
  categories: { id: string; name: string }[];
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { create, update } = useBudgetMutations();
  const { control, handleSubmit, formState: { errors } } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: budget
      ? {
          name: budget.name || '',
          amount: budget.amount,
          period: budget.period as BudgetFormData['period'],
          startDate: budget.startDate,
          endDate: budget.endDate,
          categoryId: budget.categoryId || '',
        }
      : (() => {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          return {
            name: '',
            amount: 0,
            period: 'monthly' as const,
            startDate: startOfMonth.toISOString().split('T')[0],
            endDate: endOfMonth.toISOString().split('T')[0],
            categoryId: '',
          };
        })(),
  });

  const onSubmit = async (data: BudgetFormData) => {
    try {
      const payload = { ...data, categoryId: data.categoryId || undefined };
      if (budget) {
        await update.mutateAsync({ id: budget.id, data: payload });
        toast.success(t('budgets.toast.updated'));
      } else {
        await create.mutateAsync(payload);
        toast.success(t('budgets.toast.created'));
      }
      onClose();
    } catch {
      toast.error(budget ? t('budgets.toast.updateFailed') : t('budgets.toast.createFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{budget ? t('budgets.form.titleEdit') : t('budgets.form.titleCreate')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label={t('budgets.form.name')}
            name="name"
            control={control}
            errors={errors}
            placeholder={t('budgets.form.namePlaceholder')}
          />
          <CurrencyInput
            label={t('budgets.form.amount')}
            name="amount"
            control={control}
            errors={errors}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t('budgets.form.startDate')}
              name="startDate"
              control={control}
              errors={errors}
              type="date"
              required
            />
            <FormField
              label={t('budgets.form.endDate')}
              name="endDate"
              control={control}
              errors={errors}
              type="date"
              required
            />
          </div>
          <div>
            <Label>{t('budgets.form.period')}</Label>
            <Controller
              name="period"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t('budgets.periods.daily')}</SelectItem>
                    <SelectItem value="weekly">{t('budgets.periods.weekly')}</SelectItem>
                    <SelectItem value="monthly">{t('budgets.periods.monthly')}</SelectItem>
                    <SelectItem value="quarterly">{t('budgets.periods.quarterly')}</SelectItem>
                    <SelectItem value="yearly">{t('budgets.periods.yearly')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.period && (
              <p className="text-sm text-destructive mt-1">{errors.period.message}</p>
            )}
          </div>
          <div>
            <Label>{t('budgets.form.category')}</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select value={field.value || 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('budgets.form.noCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('budgets.form.noCategory')}</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? t('saving') : budget ? t('update') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
