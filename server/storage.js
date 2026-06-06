import { expenses, debts, settings } from "../shared/schema.ts";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, gte, lte, desc, inArray } from "drizzle-orm";
export class MemStorage {
    expenses;
    debts;
    monthlyBudget;
    manualOverrides;
    constructor() {
        this.expenses = new Map();
        this.debts = new Map();
        this.monthlyBudget = 0; // Default budget - user needs to set their budget first
        this.manualOverrides = {};
    }
    async getExpenses() {
        return Array.from(this.expenses.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    async getExpense(id) {
        return this.expenses.get(id);
    }
    async createExpense(insertExpense) {
        const id = randomUUID();
        const expense = {
            ...insertExpense,
            id,
            createdAt: new Date(),
        };
        this.expenses.set(id, expense);
        return expense;
    }
    async updateExpense(id, updateExpense) {
        const existing = this.expenses.get(id);
        if (!existing)
            return undefined;
        const updated = {
            ...existing,
            ...updateExpense,
        };
        this.expenses.set(id, updated);
        return updated;
    }
    async deleteExpense(id) {
        return this.expenses.delete(id);
    }
    async getExpensesByDateRange(startDate, endDate) {
        return Array.from(this.expenses.values()).filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= startDate && expenseDate <= endDate;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    async getExpensesByCategory(category) {
        return Array.from(this.expenses.values()).filter(expense => expense.category === category).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    async getBudget() {
        return this.monthlyBudget;
    }
    async setBudget(amount) {
        this.monthlyBudget = amount;
    }
    async setTodayTotal(amount) {
        this.manualOverrides.todayTotal = amount;
    }
    async setMonthTotal(amount) {
        this.manualOverrides.monthTotal = amount;
    }
    async setAvgDaily(amount) {
        this.manualOverrides.avgDaily = amount;
    }
    async getTodayOverride() {
        return this.manualOverrides.todayTotal;
    }
    async getMonthOverride() {
        return this.manualOverrides.monthTotal;
    }
    async getAvgDailyOverride() {
        return this.manualOverrides.avgDaily;
    }
    async clearOverrides() {
        this.manualOverrides = {};
    }
    // Debt operations implementation
    async getDebts() {
        return Array.from(this.debts.values())
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async getDebt(id) {
        return this.debts.get(id);
    }
    async createDebt(insertDebt) {
        const id = randomUUID();
        const debt = {
            ...insertDebt,
            id,
            createdAt: new Date(),
            settledAt: null,
            isSettled: insertDebt.isSettled || "false",
        };
        this.debts.set(id, debt);
        return debt;
    }
    async updateDebt(id, updateDebt) {
        const existing = this.debts.get(id);
        if (!existing)
            return undefined;
        const updated = {
            ...existing,
            ...updateDebt,
        };
        this.debts.set(id, updated);
        return updated;
    }
    async deleteDebt(id) {
        return this.debts.delete(id);
    }
    async settleDebt(id) {
        const existing = this.debts.get(id);
        if (!existing)
            return undefined;
        const settled = {
            ...existing,
            isSettled: "true",
            settledAt: new Date(),
        };
        this.debts.set(id, settled);
        return settled;
    }
}
export class DbStorage {
    async getExpenses() {
        const rows = await db.select().from(expenses).orderBy(desc(expenses.date));
        return rows.map(r => ({ ...r, category: r.category }));
    }
    async getExpense(id) {
        const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
        return expense ? { ...expense, category: expense.category } : undefined;
    }
    async createExpense(expense) {
        const [inserted] = await db.insert(expenses).values({
            ...expense,
        }).returning();
        return { ...inserted, category: inserted.category };
    }
    async updateExpense(id, expense) {
        const [updated] = await db.update(expenses)
            .set(expense)
            .where(eq(expenses.id, id))
            .returning();
        return updated ? { ...updated, category: updated.category } : undefined;
    }
    async deleteExpense(id) {
        const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
        return result.length > 0;
    }
    async getExpensesByDateRange(startDate, endDate) {
        const rows = await db.select()
            .from(expenses)
            .where(and(gte(expenses.date, startDate), lte(expenses.date, endDate)))
            .orderBy(desc(expenses.date));
        return rows.map(r => ({ ...r, category: r.category }));
    }
    async getExpensesByCategory(category) {
        const rows = await db.select()
            .from(expenses)
            .where(eq(expenses.category, category))
            .orderBy(desc(expenses.date));
        return rows.map(r => ({ ...r, category: r.category }));
    }
    async getBudget() {
        const [row] = await db.select().from(settings).where(eq(settings.key, "budget"));
        return row ? parseFloat(row.value) : 0;
    }
    async setBudget(amount) {
        await db.insert(settings)
            .values({ key: "budget", value: amount.toString() })
            .onConflictDoUpdate({
            target: settings.key,
            set: { value: amount.toString() },
        });
    }
    async getTodayOverride() {
        const [row] = await db.select().from(settings).where(eq(settings.key, "today_override"));
        return row ? parseFloat(row.value) : undefined;
    }
    async setTodayTotal(amount) {
        await db.insert(settings)
            .values({ key: "today_override", value: amount.toString() })
            .onConflictDoUpdate({
            target: settings.key,
            set: { value: amount.toString() },
        });
    }
    async getMonthOverride() {
        const [row] = await db.select().from(settings).where(eq(settings.key, "month_override"));
        return row ? parseFloat(row.value) : undefined;
    }
    async setMonthTotal(amount) {
        await db.insert(settings)
            .values({ key: "month_override", value: amount.toString() })
            .onConflictDoUpdate({
            target: settings.key,
            set: { value: amount.toString() },
        });
    }
    async getAvgDailyOverride() {
        const [row] = await db.select().from(settings).where(eq(settings.key, "avg_daily_override"));
        return row ? parseFloat(row.value) : undefined;
    }
    async setAvgDaily(amount) {
        await db.insert(settings)
            .values({ key: "avg_daily_override", value: amount.toString() })
            .onConflictDoUpdate({
            target: settings.key,
            set: { value: amount.toString() },
        });
    }
    async clearOverrides() {
        await db.delete(settings).where(inArray(settings.key, ["today_override", "month_override", "avg_daily_override"]));
    }
    async getDebts() {
        const rows = await db.select().from(debts).orderBy(desc(debts.createdAt));
        return rows.map(r => ({ ...r, type: r.type }));
    }
    async getDebt(id) {
        const [debt] = await db.select().from(debts).where(eq(debts.id, id));
        return debt ? { ...debt, type: debt.type } : undefined;
    }
    async createDebt(debt) {
        const [inserted] = await db.insert(debts).values(debt).returning();
        return { ...inserted, type: inserted.type };
    }
    async updateDebt(id, debt) {
        const [updated] = await db.update(debts).set(debt).where(eq(debts.id, id)).returning();
        return updated ? { ...updated, type: updated.type } : undefined;
    }
    async deleteDebt(id) {
        const result = await db.delete(debts).where(eq(debts.id, id)).returning();
        return result.length > 0;
    }
    async settleDebt(id) {
        const [settled] = await db.update(debts)
            .set({ isSettled: "true", settledAt: new Date() })
            .where(eq(debts.id, id))
            .returning();
        return settled ? { ...settled, type: settled.type } : undefined;
    }
}
export const storage = new DbStorage();
