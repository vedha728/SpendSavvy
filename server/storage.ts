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
}

export class MemStorage implements IStorage {
  private expenses: Map<string, Expense>;
  private monthlyBudget: number;

  constructor() {
    this.expenses = new Map();
    this.monthlyBudget = 10000; // Default budget
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
}

export const storage = new MemStorage();
