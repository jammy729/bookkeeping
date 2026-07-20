import { Card, CardContent } from './ui/card';

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

const MONTHS = [
  { value: 0, label: 'All Months' },
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

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
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
            <div className="flex gap-2">
              <select
                value={fromYear}
                onChange={(e) => onFromYearChange(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                value={fromMonth}
                onChange={(e) => onFromMonthChange(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <div className="flex gap-2">
              <select
                value={toYear}
                onChange={(e) => onToYearChange(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                value={toMonth}
                onChange={(e) => onToMonthChange(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
