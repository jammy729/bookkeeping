import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency, hslVar } from '../../lib/utils';

interface CashFlowChartProps {
  data: { month: string; income: number; expenses: number }[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        {t('emptyState.noData')}
      </div>
    );
  }

  const incomeColor = hslVar('--financial-positive');
  const expenseColor = hslVar('--financial-negative');

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={incomeColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={incomeColor} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={expenseColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={expenseColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
            tickFormatter={(value) => formatCurrency(value, i18n.language)}
          />
          <Tooltip
            formatter={(value, name) => [
              formatCurrency(Number(value), i18n.language),
              name === 'income' ? t('dashboard.chart.income') : t('dashboard.chart.expenses'),
            ]}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
          <Legend
            formatter={(value) => value === 'income' ? t('dashboard.chart.income') : t('dashboard.chart.expenses')}
            wrapperStyle={{ fontSize: '12px' }}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke={incomeColor}
            fill="url(#incomeGradient)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke={expenseColor}
            fill="url(#expenseGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
