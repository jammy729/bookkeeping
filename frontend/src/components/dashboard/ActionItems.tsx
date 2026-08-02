import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Link } from 'react-router-dom';
import { AlertCircle, Receipt, TrendingDown, ArrowRight } from 'lucide-react';

interface ActionItem {
  id: string;
  type: 'uncategorized' | 'receipt_pending' | 'budget_alert';
  title: string;
  description: string;
  link: string;
  count: number;
}

export function ActionItems() {
  const { t } = useTranslation();
  const { data: expenses = [] } = useQuery({
    queryKey: ['action-items', 'uncategorized'],
    queryFn: async () => {
      const res = await api.get('/expenses?limit=100');
      return res.data?.data || res.data || [];
    },
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['action-items', 'budgets'],
    queryFn: async () => {
      const res = await api.get('/budgets');
      return res.data?.data || res.data || [];
    },
  });

  const uncategorizedCount = expenses.filter(
    (e: { categoryId?: string }) => !e.categoryId
  ).length;

  const alertBudgets = budgets.filter(
    (b: { amount: number; spent?: number }) => b.spent && b.amount > 0 && (b.spent / b.amount) >= 0.8
  ).length;

  const items: ActionItem[] = [];

  if (uncategorizedCount > 0) {
    items.push({
      id: 'uncategorized',
      type: 'uncategorized',
      title: t('dashboard.uncategorizedTransactions', { count: uncategorizedCount }),
      description: t('dashboard.uncategorizedDescription'),
      link: '/transactions',
      count: uncategorizedCount,
    });
  }

  if (alertBudgets > 0) {
    items.push({
      id: 'budget-alerts',
      type: 'budget_alert',
      title: t('dashboard.budgetsNearLimit', { count: alertBudgets }),
      description: t('dashboard.budgetsNearLimitDescription'),
      link: '/budgets',
      count: alertBudgets,
    });
  }

  if (items.length === 0) return null;

  const getIcon = (type: ActionItem['type']) => {
    switch (type) {
      case 'uncategorized':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'receipt_pending':
        return <Receipt className="h-4 w-4 text-blue-500" />;
      case 'budget_alert':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {t('dashboard.actionItems')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.link}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              {getIcon(item.type)}
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{item.count}</Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
