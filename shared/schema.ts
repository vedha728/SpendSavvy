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
