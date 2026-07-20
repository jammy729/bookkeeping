import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
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

  // Monthly comparison - parallel fetch instead of N+1
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
          label: current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
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

  // Derived data
  const ownerDistCategory = expenseCategories.find((c) => c.categoryName === 'Owner Distribution');
  const ownerDistributions = ownerDistCategory?.total || 0;
  const netIncome = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0;

  const formatTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const expensesByCategory = expenseCategories
    .filter((item) => item.categoryName !== 'Owner Distribution')
    .map((item) => ({
      category: item.categoryName || 'Uncategorized',
      amount: item.total,
      percentage: totalExpenses > 0 ? ((item.total / totalExpenses) * 100).toFixed(1) : 0,
    }));

  const formattedIncomeByType = incomeByType.map((item) => ({
    type: formatTypeLabel(item.type),
    amount: item.total,
    percentage: totalIncome > 0 ? ((item.total / totalIncome) * 100).toFixed(1) : 0,
  }));

  const getReportTitle = () => {
    if (reportType === 'monthly') return 'Monthly Financial Report';
    if (reportType === 'yearly') return 'Annual Financial Report';
    return 'Custom Period Report';
  };

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const csvRows = [
      ['Financial Report', reportData.title],
      ['Period', reportData.period],
      [],
      ['Summary'],
      ['Total Income', reportData.totalIncome.toFixed(2)],
      ['Total Expenses', reportData.totalExpenses.toFixed(2)],
      ['Owner Distributions', reportData.ownerDistributions.toFixed(2)],
      ['Net Income', reportData.netIncome.toFixed(2)],
      ['Profit Margin', `${reportData.profitMargin.toFixed(1)}%`],
      [],
      ['Expenses by Category'],
      ['Category', 'Amount', 'Percentage'],
      ...reportData.expensesByCategory.map(e => [e.category, e.amount.toFixed(2), `${e.percentage}%`]),
      [],
      ['Income by Type'],
      ['Type', 'Amount', 'Percentage'],
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
    toast.success('Report exported successfully');
  };

  if (loading) {
    return <div className="text-center py-8">Generating report...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <Button onClick={exportToCSV} disabled={!reportData}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Report Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'monthly' | 'yearly' | 'custom')}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Period</option>
              </select>
            </div>
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

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-green-600">{formatCurrency(reportData.totalIncome)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-red-600">{formatCurrency(reportData.totalExpenses)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Owner Distributions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(reportData.ownerDistributions)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Net Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-xl font-bold ${reportData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(reportData.netIncome)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Profit Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-xl font-bold ${reportData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                  Expenses by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.expensesByCategory.length === 0 ? (
                  <EmptyState title="No expense data" description="No expenses recorded for this period" />
                ) : (
                  <div className="space-y-3">
                    {reportData.expensesByCategory.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{item.category}</span>
                            <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{item.percentage}%</span>
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
                  Income by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.incomeByType.length === 0 ? (
                  <EmptyState title="No income data" description="No income recorded for this period" />
                ) : (
                  <div className="space-y-3">
                    {reportData.incomeByType.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{item.type}</span>
                            <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{item.percentage}%</span>
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
                Monthly Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Month</th>
                      <th className="text-right py-3 px-4 font-semibold">Income</th>
                      <th className="text-right py-3 px-4 font-semibold">Expenses</th>
                      <th className="text-right py-3 px-4 font-semibold">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.monthlyData.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{item.month}</td>
                        <td className="py-3 px-4 text-right text-green-600">{formatCurrency(item.income)}</td>
                        <td className="py-3 px-4 text-right text-red-600">{formatCurrency(item.expenses)}</td>
                        <td className={`py-3 px-4 text-right font-medium ${item.income - item.expenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(item.income - item.expenses)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
