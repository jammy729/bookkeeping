import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { ExpensesChart } from '../components/dashboard/ExpensesChart';
import { CategoryBreakdown } from '../components/dashboard/CategoryBreakdown';
import { toast } from 'sonner';

interface DashboardSummary {
  totalExpenses: number;
  totalIncome: number;
  ownerDistributions: number;
  netProfit: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface IncomeByClient {
  clientName: string;
  total: number;
  count: number;
}

interface RecentTransaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category?: string;
  clientName?: string;
}

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [incomeByClient, setIncomeByClient] = useState<IncomeByClient[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const now = new Date();
  const [fromYear, setFromYear] = useState(now.getFullYear());
  const [fromMonth, setFromMonth] = useState(0);
  const [toYear, setToYear] = useState(now.getFullYear());
  const [toMonth, setToMonth] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [fromYear, fromMonth, toYear, toMonth]);

  const getDateRange = () => {
    let startDate: Date;
    let endDate: Date;

    if (fromMonth === 0) {
      startDate = new Date(fromYear, 0, 1);
    } else {
      startDate = new Date(fromYear, fromMonth - 1, 1);
    }

    if (toMonth === 0) {
      endDate = new Date(toYear, 11, 31);
    } else {
      endDate = new Date(toYear, toMonth, 0);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();

      const [expensesRes, incomeRes, categoryBreakdown] = await Promise.all([
        api.get(`/expenses/summary/total?startDate=${startDate}&endDate=${endDate}`),
        api.get(`/income/summary/total?startDate=${startDate}&endDate=${endDate}`),
        api.get(`/expenses/summary/by-category?startDate=${startDate}&endDate=${endDate}`),
      ]);

      const totalExpenses = expensesRes.data || 0;
      const totalIncome = incomeRes.data || 0;
      
      // Extract owner distributions from category breakdown
      const categories = categoryBreakdown.data || [];
      const ownerDistCategory = categories.find((c: { categoryName: string }) => c.categoryName === 'Owner Distribution');
      const ownerDistributions = ownerDistCategory?.total || 0;
      
      // Net Profit = Income - All Expenses (including owner distributions)
      setSummary({
        totalExpenses,
        totalIncome,
        ownerDistributions,
        netProfit: totalIncome - totalExpenses,
      });

      // Transform category data for pie chart
      const catData = categories.map((item: { categoryName: string; total: number }) => ({
        name: item.categoryName || 'Uncategorized',
        value: item.total,
      }));
      setCategoryData(catData);

      await fetchMonthlyComparison(startDate, endDate);
      await fetchIncomeByClient(startDate, endDate);
      await fetchRecentTransactions();
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyComparison = async (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const months: MonthlyData[] = [];
      
      const current = new Date(start);
      while (current <= end) {
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        
        const effectiveStart = monthStart < start ? start : monthStart;
        const effectiveEnd = monthEnd > end ? end : monthEnd;
        
        const [incomeRes, expensesRes] = await Promise.all([
          api.get(`/income/summary/total?startDate=${effectiveStart.toISOString().split('T')[0]}&endDate=${effectiveEnd.toISOString().split('T')[0]}`),
          api.get(`/expenses/summary/total?startDate=${effectiveStart.toISOString().split('T')[0]}&endDate=${effectiveEnd.toISOString().split('T')[0]}`),
        ]);
        
        months.push({
          month: current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          income: incomeRes.data || 0,
          expenses: expensesRes.data || 0,
        });
        
        current.setMonth(current.getMonth() + 1);
      }
      
      setMonthlyData(months);
    } catch (error) {
      console.error('Failed to fetch monthly comparison:', error);
    }
  };

  const fetchIncomeByClient = async (startDate: string, endDate: string) => {
    try {
      const res = await api.get(`/income/summary/by-client?startDate=${startDate}&endDate=${endDate}`);
      setIncomeByClient(res.data || []);
    } catch (error) {
      console.error('Failed to fetch income by client:', error);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const [expensesRes, incomeRes] = await Promise.all([
        api.get('/expenses?limit=5'),
        api.get('/income?limit=5'),
      ]);

      const transactions: RecentTransaction[] = [
        ...(expensesRes.data?.data || expensesRes.data || []).map((e: any) => ({
          id: e.id,
          type: 'expense' as const,
          description: e.description,
          amount: e.amount,
          date: e.date,
          category: e.category?.name,
        })),
        ...(incomeRes.data?.data || incomeRes.data || []).map((i: any) => ({
          id: i.id,
          type: 'income' as const,
          description: i.description,
          amount: i.amount,
          date: i.date,
          clientName: i.clientName,
        })),
      ];

      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentTransactions(transactions.slice(0, 10));
    } catch (error) {
      console.error('Failed to fetch recent transactions:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {summary ? formatCurrency(summary.totalIncome) : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {summary ? formatCurrency(summary.totalExpenses) : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Owner Distributions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {summary ? formatCurrency(summary.ownerDistributions) : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${summary && summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary ? formatCurrency(summary.netProfit) : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ExpensesChart data={monthlyData.map(m => ({ month: m.month, amount: m.expenses }))} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <CategoryBreakdown data={categoryData} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Income by Client */}
      <Card>
        <CardHeader>
          <CardTitle>Income by Client</CardTitle>
        </CardHeader>
        <CardContent>
          {incomeByClient.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Client</th>
                    <th className="text-right py-3 px-4 font-semibold">Transactions</th>
                    <th className="text-right py-3 px-4 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeByClient.map((client) => (
                    <tr key={client.clientName} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{client.clientName || 'No Client'}</td>
                      <td className="py-3 px-4 text-right">{client.count}</td>
                      <td className="py-3 px-4 text-right text-green-600 font-semibold">
                        {formatCurrency(client.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No income data available</div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(transaction.date)}
                        {transaction.category && ` • ${transaction.category}`}
                        {transaction.clientName && ` • ${transaction.clientName}`}
                      </p>
                    </div>
                  </div>
                  <p className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No recent transactions</div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <a href="/expenses" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Add Expense
            </a>
            <a href="/income" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Add Income
            </a>
            <a href="/categories" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Manage Categories
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
