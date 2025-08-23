import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-api-key-here"
});

export interface ExpenseIntentResult {
  intent: "add_expense" | "query_expenses" | "general_help" | "unclear";
  amount?: number;
  category?: string;
  description?: string;
  date?: string;
  query_type?: "total" | "today" | "month" | "category" | "recent";
  category_filter?: string;
  response_text: string;
}

export async function processExpenseQuery(userMessage: string): Promise<ExpenseIntentResult> {
  try {
    const prompt = `
You are an expense tracking assistant for students. Analyze the user's message and determine their intent.

Possible intents:
1. "add_expense" - User wants to add a new expense
2. "query_expenses" - User wants to know about their spending
3. "general_help" - User needs help using the app
4. "unclear" - Message is unclear

If intent is "add_expense", extract:
- amount (number)
- category (canteen, travel, books, mobile, accommodation, entertainment, medical, clothing, stationery, others)
- description (what they bought)
- date (if mentioned, otherwise use today)

If intent is "query_expenses", determine query_type:
- "total" - total spending
- "today" - today's spending
- "month" - this month's spending  
- "category" - spending by category
- "recent" - recent expenses

Provide a helpful response_text for the user.

User message: "${userMessage}"

Respond with JSON only.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as ExpenseIntentResult;
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fallback to simple pattern matching when OpenAI is not available
    return parseExpenseQueryFallback(userMessage);
  }
}

// Fallback function when OpenAI API is not available
function parseExpenseQueryFallback(userMessage: string): ExpenseIntentResult {
  const message = userMessage.toLowerCase();
  
  // Check for spending queries
  if (message.includes("how much") || message.includes("spent") || message.includes("spending")) {
    if (message.includes("today")) {
      return {
        intent: "query_expenses",
        query_type: "today",
        response_text: "Let me check your spending for today..."
      };
    } else if (message.includes("month") || message.includes("this month")) {
      return {
        intent: "query_expenses",
        query_type: "month", 
        response_text: "Let me check your spending for this month..."
      };
    } else if (message.includes("total")) {
      return {
        intent: "query_expenses",
        query_type: "total",
        response_text: "Let me calculate your total spending..."
      };
    } else {
      return {
        intent: "query_expenses",
        query_type: "recent",
        response_text: "Let me check your recent expenses..."
      };
    }
  }
  
  // Check for add expense patterns
  const amountMatch = message.match(/₹?(\d+)/);
  if (amountMatch && (message.includes("add") || message.includes("spent") || message.includes("bought"))) {
    const amount = parseInt(amountMatch[1]);
    
    // Try to detect category
    let category = "others";
    if (message.includes("lunch") || message.includes("food") || message.includes("canteen")) category = "canteen";
    else if (message.includes("travel") || message.includes("bus") || message.includes("auto")) category = "travel";
    else if (message.includes("book")) category = "books";
    else if (message.includes("mobile") || message.includes("phone")) category = "mobile";
    
    // Extract description
    let description = "Expense";
    if (message.includes("lunch")) description = "Lunch";
    else if (message.includes("coffee")) description = "Coffee";
    else if (message.includes("bus")) description = "Bus fare";
    else if (message.includes("book")) description = "Books";
    
    return {
      intent: "add_expense",
      amount,
      category,
      description,
      response_text: `I'll help you add an expense of ₹${amount} for ${description}.`
    };
  }
  
  // Default response
  return {
    intent: "general_help",
    response_text: "I can help you add expenses (try 'Add ₹50 for lunch') or check your spending (try 'How much did I spend today?'). What would you like to do?"
  };
}

export async function generateExpenseInsights(expenses: any[], query: string): Promise<string> {
  try {
    const prompt = `
Based on the following expense data, provide helpful insights and answer the user's question.

Expenses: ${JSON.stringify(expenses)}
User question: "${query}"

Provide a concise, helpful response about their spending patterns, suggestions, or direct answers to their question.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful expense tracking assistant that provides insights about spending patterns and answers questions about expenses.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return response.choices[0].message.content || "I couldn't analyze your expenses right now.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fallback to simple analysis when OpenAI is not available
    return generateInsightsFallback(expenses, query);
  }
}

// Fallback function for expense insights when OpenAI is not available
function generateInsightsFallback(expenses: any[], query: string): string {
  const queryLower = query.toLowerCase();
  
  if (expenses.length === 0) {
    return "You haven't recorded any expenses yet. Start by adding your first expense!";
  }
  
  const today = new Date();
  const todayExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.date);
    return expenseDate.toDateString() === today.toDateString();
  });
  
  const monthExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.date);
    return expenseDate.getMonth() === today.getMonth() && expenseDate.getFullYear() === today.getFullYear();
  });
  
  if (queryLower.includes("today")) {
    const todayTotal = todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    if (todayTotal === 0) {
      return "Great! You haven't spent anything today yet. Keep up the good work!";
    }
    return `You've spent ₹${todayTotal.toFixed(0)} today across ${todayExpenses.length} transaction(s).`;
  }
  
  if (queryLower.includes("month")) {
    const monthTotal = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    if (monthTotal === 0) {
      return "You haven't recorded any expenses this month yet.";
    }
    return `This month you've spent ₹${monthTotal.toFixed(0)} across ${monthExpenses.length} transaction(s).`;
  }
  
  // Default summary
  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const avgDaily = totalSpent / 30;
  
  return `You've recorded ${expenses.length} expenses totaling ₹${totalSpent.toFixed(0)}. Your average daily spending is ₹${avgDaily.toFixed(0)}.`;
}
