import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ExpensesChartProps {
  data: { month: string; amount: number }[];
}

export function ExpensesChart({ data }: ExpensesChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip 
            formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Expenses']}
          />
          <Bar dataKey="amount" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
