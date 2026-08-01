import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from 'sonner';
import { Download, FileText, TrendingUp, PieChart } from 'lucide-react';

interface ReportData {
  title: string;
  period: string;
  totalIncome: number;
  totalExpenses: number;
  ownerDistributions: number;
  netIncome: number;
  profitMargin: number;
  expensesByCategory: { category: string; amount: number; percentage: number | string }[];
  incomeByType: { type: string; amount: number; percentage: number | string }[];
  monthlyData: { month: string; income: number; expenses: number }[];
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export function Reports() {
  const { t } = useTranslation();
  const [reportType, setReportType] = useState<'monthly' | 'yearly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: totalExpenses = 0, isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses', 'total', { startDate, endDate }],
    queryFn: async () => {
      const res = await api.get(`/expenses/summary/total?startDate=${startDate}&endDate=${endDate}`);
      return res.data as number;
    },
  });

  const { data: totalIncome = 0, isLoading: loadingIncome } = useQuery({
    queryKey: ['income', 'total', { startDate, endDate }],
    queryFn: async () => {
      const res = await api.get(`/income/summary/total?startDate=${startDate}&endDate=${endDate}`);
      return res.data as number;
    },
  });

  const { data: expenseCategories = [] } = useQuery({
    queryKey: ['expenses', 'by-category', { startDate, endDate }],
    queryFn: async () => {
      const res = await api.get(`/expenses/summary/by-category?startDate=${startDate}&endDate=${endDate}`);
      return res.data as { categoryName: string; total: number }[];
    },
  });

  const { data: incomeByType = [] } = useQuery({
    queryKey: ['income', 'by-type', { startDate, endDate }],
    queryFn: async () => {
      const res = await api.get(`/income/summary/by-type?startDate=${startDate}&endDate=${endDate}`);
      return res.data as { type: string; total: number }[];
    },
  });

  const loading = loadingExpenses || loadingIncome;

  const { data: monthlyData = [] } = useQuery<MonthlyData[]>({
    queryKey: ['reports', 'monthly', { startDate, endDate }],
    queryFn: async () => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const current = new Date(start);
      const monthRanges: { label: string; start: string; end: string }[] = [];

      while (current <= end) {
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        const effectiveStart = monthStart < start ? start : monthStart;
        const effectiveEnd = monthEnd > end ? end : monthEnd;

        monthRanges.push({
          label: current.toLocaleDateString(i18n.language, { month: 'short', year: '2-digit' }),
          start: effectiveStart.toISOString().split('T')[0],
          end: effectiveEnd.toISOString().split('T')[0],
        });

        current.setMonth(current.getMonth() + 1);
      }

      const results = await Promise.all(
        monthRanges.map(async (range) => {
          const [incomeRes, expensesRes] = await Promise.all([
            api.get(`/income/summary/total?startDate=${range.start}&endDate=${range.end}`),
            api.get(`/expenses/summary/total?startDate=${range.start}&endDate=${range.end}`),
          ]);
          return {
            month: range.label,
            income: incomeRes.data || 0,
            expenses: expensesRes.data || 0,
          };
        })
      );

      return results;
    },
    enabled: !loading,
  });

  const formatTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const expensesByCategory = expenseCategories
    .filter((item) => item.categoryName !== t('reports.ownerDistribution'))
    .map((item) => ({
      category: item.categoryName || t('uncategorized'),
      amount: item.total,
      percentage: totalExpenses > 0 ? ((item.total / totalExpenses) * 100).toFixed(1) : 0,
    }));

  const formattedIncomeByType = incomeByType.map((item) => ({
    type: formatTypeLabel(item.type),
    amount: item.total,
    percentage: totalIncome > 0 ? ((item.total / totalIncome) * 100).toFixed(1) : 0,
  }));

  const getReportTitle = () => {
    if (reportType === 'monthly') return t('reports.reportTitles.monthly');
    if (reportType === 'yearly') return t('reports.reportTitles.yearly');
    return t('reports.reportTitles.custom');
  };

  const ownerDistCategory = expenseCategories.find((c) => c.categoryName === 'Owner Distribution');
  const ownerDistributions = ownerDistCategory?.total || 0;
  const netIncome = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0;

  const reportData: ReportData | null = loading ? null : {
    title: getReportTitle(),
    period: `${startDate} to ${endDate}`,
    totalIncome,
    totalExpenses,
    ownerDistributions,
    netIncome,
    profitMargin,
    expensesByCategory,
    incomeByType: formattedIncomeByType,
    monthlyData,
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const csvRows = [
      [t('reports.csvHeaders.financialReport'), reportData.title],
      [t('reports.csvHeaders.period'), reportData.period],
      [],
      [t('reports.csvHeaders.summary')],
      [t('reports.csvHeaders.totalIncome'), reportData.totalIncome.toFixed(2)],
      [t('reports.csvHeaders.totalExpenses'), reportData.totalExpenses.toFixed(2)],
      [t('reports.csvHeaders.ownerDistributions'), reportData.ownerDistributions.toFixed(2)],
      [t('reports.csvHeaders.netIncome'), reportData.netIncome.toFixed(2)],
      [t('reports.csvHeaders.profitMargin'), `${reportData.profitMargin.toFixed(1)}%`],
      [],
      [t('reports.csvHeaders.expensesByCategory')],
      [t('reports.csvHeaders.category'), t('reports.csvHeaders.amount'), t('reports.csvHeaders.percentage')],
      ...reportData.expensesByCategory.map(e => [e.category, e.amount.toFixed(2), `${e.percentage}%`]),
      [],
      [t('reports.csvHeaders.incomeByType')],
      [t('reports.csvHeaders.type'), t('reports.csvHeaders.amount'), t('reports.csvHeaders.percentage')],
      ...reportData.incomeByType.map(i => [i.type, i.amount.toFixed(2), `${i.percentage}%`]),
    ];

    const csv = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('reports.exportSuccess'));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('reports.description')}</p>
        </div>
        <Button onClick={exportToCSV} disabled={!reportData}>
          <Download className="w-4 h-4 mr-2" />
          {t('reports.exportCsv')}
        </Button>
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.settings.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label>{t('reports.settings.reportType')}</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as typeof reportType)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{t('reports.settings.types.monthly')}</SelectItem>
                  <SelectItem value="yearly">{t('reports.settings.types.yearly')}</SelectItem>
                  <SelectItem value="custom">{t('reports.settings.types.custom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="report-start">{t('from')}</Label>
              <Input
                id="report-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="report-end">{t('to')}</Label>
              <Input
                id="report-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.summary.totalIncome')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(reportData.totalIncome, i18n.language)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.summary.totalExpenses')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(reportData.totalExpenses, i18n.language)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.summary.ownerDistributions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{formatCurrency(reportData.ownerDistributions, i18n.language)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.summary.netIncome')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-xl font-bold ${reportData.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(reportData.netIncome, i18n.language)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('reports.summary.profitMargin')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-xl font-bold ${reportData.profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {reportData.profitMargin.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expenses by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  {t('reports.charts.expensesByCategory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.expensesByCategory.length === 0 ? (
                  <EmptyState title={t('reports.charts.noExpenseData')} description={t('reports.charts.noExpenseDataDesc')} />
                ) : (
                  <div className="space-y-3">
                    {reportData.expensesByCategory.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{item.category}</span>
                            <span className="text-sm font-medium">{formatCurrency(item.amount, i18n.language)}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Income by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {t('reports.charts.incomeByType')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.incomeByType.length === 0 ? (
                  <EmptyState title={t('reports.charts.noIncomeData')} description={t('reports.charts.noIncomeDataDesc')} />
                ) : (
                  <div className="space-y-3">
                    {reportData.incomeByType.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{item.type}</span>
                            <span className="text-sm font-medium">{formatCurrency(item.amount, i18n.language)}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-green-600 dark:bg-green-400 h-2 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('reports.charts.monthlyComparison')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.monthlyData.length === 0 ? (
                <EmptyState title={t('reports.charts.noMonthlyData')} description={t('reports.charts.noMonthlyDataDesc')} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">{t('reports.monthlyTable.month')}</th>
                        <th className="text-right py-3 px-4 font-semibold">{t('reports.monthlyTable.income')}</th>
                        <th className="text-right py-3 px-4 font-semibold">{t('reports.monthlyTable.expenses')}</th>
                        <th className="text-right py-3 px-4 font-semibold">{t('reports.monthlyTable.difference')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.monthlyData.map((item, index) => {
                        const diff = item.income - item.expenses;
                        return (
                          <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4 font-medium">{item.month}</td>
                            <td className="py-3 px-4 text-right text-green-600 dark:text-green-400">{formatCurrency(item.income, i18n.language)}</td>
                            <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">{formatCurrency(item.expenses, i18n.language)}</td>
                            <td className={`py-3 px-4 text-right font-medium ${diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatCurrency(diff, i18n.language)}
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
        </>
      )}
    </div>
  );
}
