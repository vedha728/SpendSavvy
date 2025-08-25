import { useQuery } from "@tanstack/react-query";
import { Calendar, TrendingUp, PiggyBank, Calculator, CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import EditableStat from "./editable-stat";

export default function QuickStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/expenses/analytics/stats"],
    queryFn: () => api.expenses.getStats(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
      <EditableStat
        label="Today's Spending"
        value={stats?.todayTotal || 0}
        icon={<Calendar className="h-6 w-6 text-red-500" />}
        colorClass="bg-red-50"
        onUpdate={api.stats.setTodayTotal}
        testId="today-spending"
      />

      <EditableStat
        label="This Month"
        value={stats?.monthTotal || 0}
        icon={<TrendingUp className="h-6 w-6 text-blue-500" />}
        colorClass="bg-blue-50"
        onUpdate={api.stats.setMonthTotal}
        testId="month-spending"
      />

      <EditableStat
        label="This Year"
        value={stats?.yearTotal || 0}
        icon={<CalendarDays className="h-6 w-6 text-purple-500" />}
        colorClass="bg-purple-50"
        onUpdate={async () => {}}
        testId="year-spending"
      />

      <EditableStat
        label="Budget Left"
        value={stats?.budgetLeft || 0}
        icon={<PiggyBank className="h-6 w-6 text-green-500" />}
        colorClass="bg-green-50"
        onUpdate={(amount) => api.stats.setBudget(amount + (stats?.monthTotal || 0))}
        testId="budget-left"
      />

      <EditableStat
        label="Avg Daily"
        value={stats?.avgDaily || 0}
        icon={<Calculator className="h-6 w-6 text-yellow-500" />}
        colorClass="bg-yellow-50"
        onUpdate={api.stats.setAvgDaily}
        testId="avg-daily"
      />
    </div>
  );
}
