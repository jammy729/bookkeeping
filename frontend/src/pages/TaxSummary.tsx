import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Link } from 'react-router-dom';
import { AlertTriangle, Receipt, Calculator, TrendingUp, ArrowRight } from 'lucide-react';
import i18n from '../i18n';

interface TaxDeductibleExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
}

interface MissingReceipt {
  id: string;
  date: string;
  description: string;
  amount: number;
}

export function TaxSummary() {
  const { t } = useTranslation();
  const [year, setYear] = useState(new Date().getFullYear());
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data: totalIncome = 0, isLoading: loadingIncome } = useQuery({
    queryKey: ['tax', 'income', { startDate, endDate }],
    queryFn: async () => {
      const res = await api.get(`/income/summary/total?startDate=${startDate}&endDate=${endDate}`);
      return res.data as number;
    },
  });

  const { data: totalExpenses = 0, isLoading: loadingExpenses } = useQuery({
    queryKey: ['tax', 'expenses', { startDate, endDate }],
    queryFn: async () => {
      const res = await api.get(`/expenses/summary/total?startDate=${startDate}&endDate=${endDate}`);
      return res.data as number;
    },
  });

  const { data: expenseCategories = [] } = useQuery({
    queryKey: ['tax', 'by-category', { startDate, endDate }],
    queryFn: async () => {
      const res = await api.get(`/expenses/summary/by-category?startDate=${startDate}&endDate=${endDate}`);
      return res.data as { categoryName: string; total: number }[];
    },
  });

  const { data: taxDeductibleExpenses = [] } = useQuery({
    queryKey: ['tax', 'deductible', { startDate, endDate }],
    queryFn: async () => {
      const res = await api.get(`/expenses?startDate=${startDate}&endDate=${endDate}`);
      const expenses = res.data?.data || res.data || [];
      return expenses
        .filter((e: { isTaxDeductible?: boolean }) => e.isTaxDeductible)
        .map((e: TaxDeductibleExpense) => ({
          id: e.id,
          date: e.date,
          description: e.description,
          amount: e.amount,
          category: e.category,
        }));
    },
  });

  const { data: allExpenses = [] } = useQuery({
    queryKey: ['tax', 'all', { startDate, endDate }],
    queryFn: async () => {
      const res = await api.get(`/expenses?startDate=${startDate}&endDate=${endDate}`);
      return res.data?.data || res.data || [];
    },
  });

  const { data: incomeData = [] } = useQuery({
    queryKey: ['tax', 'income-details', { startDate, endDate }],
    queryFn: async () => {
      const res = await api.get(`/income?startDate=${startDate}&endDate=${endDate}`);
      return res.data?.data || res.data || [];
    },
  });

  const loading = loadingIncome || loadingExpenses;

  const hstCollected = incomeData
    .filter((i: { includesHst?: boolean }) => i.includesHst)
    .reduce((sum: number, i: { hstAmount?: number }) => sum + (i.hstAmount || 0), 0);

  const totalDeductible = taxDeductibleExpenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);

  const missingReceipts = allExpenses.filter(
    (e: { amount: number; attachments?: { id: string }[] }) => e.amount > 50 && (!e.attachments || e.attachments.length === 0)
  );

  const netProfit = totalIncome - totalExpenses;

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">{t('tax.title')}</h1>
        <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* HST Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('tax.hstCollected')}</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(hstCollected, i18n.language)}</p>
                  </div>
                  <div className="p-2 rounded-full bg-emerald-100">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('tax.totalDeductible')}</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalDeductible, i18n.language)}</p>
                  </div>
                  <div className="p-2 rounded-full bg-blue-100">
                    <Calculator className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('tax.netProfit')}</p>
                    <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(netProfit, i18n.language)}
                    </p>
                  </div>
                  <div className={`p-2 rounded-full ${netProfit >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    <Calculator className={`h-5 w-5 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('tax.missingReceipts')}</p>
                    <p className={`text-2xl font-bold ${missingReceipts.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {missingReceipts.length}
                    </p>
                  </div>
                  <div className={`p-2 rounded-full ${missingReceipts.length > 0 ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                    <Receipt className={`h-5 w-5 ${missingReceipts.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tax Deductible Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            {t('tax.deductibleExpenses', { year })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {taxDeductibleExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('tax.noDeductibleExpenses', { year })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm">{t('tax.table.date')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">{t('tax.table.description')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">{t('tax.table.category')}</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">{t('tax.table.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {taxDeductibleExpenses.map((expense: TaxDeductibleExpense) => (
                    <tr key={expense.id} className="border-b hover:bg-accent/50">
                      <td className="py-3 px-4 text-sm">{formatDate(expense.date, i18n.language)}</td>
                      <td className="py-3 px-4 text-sm font-medium">{expense.description}</td>
                      <td className="py-3 px-4">
                        {expense.category && (
                          <Badge variant="secondary" className="text-xs">{expense.category}</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-sm text-red-600">
                        {formatCurrency(expense.amount, i18n.language)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td colSpan={3} className="py-3 px-4 text-sm">{t('tax.totalDeductibleLabel')}</td>
                    <td className="py-3 px-4 text-right text-sm">{formatCurrency(totalDeductible, i18n.language)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Missing Receipts Alert */}
      {missingReceipts.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              {t('tax.missingReceiptsTitle', { count: missingReceipts.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t('tax.missingReceiptsDescription')}
            </p>
            <div className="space-y-2">
              {missingReceipts.slice(0, 5).map((expense: MissingReceipt) => (
                <div key={expense.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-amber-50">
                  <div>
                    <p className="text-sm font-medium">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(expense.date, i18n.language)}</p>
                  </div>
                  <span className="text-sm font-semibold text-amber-700">{formatCurrency(expense.amount, i18n.language)}</span>
                </div>
              ))}
            </div>
            {missingReceipts.length > 5 && (
              <Link to="/transactions">
                <Button variant="ghost" size="sm" className="mt-4 text-xs">
                  {t('tax.viewAllTransactions', { count: missingReceipts.length })}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Expense Breakdown by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('tax.expenseBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          {expenseCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t('tax.noData')}</div>
          ) : (
            <div className="space-y-3">
              {expenseCategories.map((item) => {
                const percentage = totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0;
                return (
                  <div key={item.categoryName} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.categoryName || t('uncategorized')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                        <span className="font-medium">{formatCurrency(item.total, i18n.language)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
