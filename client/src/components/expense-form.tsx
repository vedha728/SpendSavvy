import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus, X, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { categories } from "@shared/types";
import type { InsertExpense } from "@shared/types";

const quickFilters = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

interface ExpenseFormProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

export default function ExpenseForm({ activeFilter, setActiveFilter }: ExpenseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertExpense>({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      amount: "",
      category: "",
      description: "",
      date: new Date(),
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: api.expenses.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/analytics/stats"] });
      form.reset({
        amount: "",
        category: "",
        description: "",
        date: new Date(),
      });
      toast({
        title: "Success",
        description: "Expense added successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertExpense) => {
    createExpenseMutation.mutate(data);
  };

  const clearForm = () => {
    form.reset({
      amount: "",
      category: "",
      description: "",
      date: new Date(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Expense Form */}
      <div className="bg-surface rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-text-primary flex items-center">
            <Plus className="text-primary mr-2 h-5 w-5" />
            Add New Expense
          </h2>
          <p className="text-sm text-text-secondary mt-1">Quick expense entry</p>
        </div>
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-add-expense">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary h-4 w-4" />
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-10"
                          data-testid="input-amount"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="What did you buy?"
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                        data-testid="input-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createExpenseMutation.isPending}
                  data-testid="button-submit"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearForm}
                  data-testid="button-clear"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="bg-surface rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-text-primary">Quick Filters</h3>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2 items-center">
            {quickFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === filter.value
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                }`}
                data-testid={`filter-${filter.value}`}
              >
                {filter.label}
              </button>
            ))}
            
            {/* Year Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-secondary">Year:</span>
              <Select 
                value={activeFilter.match(/^\d{4}$/) ? activeFilter : ""} 
                onValueChange={(value) => setActiveFilter(value)}
              >
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: new Date().getFullYear() - 2000 + 6 }, (_, i) => 2000 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
