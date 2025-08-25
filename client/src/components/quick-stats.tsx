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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card p-6 border border-gray-100/50 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded mb-2 w-20"></div>
                <div className="h-6 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
      <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl shadow-card p-6 border border-red-100/50 hover-lift animate-scale-up" data-testid="today-spending">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">Today's Spending</p>
              <div className="text-2xl font-bold text-red-900">
                ₹{(stats?.todayTotal || 0).toFixed(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl shadow-card p-6 border border-blue-100/50 hover-lift animate-scale-up" data-testid="month-spending" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-blue-700 mb-2">Month</p>
              <div className="relative z-10">
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger className="w-32 h-8 text-xs border border-blue-200 bg-white/80 backdrop-blur-sm rounded-lg px-3 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-white/95 backdrop-blur-sm">
                    {months.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <div className="text-2xl font-bold text-blue-900">
          ₹{(stats?.monthTotal || 0).toFixed(0)}
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl shadow-card p-6 border border-purple-100/50 hover-lift animate-scale-up" data-testid="year-spending" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <CalendarDays className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-purple-700 mb-2">Year</p>
              <div className="relative z-10">
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-24 h-8 text-xs border border-purple-200 bg-white/80 backdrop-blur-sm rounded-lg px-3 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-white/95 backdrop-blur-sm">
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <div className="text-2xl font-bold text-purple-900">
          ₹{(stats?.yearTotal || 0).toFixed(0)}
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl shadow-card p-6 border border-green-100/50 hover-lift animate-scale-up" data-testid="budget-left" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <PiggyBank className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-700 mb-1">Budget Left</p>
              <div className="text-2xl font-bold text-green-900">
                ₹{(stats?.budgetLeft || 0).toFixed(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl shadow-card p-6 border border-amber-100/50 hover-lift animate-scale-up" data-testid="avg-daily" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Calculator className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-700 mb-1">Avg Daily</p>
              <div className="text-2xl font-bold text-amber-900">
                ₹{(stats?.avgDaily || 0).toFixed(0)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
