import { type Expense, type InsertExpense, type UpdateExpense } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Expense operations
  getExpenses(): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: UpdateExpense): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;
  getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]>;
  getExpensesByCategory(category: string): Promise<Expense[]>;
  
  // Budget operations
  getBudget(): Promise<number>;
  setBudget(amount: number): Promise<void>;
  
  // Manual overrides for stats
  setTodayTotal(amount: number): Promise<void>;
  setMonthTotal(amount: number): Promise<void>;
  setAvgDaily(amount: number): Promise<void>;
  getTodayOverride(): Promise<number | undefined>;
  getMonthOverride(): Promise<number | undefined>;
  getAvgDailyOverride(): Promise<number | undefined>;
  clearOverrides(): Promise<void>;
}

export class MemStorage implements IStorage {
  private expenses: Map<string, Expense>;
  private monthlyBudget: number;
  private manualOverrides: {
    todayTotal?: number;
    monthTotal?: number;
    avgDaily?: number;
  };

  constructor() {
    this.expenses = new Map();
    this.monthlyBudget = 10000; // Default budget
    this.manualOverrides = {};
  }

  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = {
      ...insertExpense,
      id,
      createdAt: new Date(),
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: string, updateExpense: UpdateExpense): Promise<Expense | undefined> {
    const existing = this.expenses.get(id);
    if (!existing) return undefined;

    const updated: Expense = {
      ...existing,
      ...updateExpense,
    };
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: string): Promise<boolean> {
    return this.expenses.delete(id);
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getExpensesByCategory(category: string): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(expense => 
      expense.category === category
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getBudget(): Promise<number> {
    return this.monthlyBudget;
  }

  async setBudget(amount: number): Promise<void> {
    this.monthlyBudget = amount;
  }

  async setTodayTotal(amount: number): Promise<void> {
    this.manualOverrides.todayTotal = amount;
  }

  async setMonthTotal(amount: number): Promise<void> {
    this.manualOverrides.monthTotal = amount;
  }

  async setAvgDaily(amount: number): Promise<void> {
    this.manualOverrides.avgDaily = amount;
  }

  async getTodayOverride(): Promise<number | undefined> {
    return this.manualOverrides.todayTotal;
  }

  async getMonthOverride(): Promise<number | undefined> {
    return this.manualOverrides.monthTotal;
  }

  async getAvgDailyOverride(): Promise<number | undefined> {
    return this.manualOverrides.avgDaily;
  }

  async clearOverrides(): Promise<void> {
    this.manualOverrides = {};
  }
}

export const storage = new MemStorage();
