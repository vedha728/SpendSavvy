import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { categories } from "@shared/schema";
import type { Expense } from "@shared/schema";

export default function ExpenseList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [visibleCount, setVisibleCount] = useState(5);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["/api/expenses"],
    queryFn: () => api.expenses.getAll(),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: api.expenses.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/analytics/stats"] });
      toast({
        title: "Success",
        description: "Expense deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getCategoryEmoji = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.emoji || "🔧";
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      canteen: "bg-orange-100",
      travel: "bg-blue-100",
      books: "bg-green-100",
      mobile: "bg-purple-100",
      accommodation: "bg-red-100",
      entertainment: "bg-pink-100",
      medical: "bg-cyan-100",
      clothing: "bg-yellow-100",
      stationery: "bg-indigo-100",
      others: "bg-gray-100",
    };
    return colors[category] || "bg-gray-100";
  };

  if (isLoading) {
    return (
      <div className="bg-surface rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-text-primary">Recent Expenses</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visibleExpenses = expenses.slice(0, visibleCount);
  const hasMore = expenses.length > visibleCount;

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Recent Expenses</h2>
          <span className="text-primary text-sm font-medium">{expenses.length} total</span>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {visibleExpenses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-text-secondary">No expenses recorded yet.</p>
            <p className="text-sm text-text-secondary mt-1">Start by adding your first expense!</p>
          </div>
        ) : (
          visibleExpenses.map((expense: Expense) => (
            <div key={expense.id} className="p-4 hover:bg-gray-50 transition-colors" data-testid={`expense-${expense.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${getCategoryColor(expense.category)} rounded-lg flex items-center justify-center`}>
                    <span className="text-lg">{getCategoryEmoji(expense.category)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary" data-testid={`text-description-${expense.id}`}>
                      {expense.description}
                    </p>
                    <p className="text-sm text-text-secondary" data-testid={`text-date-${expense.id}`}>
                      {formatDate(expense.date)} • {categories.find(c => c.value === expense.category)?.label.split(' ')[1] || expense.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-text-primary" data-testid={`text-amount-${expense.id}`}>
                    ₹{parseFloat(expense.amount).toFixed(0)}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <button 
                      className="text-blue-500 hover:text-blue-700 p-1 rounded"
                      data-testid={`button-edit-${expense.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-red-500 hover:text-red-700 p-1 rounded"
                      onClick={() => deleteExpenseMutation.mutate(expense.id)}
                      disabled={deleteExpenseMutation.isPending}
                      data-testid={`button-delete-${expense.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {hasMore && (
        <div className="p-4 border-t border-gray-100">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setVisibleCount(prev => prev + 5)}
            data-testid="button-load-more"
          >
            Load More Expenses
          </Button>
        </div>
      )}
    </div>
  );
}
