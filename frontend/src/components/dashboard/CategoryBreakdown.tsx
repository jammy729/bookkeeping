import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency, hslVar } from '../../lib/utils';

interface CategoryBreakdownProps {
  data: { name: string; value: number }[];
}

const PIE_COLORS = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'];

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        {t('emptyState.noData')}
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={hslVar(`--${PIE_COLORS[index % PIE_COLORS.length]}`)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), t('chart.amount')]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
