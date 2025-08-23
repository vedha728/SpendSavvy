import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { api } from "@/lib/api";
import { categories } from "@shared/schema";

const COLORS = ['#F59E0B', '#2563EB', '#10B981', '#8B5CF6', '#6B7280', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];

export default function ExpenseCharts() {
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["/api/expenses"],
    queryFn: () => api.expenses.getAll(),
  });

  if (isLoading) {
    return (
      <div className="bg-surface rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-text-primary">Spending Overview</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare category data for pie chart
  const categoryData = categories.map(category => {
    const categoryExpenses = expenses.filter(expense => expense.category === category.value);
    const total = categoryExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    return {
      name: category.label.split(' ')[1] || category.value,
      value: total,
      percentage: total > 0 ? ((total / expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)) * 100).toFixed(1) : '0',
    };
  }).filter(item => item.value > 0);

  // Prepare daily trend data for line chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const trendData = last7Days.map(date => {
    const dayExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.toDateString() === date.toDateString();
    });
    const total = dayExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    return {
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      value: total,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`${label}: ₹${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`${data.name}: ₹${data.value} (${data.percentage}%)`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Spending Overview</h2>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 bg-primary text-white rounded-md text-sm">Weekly</button>
            <button className="px-3 py-1 text-text-secondary rounded-md text-sm hover:bg-gray-100 transition-colors">Monthly</button>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Pie Chart */}
          <div className="h-64" data-testid="chart-category">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Category Breakdown</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-secondary">
                No expenses to display
              </div>
            )}
          </div>

          {/* Daily Trend Line Chart */}
          <div className="h-64" data-testid="chart-trend">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Daily Spending Trend</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563EB" 
                  strokeWidth={2}
                  dot={{ fill: "#2563EB", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
