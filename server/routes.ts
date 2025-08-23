import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExpenseSchema, updateExpenseSchema } from "@shared/schema";
import { processExpenseQuery, generateExpenseInsights } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all expenses
  app.get("/api/expenses", async (req, res) => {
    try {
      const { category, startDate, endDate } = req.query;
      
      let expenses;
      if (startDate && endDate) {
        expenses = await storage.getExpensesByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else if (category) {
        expenses = await storage.getExpensesByCategory(category as string);
      } else {
        expenses = await storage.getExpenses();
      }
      
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  // Get single expense
  app.get("/api/expenses/:id", async (req, res) => {
    try {
      const expense = await storage.getExpense(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      console.error("Error fetching expense:", error);
      res.status(500).json({ message: "Failed to fetch expense" });
    }
  });

  // Create expense
  app.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(400).json({ message: "Invalid expense data" });
    }
  });

  // Update expense
  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const validatedData = updateExpenseSchema.parse(req.body);
      const expense = await storage.updateExpense(req.params.id, validatedData);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(400).json({ message: "Invalid expense data" });
    }
  });

  // Delete expense
  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteExpense(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Get expense analytics
  app.get("/api/expenses/analytics/stats", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Calculate stats
      const todayExpenses = expenses.filter(e => new Date(e.date) >= startOfToday);
      const monthExpenses = expenses.filter(e => new Date(e.date) >= startOfMonth);
      
      const todayTotal = todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const monthTotal = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      
      // Simple budget calculation (assuming 10000 monthly budget)
      const monthlyBudget = 10000;
      const budgetLeft = monthlyBudget - monthTotal;
      
      // Average daily spending for last 30 days
      const last30Days = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return expenseDate >= thirtyDaysAgo;
      });
      const avgDaily = last30Days.reduce((sum, e) => sum + parseFloat(e.amount), 0) / 30;
      
      res.json({
        todayTotal,
        monthTotal,
        budgetLeft,
        avgDaily,
        monthlyBudget,
      });
    } catch (error) {
      console.error("Error calculating stats:", error);
      res.status(500).json({ message: "Failed to calculate statistics" });
    }
  });

  // Chat with expense bot
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const result = await processExpenseQuery(message);
      
      // If it's an add expense intent, try to create the expense
      if (result.intent === "add_expense" && result.amount && result.category && result.description) {
        try {
          const expenseData = {
            amount: result.amount.toString(),
            category: result.category,
            description: result.description,
            date: new Date(), // Always use current date for chatbot entries
          };
          
          const validatedData = insertExpenseSchema.parse(expenseData);
          await storage.createExpense(validatedData);
          
          result.response_text = `Great! I've added your expense: ₹${result.amount} for ${result.description} in the ${result.category} category.`;
        } catch (error) {
          console.error("Chat expense creation error:", error);
          result.response_text = "I understood your expense details, but couldn't save it. Please try using the form instead.";
        }
      }
      
      // If it's a query intent, get relevant data and provide insights
      if (result.intent === "query_expenses") {
        const expenses = await storage.getExpenses();
        
        // Calculate specific stats based on query type
        if (result.query_type === "today") {
          const today = new Date();
          const todayExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.toDateString() === today.toDateString();
          });
          const todayTotal = todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
          result.response_text = todayTotal === 0 
            ? "Great! You haven't spent anything today yet. Keep up the good work!" 
            : `You've spent ₹${todayTotal.toFixed(0)} today across ${todayExpenses.length} transaction(s).`;
        } else if (result.query_type === "month") {
          const today = new Date();
          const monthExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getMonth() === today.getMonth() && expenseDate.getFullYear() === today.getFullYear();
          });
          const monthTotal = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
          result.response_text = monthTotal === 0 
            ? "You haven't recorded any expenses this month yet." 
            : `This month you've spent ₹${monthTotal.toFixed(0)} across ${monthExpenses.length} transaction(s).`;
        } else {
          // Use AI insights or fallback
          const insights = await generateExpenseInsights(expenses, message);
          result.response_text = insights;
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error processing chat:", error);
      res.status(500).json({ message: "Failed to process your message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
