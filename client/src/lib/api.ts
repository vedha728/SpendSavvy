import { apiRequest } from "./queryClient";
import type { Expense, InsertExpense, UpdateExpense, Debt, InsertDebt, UpdateDebt } from "@shared/types";

export interface ExpenseStats {
  todayTotal: number;
  monthTotal: number;
  yearTotal: number;
  budgetLeft: number;
  avgDaily: number;
  monthlyBudget: number;
}

export interface ChatResponse {
  intent: string;
  response_text: string;
  amount?: number;
  category?: string;
  description?: string;
}

export const api = {
  expenses: {
    getAll: async (params?: { category?: string; startDate?: string; endDate?: string }): Promise<Expense[]> => {
      const query = new URLSearchParams();
      if (params?.category) query.set('category', params.category);
      if (params?.startDate) query.set('startDate', params.startDate);
      if (params?.endDate) query.set('endDate', params.endDate);
      
      const url = `/api/expenses${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
    
    getById: async (id: string): Promise<Expense> => {
      const response = await apiRequest("GET", `/api/expenses/${id}`);
      return response.json();
    },
    
    create: async (expense: InsertExpense): Promise<Expense> => {
      const response = await apiRequest("POST", "/api/expenses", expense);
      return response.json();
    },
    
    update: async (id: string, expense: UpdateExpense): Promise<Expense> => {
      const response = await apiRequest("PUT", `/api/expenses/${id}`, expense);
      return response.json();
    },
    
    delete: async (id: string): Promise<void> => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    
    getStats: async (year?: number, month?: number): Promise<ExpenseStats> => {
      const params = new URLSearchParams();
      if (year !== undefined) params.set('year', year.toString());
      if (month !== undefined) params.set('month', month.toString());
      
      const url = `/api/expenses/analytics/stats${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  },
  
  chat: {
    sendMessage: async (message: string): Promise<ChatResponse> => {
      const response = await apiRequest("POST", "/api/chat", { message });
      return response.json();
    },
  },
  
  debts: {
    getAll: async (): Promise<Debt[]> => {
      const response = await apiRequest("GET", "/api/debts");
      return response.json();
    },
    
    getById: async (id: string): Promise<Debt> => {
      const response = await apiRequest("GET", `/api/debts/${id}`);
      return response.json();
    },
    
    create: async (debt: InsertDebt): Promise<Debt> => {
      const response = await apiRequest("POST", "/api/debts", debt);
      return response.json();
    },
    
    update: async (id: string, debt: UpdateDebt): Promise<Debt> => {
      const response = await apiRequest("PUT", `/api/debts/${id}`, debt);
      return response.json();
    },
    
    delete: async (id: string): Promise<void> => {
      await apiRequest("DELETE", `/api/debts/${id}`);
    },
    
    settle: async (id: string): Promise<Debt> => {
      const response = await apiRequest("POST", `/api/debts/${id}/settle`);
      return response.json();
    },
  },
  
  stats: {
    setTodayTotal: async (amount: number): Promise<void> => {
      await apiRequest("POST", "/api/stats/set-today", { amount });
    },
    setMonthTotal: async (amount: number): Promise<void> => {
      await apiRequest("POST", "/api/stats/set-month", { amount });
    },
    setAvgDaily: async (amount: number): Promise<void> => {
      await apiRequest("POST", "/api/stats/set-avg-daily", { amount });
    },
    setBudget: async (amount: number): Promise<void> => {
      await apiRequest("POST", "/api/stats/set-budget", { amount });
    },
  },
};
