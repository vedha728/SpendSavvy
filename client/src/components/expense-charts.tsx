import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { api } from "@/lib/api";
import { categories } from "@shared/types";

// Professional color palette with gradients
const COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', 
  '#ef4444', '#ec4899', '#84cc16', '#64748b'
];

const GRADIENT_COLORS = [
  { start: '#6366f1', end: '#8b5cf6' },
  { start: '#8b5cf6', end: '#d946ef' },
  { start: '#06b6d4', end: '#0891b2' },
  { start: '#10b981', end: '#059669' },
  { start: '#f59e0b', end: '#d97706' },
  { start: '#ef4444', end: '#dc2626' },
  { start: '#ec4899', end: '#be185d' },
  { start: '#84cc16', end: '#65a30d' },
  { start: '#64748b', end: '#475569' }
];

export default function ExpenseCharts() {
  const [viewMode, setViewMode] = useState<"weekly" | "monthly">("weekly");
  
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

  // Prepare trend data for line chart based on view mode
  const getTrendData = () => {
    if (viewMode === "weekly") {
      // Last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date;
      });

      return last7Days.map(date => {
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
    } else {
      // Last 30 days grouped by date
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date;
      });

      return last30Days.map(date => {
        const dayExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.toDateString() === date.toDateString();
        });
        const total = dayExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
        return {
          name: date.getDate().toString(),
          value: total,
        };
      });
    }
  };

  const trendData = getTrendData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border border-gray-200 rounded-xl shadow-2xl ring-1 ring-black/5">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: payload[0].color }}
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-lg font-bold text-indigo-600">₹{payload[0].value.toLocaleString()}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border border-gray-200 rounded-xl shadow-2xl ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: payload[0].color }}
            />
            <div>
              <p className="text-sm font-medium text-gray-600">{data.name}</p>
              <p className="text-lg font-bold text-gray-900">₹{data.value.toLocaleString()}</p>
              <p className="text-sm text-indigo-600 font-semibold">{data.percentage}% of total</p>
            </div>
          </div>
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
            <button 
              onClick={() => setViewMode("weekly")}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                viewMode === "weekly" 
                  ? "bg-primary text-white" 
                  : "text-text-secondary hover:bg-gray-100"
              }`}
              data-testid="button-weekly-view"
            >
              Weekly
            </button>
            <button 
              onClick={() => setViewMode("monthly")}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                viewMode === "monthly" 
                  ? "bg-primary text-white" 
                  : "text-text-secondary hover:bg-gray-100"
              }`}
              data-testid="button-monthly-view"
            >
              Monthly
            </button>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Category Pie Chart */}
          <div className="h-80" data-testid="chart-category">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <div className="w-2 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
              Category Breakdown
            </h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {GRADIENT_COLORS.map((color, index) => (
                      <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={color.start} />
                        <stop offset="100%" stopColor={color.end} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#gradient-${index % GRADIENT_COLORS.length})`}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ 
                      paddingTop: '20px', 
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <div className="w-8 h-8 border-2 border-gray-300 border-dashed rounded-full"></div>
                </div>
                <p className="text-sm font-medium">No expenses to display</p>
                <p className="text-xs text-gray-400 mt-1">Start tracking your expenses to see insights</p>
              </div>
            )}
          </div>

          {/* Daily Trend Area Chart */}
          <div className="h-80" data-testid="chart-trend">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-cyan-600 rounded-full"></div>
              {viewMode === "weekly" ? "Weekly Spending Trend" : "Monthly Spending Trend"}
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0" 
                  strokeOpacity={0.5}
                />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b"
                  fontSize={12}
                  fontWeight={500}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  fontWeight={500}
                  tickFormatter={(value) => `₹${value}`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fill="url(#colorSpending)"
                  dot={{ fill: "#6366f1", strokeWidth: 2, r: 5, fillOpacity: 1 }}
                  activeDot={{ r: 7, stroke: "#6366f1", strokeWidth: 2, fill: "#ffffff" }}
                  animationDuration={1000}
                  animationBegin={200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
