import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, TrendingUp, PiggyBank, Calculator, CalendarDays, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import EditableStat from "./editable-stat";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function QuickStats() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/expenses/analytics/stats", selectedYear, selectedMonth],
    queryFn: () => api.expenses.getStats(selectedYear, selectedMonth),
  });

  // Generate years from 2000 to current year + 5
  const years = Array.from({ length: currentYear - 2000 + 6 }, (_, i) => 2000 + i);
  
  // Month names
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

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

      <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 relative" data-testid="month-spending">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-secondary mb-1">Month</p>
              <div className="relative z-10">
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger className="w-28 h-7 text-xs border border-gray-200 bg-white rounded-md px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {months.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <div className="text-2xl font-bold text-text-primary">
          ₹{(stats?.monthTotal || 0).toFixed(0)}
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 relative" data-testid="year-spending">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-purple-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-secondary mb-1">Year</p>
              <div className="relative z-10">
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-20 h-7 text-xs border border-gray-200 bg-white rounded-md px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <div className="text-2xl font-bold text-text-primary">
          ₹{(stats?.yearTotal || 0).toFixed(0)}
        </div>
      </div>

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
