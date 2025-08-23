import { useQuery } from "@tanstack/react-query";
import { Calendar, TrendingUp, PiggyBank, Calculator } from "lucide-react";
import { api } from "@/lib/api";

export default function QuickStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/expenses/analytics/stats"],
    queryFn: () => api.expenses.getStats(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const todayChange = stats ? ((stats.todayTotal / (stats.avgDaily || 1)) - 1) * 100 : 0;
  const monthChange = stats ? ((stats.monthTotal / (stats.monthlyBudget * 0.8)) - 1) * 100 : 0;
  const budgetPercentage = stats ? (stats.budgetLeft / stats.monthlyBudget) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100" data-testid="card-today-spending">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm font-medium">Today's Spending</p>
            <p className="text-2xl font-bold text-text-primary" data-testid="text-today-total">
              ₹{stats?.todayTotal.toFixed(0) || '0'}
            </p>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
            <Calendar className="h-6 w-6 text-red-500" />
          </div>
        </div>
        <div className="mt-3 flex items-center text-sm">
          <span className={`font-medium ${todayChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
            {todayChange >= 0 ? '+' : ''}{todayChange.toFixed(0)}%
          </span>
          <span className="text-text-secondary ml-1">vs average</span>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100" data-testid="card-month-spending">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm font-medium">This Month</p>
            <p className="text-2xl font-bold text-text-primary" data-testid="text-month-total">
              ₹{stats?.monthTotal.toFixed(0) || '0'}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-blue-500" />
          </div>
        </div>
        <div className="mt-3 flex items-center text-sm">
          <span className={`font-medium ${monthChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
            {monthChange >= 0 ? '+' : ''}{monthChange.toFixed(0)}%
          </span>
          <span className="text-text-secondary ml-1">of budget used</span>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100" data-testid="card-budget-left">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm font-medium">Budget Left</p>
            <p className="text-2xl font-bold text-text-primary" data-testid="text-budget-left">
              ₹{stats?.budgetLeft.toFixed(0) || '0'}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
            <PiggyBank className="h-6 w-6 text-green-500" />
          </div>
        </div>
        <div className="mt-3 flex items-center text-sm">
          <span className="text-green-500 font-medium">{budgetPercentage.toFixed(0)}%</span>
          <span className="text-text-secondary ml-1">remaining</span>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100" data-testid="card-avg-daily">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm font-medium">Avg Daily</p>
            <p className="text-2xl font-bold text-text-primary" data-testid="text-avg-daily">
              ₹{stats?.avgDaily.toFixed(0) || '0'}
            </p>
          </div>
          <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
            <Calculator className="h-6 w-6 text-yellow-500" />
          </div>
        </div>
        <div className="mt-3 flex items-center text-sm">
          <span className="text-text-secondary">Based on 30 days</span>
        </div>
      </div>
    </div>
  );
}
