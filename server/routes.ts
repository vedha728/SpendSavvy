import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExpenseSchema, updateExpenseSchema } from "@shared/schema";
import { processExpenseQuery, generateExpenseInsights } from "./services/gemini";

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
      // Convert date string to Date object before validation
      const expenseData = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : new Date(),
      };
      
      const validatedData = insertExpenseSchema.parse(expenseData);
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
      // Convert date string to Date object before validation if date is provided
      const expenseData = {
        ...req.body,
        ...(req.body.date && { date: new Date(req.body.date) }),
      };
      
      const validatedData = updateExpenseSchema.parse(expenseData);
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
      
      // Calculate base values from expenses
      const calculatedTodayTotal = todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const calculatedMonthTotal = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      
      // Average daily spending for last 30 days
      const last30Days = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return expenseDate >= thirtyDaysAgo;
      });
      const calculatedAvgDaily = last30Days.reduce((sum, e) => sum + parseFloat(e.amount), 0) / 30;
      
      // Get manual overrides if any
      const todayOverride = await storage.getTodayOverride();
      const monthOverride = await storage.getMonthOverride();
      const avgDailyOverride = await storage.getAvgDailyOverride();
      
      // Use overrides or calculated values
      const todayTotal = todayOverride !== undefined ? todayOverride : calculatedTodayTotal;
      const monthTotal = monthOverride !== undefined ? monthOverride : calculatedMonthTotal;
      const avgDaily = avgDailyOverride !== undefined ? avgDailyOverride : calculatedAvgDaily;
      
      // Get dynamic budget from storage
      const monthlyBudget = await storage.getBudget();
      const budgetLeft = monthlyBudget - monthTotal;
      
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

      // Check if budget is not set (0) and suggest setting it first
      const currentBudget = await storage.getBudget();
      if (currentBudget === 0 && !message.toLowerCase().includes('budget') && !message.toLowerCase().includes('set')) {
        const budgetReminder = {
          intent: "general_help" as const,
          response_text: "🎯 **First set your budget!** Try: \"Set my budget to ₹5000\""
        };
        res.json(budgetReminder);
        return;
      }

      const result = await processExpenseQuery(message);
      
      // If it's an add expense intent, try to create the expense
      if (result.intent === "add_expense" && result.amount && result.category && result.description) {
        try {
          // Handle special date cases
          if (result.date?.startsWith("NEED_YEAR:")) {
            const partialDate = result.date.replace("NEED_YEAR:", "");
            result.response_text = `I understood your expense: ₹${result.amount} for ${result.description}. But I need to know which year you meant for "${partialDate}". Please specify like "${partialDate} 2024" or "${partialDate} 2025".`;
            res.json(result);
            return;
          }
          
          if (result.date?.startsWith("NEED_CLARIFICATION:")) {
            const vagueTerm = result.date.replace("NEED_CLARIFICATION:", "");
            result.response_text = `I understood your expense: ₹${result.amount} for ${result.description}. Could you be more specific about "${vagueTerm}"? Please provide an exact date like "august 10 2025" or "08/10/2025".`;
            res.json(result);
            return;
          }

          // Process the date
          let expenseDate: Date;
          if (!result.date || result.date === "TODAY") {
            expenseDate = new Date();
          } else {
            // Try to parse the date
            expenseDate = new Date(result.date);
            
            // Validate the parsed date
            if (isNaN(expenseDate.getTime())) {
              result.response_text = `I understood your expense: ₹${result.amount} for ${result.description}, but I couldn't understand the date "${result.date}". Please use formats like "august 10 2025" or "08/10/2025".`;
              res.json(result);
              return;
            }
          }

          const expenseData = {
            amount: result.amount.toString(),
            category: result.category,
            description: result.description,
            date: expenseDate,
          };
          
          const validatedData = insertExpenseSchema.parse(expenseData);
          await storage.createExpense(validatedData);
          
          // Format the date for display
          const dateStr = expenseDate.toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          
          if (expenseDate.toDateString() === new Date().toDateString()) {
            result.response_text = `Great! I've added your expense: ₹${result.amount} for ${result.description} in the ${result.category} category for today.`;
          } else {
            result.response_text = `Great! I've added your expense: ₹${result.amount} for ${result.description} in the ${result.category} category for ${dateStr}.`;
          }
        } catch (error) {
          result.response_text = "I understood your expense details, but couldn't save it. Please try using the form instead.";
        }
      }
      
      // If it's a query intent, get relevant data
      if (result.intent === "query_expenses") {
        const expenses = await storage.getExpenses();
        const insights = await generateExpenseInsights(expenses, message);
        result.response_text = insights;
      }
      
      // If it's a set budget intent, update the budget
      if (result.intent === "set_budget" && result.budget_amount) {
        try {
          await storage.setBudget(result.budget_amount);
          result.response_text = `Perfect! I've set your monthly budget to ₹${result.budget_amount}. You can now track how much you have left to spend each month.`;
        } catch (error) {
          result.response_text = "I understood you want to set a budget, but couldn't save it. Please try again.";
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error processing chat:", error);
      res.status(500).json({ message: "Failed to process your message" });
    }
  });

  // API endpoints for manual stat overrides
  app.post("/api/stats/set-today", async (req, res) => {
    try {
      const { amount } = req.body;
      if (typeof amount !== 'number' || amount < 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      await storage.setTodayTotal(amount);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting today's total:", error);
      res.status(500).json({ message: "Failed to update today's spending" });
    }
  });

  app.post("/api/stats/set-month", async (req, res) => {
    try {
      const { amount } = req.body;
      if (typeof amount !== 'number' || amount < 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      await storage.setMonthTotal(amount);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting month total:", error);
      res.status(500).json({ message: "Failed to update monthly spending" });
    }
  });

  app.post("/api/stats/set-avg-daily", async (req, res) => {
    try {
      const { amount } = req.body;
      if (typeof amount !== 'number' || amount < 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      await storage.setAvgDaily(amount);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting avg daily:", error);
      res.status(500).json({ message: "Failed to update average daily spending" });
    }
  });

  app.post("/api/stats/set-budget", async (req, res) => {
    try {
      const { amount } = req.body;
      if (typeof amount !== 'number' || amount < 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      await storage.setBudget(amount);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting budget:", error);
      res.status(500).json({ message: "Failed to update budget" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
