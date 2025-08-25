import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});

export const updateExpenseSchema = insertExpenseSchema.partial();

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type UpdateExpense = z.infer<typeof updateExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export const categories = [
  { value: "canteen", label: "🍕 Canteen", emoji: "🍕" },
  { value: "travel", label: "🚌 Travel", emoji: "🚌" },
  { value: "books", label: "📚 Books", emoji: "📚" },
  { value: "mobile", label: "📱 Mobile", emoji: "📱" },
  { value: "accommodation", label: "🏠 Accommodation", emoji: "🏠" },
  { value: "entertainment", label: "🎭 Entertainment", emoji: "🎭" },
  { value: "medical", label: "🏥 Medical", emoji: "🏥" },
  { value: "clothing", label: "👕 Clothing", emoji: "👕" },
  { value: "stationery", label: "📋 Stationery", emoji: "📋" },
  { value: "others", label: "🔧 Others", emoji: "🔧" },
] as const;

export type Category = typeof categories[number]["value"];

// Debt schema
export const debts = pgTable("debts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  friendName: text("friend_name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // "I_OWE_THEM" or "THEY_OWE_ME"
  description: text("description").notNull(),
  isSettled: text("is_settled").default("false").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  settledAt: timestamp("settled_at"),
});

export const insertDebtSchema = createInsertSchema(debts).omit({
  id: true,
  createdAt: true,
  settledAt: true,
});

export const updateDebtSchema = insertDebtSchema.partial();

export type InsertDebt = z.infer<typeof insertDebtSchema>;
export type UpdateDebt = z.infer<typeof updateDebtSchema>;
export type Debt = typeof debts.$inferSelect;

export const debtTypes = [
  { value: "I_OWE_THEM", label: "I owe them" },
  { value: "THEY_OWE_ME", label: "They owe me" },
] as const;

export type DebtType = typeof debtTypes[number]["value"];
