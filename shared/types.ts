
/* ---------- EXPENSE TYPES ---------- */

export type Expense = {
  id: string;
  amount: string;
  category: Category;
  description: string;
  date: Date;
  createdAt: Date;
};

export type InsertExpense = {
  amount: string;
  category: Category;
  description: string;
  date: Date;
};

export type UpdateExpense = Partial<InsertExpense>;

/* ---------- CATEGORIES ---------- */

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

/* ---------- DEBT TYPES ---------- */

export type Debt = {
  id: string;
  friendName: string;
  amount: string;
  type: DebtType;
  description: string;
  isSettled: string;
  createdAt: Date;
  settledAt?: Date | null;
};

export type InsertDebt = {
  friendName: string;
  amount: string;
  type: DebtType;
  description: string;
};

export type UpdateDebt = Partial<InsertDebt>;

export const debtTypes = [
  { value: "I_OWE_THEM", label: "I owe them" },
  { value: "THEY_OWE_ME", label: "They owe me" },
] as const;

export type DebtType = typeof debtTypes[number]["value"];
