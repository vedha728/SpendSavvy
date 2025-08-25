import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExpenseSchema, updateExpenseSchema, insertDebtSchema, updateDebtSchema } from "@shared/schema";
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
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create expense" });
      }
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
      
      // Get year and month from query params or default to current
      const selectedYear = req.query.year ? parseInt(req.query.year as string) : today.getFullYear();
      const selectedMonth = req.query.month ? parseInt(req.query.month as string) : today.getMonth();
      
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfSelectedMonth = new Date(selectedYear, selectedMonth, 1);
      const endOfSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0);
      const startOfSelectedYear = new Date(selectedYear, 0, 1);
      const endOfSelectedYear = new Date(selectedYear, 11, 31);
      
      // Calculate stats
      const todayExpenses = expenses.filter(e => new Date(e.date) >= startOfToday);
      const monthExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= startOfSelectedMonth && expenseDate <= endOfSelectedMonth;
      });
      const yearExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= startOfSelectedYear && expenseDate <= endOfSelectedYear;
      });
      
      // Calculate base values from expenses
      const calculatedTodayTotal = todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const calculatedMonthTotal = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const calculatedYearTotal = yearExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      
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
      
      // If no budget is set, return all values as 0 for clean initial state
      if (monthlyBudget === 0) {
        res.json({
          todayTotal: 0,
          monthTotal: 0,
          yearTotal: 0,
          budgetLeft: 0,
          avgDaily: 0,
          monthlyBudget: 0,
        });
        return;
      }
      
      // Normal calculations when budget is set
      const budgetLeft = monthlyBudget - monthTotal;
      
      res.json({
        todayTotal,
        monthTotal,
        yearTotal: calculatedYearTotal,
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
          // Extract date from original message if Gemini didn't provide it
          let extractedDate = result.date;
          if (!extractedDate) {
            // Try to extract date from original message using regex
            const datePatterns = [
              /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
              /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/i,
              /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
              /(\d{4})-(\d{1,2})-(\d{1,2})/
            ];
            
            for (const pattern of datePatterns) {
              const match = message.match(pattern);
              if (match) {
                if (pattern.source.includes('january|february')) {
                  // Format: "15 july 2024"
                  const day = match[1].padStart(2, '0');
                  const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
                  const month = (monthNames.indexOf(match[2].toLowerCase()) + 1).toString().padStart(2, '0');
                  const year = match[3];
                  extractedDate = `${year}-${month}-${day}`;
                  break;
                } else if (pattern.source.includes('jan|feb')) {
                  // Format: "15 jul 2024"
                  const day = match[1].padStart(2, '0');
                  const monthAbbr = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
                  const month = (monthAbbr.indexOf(match[2].toLowerCase()) + 1).toString().padStart(2, '0');
                  const year = match[3];
                  extractedDate = `${year}-${month}-${day}`;
                  break;
                } else if (pattern.source.includes('\\/')) {
                  // Format: "15/07/2024"
                  const day = match[1].padStart(2, '0');
                  const month = match[2].padStart(2, '0');
                  const year = match[3];
                  extractedDate = `${year}-${month}-${day}`;
                  break;
                } else {
                  // Format: "2024-07-15"
                  extractedDate = match[0];
                  break;
                }
              }
            }
          }
          
          // Handle special date cases
          if (extractedDate?.startsWith("NEED_YEAR:")) {
            const partialDate = extractedDate.replace("NEED_YEAR:", "");
            result.response_text = `I understood your expense: ₹${result.amount} for ${result.description}. But I need to know which year you meant for "${partialDate}". Please specify like "${partialDate} 2024" or "${partialDate} 2025".`;
            res.json(result);
            return;
          }
          
          if (extractedDate?.startsWith("NEED_CLARIFICATION:")) {
            const vagueTerm = extractedDate.replace("NEED_CLARIFICATION:", "");
            result.response_text = `I understood your expense: ₹${result.amount} for ${result.description}. Could you be more specific about "${vagueTerm}"? Please provide an exact date like "august 10 2025" or "08/10/2025".`;
            res.json(result);
            return;
          }

          // Process the date
          let expenseDate: Date;
          if (!extractedDate || extractedDate === "TODAY") {
            expenseDate = new Date();
          } else {
            // Try to parse the date
            expenseDate = new Date(extractedDate);
            
            // Validate the parsed date
            if (isNaN(expenseDate.getTime())) {
              result.response_text = `I understood your expense: ₹${result.amount} for ${result.description}, but I couldn't understand the date "${extractedDate}". Please use formats like "august 10 2025" or "08/10/2025".`;
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
          
          const categoryEmojis: {[key: string]: string} = {
            canteen: '🍽️', travel: '🚌', books: '📚', mobile: '📱',
            accommodation: '🏠', entertainment: '🎬', medical: '💊',
            clothing: '👕', stationery: '✏️', others: '📦'
          };
          const emoji = categoryEmojis[result.category] || '💰';
          
          if (expenseDate.toDateString() === new Date().toDateString()) {
            result.response_text = `${emoji} Perfect! Added ₹${result.amount} for ${result.description} in ${result.category} category today. Keep tracking! 📊`;
          } else {
            result.response_text = `${emoji} Expense recorded! ₹${result.amount} for ${result.description} in ${result.category} on ${dateStr}. Great memory! 🧠`;
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
      if (result.intent === "set_budget" && result.budget_amount !== undefined) {
        try {
          await storage.setBudget(result.budget_amount);
          if (result.budget_amount === 0) {
            result.response_text = `✅ Budget reset! I've set your monthly budget to ₹0. You're now in unlimited spending mode - but I'll still track your expenses!`;
          } else {
            result.response_text = `🎯 Perfect! I've set your monthly budget to ₹${result.budget_amount}. You can now track how much you have left to spend each month!`;
          }
        } catch (error) {
          result.response_text = "I understood you want to set a budget, but couldn't save it. Please try again.";
        }
      }

      // If it's a set budget left intent, calculate total budget needed
      if (result.intent === "set_budget_left" && result.budget_amount !== undefined) {
        try {
          // Get current month's spending
          const currentDate = new Date();
          const expenses = await storage.getExpenses();
          const monthTotal = expenses
            .filter(expense => {
              const expenseDate = new Date(expense.date);
              return expenseDate.getMonth() === currentDate.getMonth() && 
                     expenseDate.getFullYear() === currentDate.getFullYear();
            })
            .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

          // Calculate total budget needed: current spending + desired budget left
          const totalBudgetNeeded = monthTotal + result.budget_amount;
          
          await storage.setBudget(totalBudgetNeeded);
          if (result.budget_amount === 0) {
            result.response_text = `✅ Perfect! I've adjusted your budget to ₹${totalBudgetNeeded} so you have exactly ₹0 left to spend this month.`;
          } else {
            result.response_text = `💰 Great! I've set your budget to ₹${totalBudgetNeeded} so you have ₹${result.budget_amount} left to spend this month!`;
          }
        } catch (error) {
          result.response_text = "I understood you want to set your budget left amount, but couldn't save it. Please try again.";
        }
      }

      // If it's a reset today intent, clear today's spending
      if (result.intent === "reset_today") {
        try {
          await storage.setTodayTotal(0);
          result.response_text = `🧹 Done! I've reset today's spending to ₹0. Your expense history is still safe, but today's total now shows zero.`;
        } catch (error) {
          result.response_text = "I understood you want to reset today's spending, but couldn't do it. Please try again.";
        }
      }

      // If it's an add debt intent, create the debt automatically
      if (result.intent === "add_debt" && result.friend_name && result.debt_amount && result.debt_type && result.debt_description) {
        try {
          const debtData = {
            friendName: result.friend_name,
            amount: result.debt_amount.toString(),
            type: result.debt_type,
            description: result.debt_description,
            isSettled: "false",
          };
          
          const validatedData = insertDebtSchema.parse(debtData);
          await storage.createDebt(validatedData);
          
          const emoji = result.debt_type === "I_OWE_THEM" ? "💸" : "💰";
          const typeText = result.debt_type === "I_OWE_THEM" ? "you owe" : "they owe you";
          result.response_text = `${emoji} Debt tracked! ${typeText} ${result.friend_name} ₹${result.debt_amount} for ${result.debt_description}. Money matters sorted! 📝`;
        } catch (error) {
          result.response_text = "I understood your debt details, but couldn't save it. Please try again.";
        }
      }

      // If it's a query debts intent, get debt information
      if (result.intent === "query_debts") {
        const debts = await storage.getDebts();
        const activeDebts = debts.filter(debt => debt.isSettled === "false");
        
        if (result.query_type === "list") {
          if (activeDebts.length === 0) {
            result.response_text = "You have no active debts! 🎉";
          } else {
            const debtList = activeDebts.map(debt => {
              const typeText = debt.type === "I_OWE_THEM" ? "You owe" : "They owe you";
              return `• ${typeText} ${debt.friendName} ₹${debt.amount} for ${debt.description}`;
            }).join('\n');
            result.response_text = `Here are your active debts:\n\n${debtList}`;
          }
        } else {
          const youOwe = activeDebts
            .filter(debt => debt.type === "I_OWE_THEM")
            .reduce((sum, debt) => sum + parseFloat(debt.amount), 0);
          const owedToYou = activeDebts
            .filter(debt => debt.type === "THEY_OWE_ME")
            .reduce((sum, debt) => sum + parseFloat(debt.amount), 0);
          const netBalance = owedToYou - youOwe;

          if (result.query_type === "total_owed") {
            result.response_text = `You owe a total of ₹${youOwe} to others.`;
          } else if (result.query_type === "total_owing") {
            result.response_text = `Others owe you a total of ₹${owedToYou}.`;
          } else if (result.query_type === "net_balance") {
            if (netBalance > 0) {
              result.response_text = `Your net balance is +₹${netBalance} (more money owed to you).`;
            } else if (netBalance < 0) {
              result.response_text = `Your net balance is ₹${netBalance} (you owe more money).`;
            } else {
              result.response_text = `Your debt balance is even! You're all settled up.`;
            }
          }
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
      // Prevent resetting today's spending to 0 via API
      if (amount === 0) {
        return res.status(400).json({ message: "Cannot reset today's spending to zero" });
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
      // Allow setting budget to 0 
      await storage.setBudget(amount);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting budget:", error);
      res.status(500).json({ message: "Failed to update budget" });
    }
  });

  // Debt routes
  app.get("/api/debts", async (req, res) => {
    try {
      const debts = await storage.getDebts();
      res.json(debts);
    } catch (error) {
      console.error("Error fetching debts:", error);
      res.status(500).json({ message: "Failed to fetch debts" });
    }
  });

  app.get("/api/debts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const debt = await storage.getDebt(id);
      if (!debt) {
        return res.status(404).json({ message: "Debt not found" });
      }
      res.json(debt);
    } catch (error) {
      console.error("Error fetching debt:", error);
      res.status(500).json({ message: "Failed to fetch debt" });
    }
  });

  app.post("/api/debts", async (req, res) => {
    try {
      const validatedData = insertDebtSchema.parse(req.body);
      const debt = await storage.createDebt(validatedData);
      res.status(201).json(debt);
    } catch (error) {
      console.error("Error creating debt:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid debt data", errors: error.message });
      }
      res.status(500).json({ message: "Failed to create debt" });
    }
  });

  app.put("/api/debts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateDebtSchema.parse(req.body);
      const debt = await storage.updateDebt(id, validatedData);
      if (!debt) {
        return res.status(404).json({ message: "Debt not found" });
      }
      res.json(debt);
    } catch (error) {
      console.error("Error updating debt:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid debt data", errors: error.message });
      }
      res.status(500).json({ message: "Failed to update debt" });
    }
  });

  app.post("/api/debts/:id/settle", async (req, res) => {
    try {
      const { id } = req.params;
      const debt = await storage.settleDebt(id);
      if (!debt) {
        return res.status(404).json({ message: "Debt not found" });
      }
      res.json(debt);
    } catch (error) {
      console.error("Error settling debt:", error);
      res.status(500).json({ message: "Failed to settle debt" });
    }
  });

  app.delete("/api/debts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteDebt(id);
      if (!deleted) {
        return res.status(404).json({ message: "Debt not found" });
      }
      res.json({ message: "Debt deleted successfully" });
    } catch (error) {
      console.error("Error deleting debt:", error);
      res.status(500).json({ message: "Failed to delete debt" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
