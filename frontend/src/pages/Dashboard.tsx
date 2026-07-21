import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { ExpensesChart } from '../components/dashboard/ExpensesChart';
import { CategoryBreakdown } from '../components/dashboard/CategoryBreakdown';
import { useDateRange } from '../hooks/useDateRange';
import { useExpenseTotal, useExpenseByCategory } from '../hooks/useExpenses';
import { useIncomeTotal, useIncomeByClient } from '../hooks/useIncome';

interface CategoryData {
  name: string;
  value: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
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
  const {
    fromYear, setFromYear,
    fromMonth, setFromMonth,
    toYear, setToYear,
    toMonth, setToMonth,
    dateRange,
  } = useDateRange();

  const { startDate, endDate } = dateRange;

  const { data: totalExpenses = 0, isLoading: loadingExpenses } = useExpenseTotal(startDate, endDate);
  const { data: totalIncome = 0, isLoading: loadingIncome } = useIncomeTotal(startDate, endDate);
  const { data: expenseCategories = [] } = useExpenseByCategory(startDate, endDate);
  const { data: incomeByClient = [] } = useIncomeByClient(startDate, endDate);

  const loading = loadingExpenses || loadingIncome;

  // Monthly comparison - uses a single query instead of N+1
  const { data: monthlyData = [] } = useQuery<MonthlyData[]>({
    queryKey: ['dashboard', 'monthly', { startDate, endDate }],
    queryFn: async () => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const months: MonthlyData[] = [];
      
      // Build all month ranges first
      const monthRanges: { label: string; start: string; end: string }[] = [];
      const current = new Date(start);
      while (current <= end) {
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        
        const effectiveStart = monthStart < start ? start : monthStart;
        const effectiveEnd = monthEnd > end ? end : monthEnd;
        
        monthRanges.push({
          label: current.toLocaleDateString('en-US', { month: 'short' }),
          start: effectiveStart.toISOString().split('T')[0],
          end: effectiveEnd.toISOString().split('T')[0],
        });
        
        current.setMonth(current.getMonth() + 1);
      }

      // Fetch all months in parallel
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

      months.push(...results);
      return months;
    },
    enabled: !loading,
  });

  // Recent transactions
  const { data: recentTransactions = [] } = useQuery<RecentTransaction[]>({
    queryKey: ['dashboard', 'recent-transactions'],
    queryFn: async () => {
      const [expensesRes, incomeRes] = await Promise.all([
        api.get('/expenses?limit=5'),
        api.get('/income?limit=5'),
      ]);

      interface ExpenseItem { id: string; description: string; amount: number; date: string; category?: { name: string } }
      interface IncomeItem { id: string; description: string; amount: number; date: string; clientName?: string }

      const transactions: RecentTransaction[] = [
        ...(expensesRes.data?.data || expensesRes.data || []).map((e: ExpenseItem) => ({
          id: e.id,
          type: 'expense' as const,
          description: e.description,
          amount: e.amount,
          date: e.date,
          category: e.category?.name,
        })),
        ...(incomeRes.data?.data || incomeRes.data || []).map((i: IncomeItem) => ({
          id: i.id,
          type: 'income' as const,
          description: i.description,
          amount: i.amount,
          date: i.date,
          clientName: i.clientName,
        })),
      ];

      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return transactions.slice(0, 10);
    },
  });

  // Derived data
  const ownerDistCategory = expenseCategories.find((c) => c.categoryName === 'Owner Distribution');
  const ownerDistributions = ownerDistCategory?.total || 0;
  const netProfit = totalIncome - totalExpenses;

  const categoryData: CategoryData[] = expenseCategories.map((item) => ({
    name: item.categoryName || 'Uncategorized',
    value: item.total,
  }));

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
              {formatCurrency(totalIncome)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Owner Distributions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(ownerDistributions)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
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
