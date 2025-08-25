import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ExpenseIntentResult {
  intent: "add_expense" | "query_expenses" | "set_budget" | "general_help" | "unclear";
  amount?: number;
  category?: string;
  description?: string;
  date?: string;
  query_type?: "total" | "today" | "month" | "category" | "recent";
  category_filter?: string;
  budget_amount?: number;
  response_text: string;
}

export async function processExpenseQuery(userMessage: string): Promise<ExpenseIntentResult> {
  try {
    const systemPrompt = `You are an expense tracking assistant for students in India. When mentioning amounts, always use Indian Rupees (₹) as the currency symbol. Today's date is ${new Date().toISOString().split('T')[0]}. Analyze the user's message and determine their intent.

Possible intents:
1. "add_expense" - User wants to add a new expense
2. "query_expenses" - User wants to know about their spending
3. "set_budget" - User wants to set their monthly budget
4. "general_help" - User needs help using the app
5. "unclear" - Message is unclear

If intent is "add_expense", extract:
- amount (number)
- category (canteen, travel, books, mobile, accommodation, entertainment, medical, clothing, stationery, others)
- description (what they bought)
- date (CRITICAL: Parse dates carefully):
  * If specific date with year is mentioned like "july 10 2024", "august 10 2025", "08/10/2025", "2025-08-10" → return exact ISO format "2024-07-10", "2025-08-10"
  * If date without year like "august 10", "august 05", "08/10", "05/08" → return "NEED_YEAR:august 05" or "NEED_YEAR:08/10"
  * If "today", "yesterday" → calculate and return proper ISO date (YYYY-MM-DD)
  * If "last week", "last month" → return "NEED_CLARIFICATION:last week"
  * If no date mentioned → return "TODAY"
  * IMPORTANT: If user says "july 10 2024" this means July 10, 2024 NOT today's date

If intent is "set_budget", extract:
- budget_amount (number) - the budget amount the user wants to set

If intent is "query_expenses", determine query_type:
- "total" - total spending
- "today" - today's spending
- "month" - this month's spending  
- "category" - spending by category
- "recent" - recent expenses

Provide a helpful response_text for the user.

Respond with JSON in this format:
{'intent': string, 'amount': number, 'category': string, 'description': string, 'date': string, 'query_type': string, 'category_filter': string, 'budget_amount': number, 'response_text': string}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            intent: { type: "string" },
            amount: { type: "number" },
            category: { type: "string" },
            description: { type: "string" },
            date: { type: "string" },
            query_type: { type: "string" },
            category_filter: { type: "string" },
            budget_amount: { type: "number" },
            response_text: { type: "string" },
          },
          required: ["intent", "response_text"],
        },
      },
      contents: userMessage,
    });

    const rawJson = response.text;
    if (rawJson) {
      const result = JSON.parse(rawJson);
      return result as ExpenseIntentResult;
    } else {
      throw new Error("Empty response from model");
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    
    // Check if it's a quota/billing issue
    if (error instanceof Error && error.message.includes('quota')) {
      return {
        intent: "unclear",
        response_text: "I'm currently unable to help due to API quota limits. Please check your Gemini account usage.",
      };
    }
    
    // Check if it's a rate limit issue
    if (error instanceof Error && error.message.includes('rate limit')) {
      return {
        intent: "unclear", 
        response_text: "I'm being rate limited. Please wait a moment and try again.",
      };
    }
    
    return {
      intent: "unclear",
      response_text: "I'm having trouble connecting to my AI service right now. Please try again in a moment.",
    };
  }
}

export async function generateExpenseInsights(expenses: any[], query: string): Promise<string> {
  try {
    // Handle the case when there are no expenses
    if (!expenses || expenses.length === 0) {
      return "You haven't recorded any expenses yet. Start by adding your first expense using the form above or tell me something like 'I spent ₹50 on coffee at canteen'.";
    }

    // Calculate basic stats from expenses
    const todayExpenses = expenses.filter(expense => {
      const today = new Date();
      const expenseDate = new Date(expense.date);
      return expenseDate.toDateString() === today.toDateString();
    });

    const todayTotal = todayExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

    // For specific queries, provide direct answers without AI
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('today') || queryLower.includes("today's")) {
      if (todayTotal === 0) {
        return "Great news! You haven't spent anything today yet. Your wallet is safe! 💸";
      }
      return `Today you've spent ₹${todayTotal.toFixed(0)} across ${todayExpenses.length} expense${todayExpenses.length !== 1 ? 's' : ''}. ${todayExpenses.map(e => `₹${parseFloat(e.amount).toFixed(0)} on ${e.description}`).join(', ')}.`;
    }

    if (queryLower.includes('total') || queryLower.includes('how much')) {
      return `Your total expenses so far are ₹${totalExpenses.toFixed(0)} across ${expenses.length} transactions. Today's spending: ₹${todayTotal.toFixed(0)}.`;
    }

    const systemPrompt = "You are a helpful expense tracking assistant for students in India that provides insights about spending patterns and answers questions about expenses. When mentioning amounts, always use Indian Rupees (₹) as the currency symbol. Be conversational, friendly, and provide actionable advice.";
    
    const prompt = `
Based on the following expense data, provide helpful insights and answer the user's question.

Expenses (recent first): ${JSON.stringify(expenses.slice(0, 10))}
Total expenses: ${expenses.length}
Today's total: ₹${todayTotal}
Overall total: ₹${totalExpenses}

User question: "${query}"

Provide a concise, friendly response about their spending patterns, suggestions, or direct answers to their question. Be conversational and include specific amounts and categories when relevant.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: prompt,
    });

    return response.text || `You've spent ₹${todayTotal.toFixed(0)} today and ₹${totalExpenses.toFixed(0)} in total. Let me know if you'd like insights about any specific category or time period!`;
  } catch (error) {
    console.error("Gemini API error:", error);
    
    // Provide useful fallback responses based on the query
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('today') || queryLower.includes("today's")) {
      const todayExpenses = expenses.filter(expense => {
        const today = new Date();
        const expenseDate = new Date(expense.date);
        return expenseDate.toDateString() === today.toDateString();
      });
      const todayTotal = todayExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      
      if (todayTotal === 0) {
        return "You haven't spent anything today yet! 🎉";
      }
      return `Today you've spent ₹${todayTotal.toFixed(0)} on ${todayExpenses.length} expense${todayExpenses.length !== 1 ? 's' : ''}.`;
    }
    
    if (queryLower.includes('total')) {
      const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      return `Your total expenses are ₹${totalExpenses.toFixed(0)} across ${expenses.length} transactions.`;
    }
    
    // Check if it's a quota/billing issue
    if (error instanceof Error && error.message.includes('quota')) {
      return "I'm currently unable to provide detailed insights due to API limits, but I can see your expenses. Try asking specific questions like 'How much did I spend today?' and I'll give you the exact numbers!";
    }
    
    // Check if it's a rate limit issue
    if (error instanceof Error && error.message.includes('rate limit')) {
      return "I'm processing too many requests right now. Here's what I can tell you: you have " + expenses.length + " expenses recorded. Try asking again in a moment for detailed insights!";
    }
    
    return "I can see your expense data but I'm having trouble generating insights right now. Try asking specific questions like 'How much today?' or 'What's my biggest expense?' and I'll give you direct answers!";
  }
}
