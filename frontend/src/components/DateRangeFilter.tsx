import { useTranslation } from 'react-i18next';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface DateRangeFilterProps {
  fromYear: number;
  fromMonth: number;
  toYear: number;
  toMonth: number;
  onFromYearChange: (year: number) => void;
  onFromMonthChange: (month: number) => void;
  onToYearChange: (year: number) => void;
  onToMonthChange: (month: number) => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 5 + i);

export function DateRangeFilter({
  fromYear,
  fromMonth,
  toYear,
  toMonth,
  onFromYearChange,
  onFromMonthChange,
  onToYearChange,
  onToMonthChange,
}: DateRangeFilterProps) {
  const { t } = useTranslation();

  const MONTHS = [
    { value: 0, label: t('all') },
    { value: 1, label: t('months.january') },
    { value: 2, label: t('months.february') },
    { value: 3, label: t('months.march') },
    { value: 4, label: t('months.april') },
    { value: 5, label: t('months.may') },
    { value: 6, label: t('months.june') },
    { value: 7, label: t('months.july') },
    { value: 8, label: t('months.august') },
    { value: 9, label: t('months.september') },
    { value: 10, label: t('months.october') },
    { value: 11, label: t('months.november') },
    { value: 12, label: t('months.december') },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t('from')}</label>
            <div className="flex gap-2">
              <Select value={String(fromYear)} onValueChange={(v) => onFromYearChange(parseInt(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(fromMonth)} onValueChange={(v) => onFromMonthChange(parseInt(v))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={String(month.value)}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">{t('to')}</label>
            <div className="flex gap-2">
              <Select value={String(toYear)} onValueChange={(v) => onToYearChange(parseInt(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(toMonth)} onValueChange={(v) => onToMonthChange(parseInt(v))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={String(month.value)}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
