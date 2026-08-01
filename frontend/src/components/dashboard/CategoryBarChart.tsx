import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { formatCurrency, hslVar } from '../../lib/utils';

interface CategoryBarChartProps {
  data: { name: string; value: number }[];
}

const BARS = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'];

export function CategoryBarChart({ data }: CategoryBarChartProps) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        {t('emptyState.noData')}
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-3">
      {data.slice(0, 8).map((item, index) => {
        const percentage = total > 0 ? (item.value / total) * 100 : 0;
        const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        const color = hslVar(`--${BARS[index % BARS.length]}`);

        return (
          <div key={item.name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium truncate">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                <span className="font-medium">{formatCurrency(item.value, i18n.language)}</span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${barWidth}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
