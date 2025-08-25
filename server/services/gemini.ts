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
    const systemPrompt = `You are an expense tracking assistant for students in India. When mentioning amounts, always use Indian Rupees (₹) as the currency symbol. Analyze the user's message and determine their intent.

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
- date (if mentioned, otherwise use today)

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
    const systemPrompt = "You are a helpful expense tracking assistant for students in India that provides insights about spending patterns and answers questions about expenses. When mentioning amounts, always use Indian Rupees (₹) as the currency symbol.";
    
    const prompt = `
Based on the following expense data, provide helpful insights and answer the user's question.

Expenses: ${JSON.stringify(expenses)}
User question: "${query}"

Provide a concise, helpful response about their spending patterns, suggestions, or direct answers to their question.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: prompt,
    });

    return response.text || "I couldn't analyze your expenses right now.";
  } catch (error) {
    console.error("Gemini API error:", error);
    
    // Check if it's a quota/billing issue
    if (error instanceof Error && error.message.includes('quota')) {
      return "I'm currently unable to analyze your expenses due to API quota limits. Please check your Gemini account usage.";
    }
    
    // Check if it's a rate limit issue
    if (error instanceof Error && error.message.includes('rate limit')) {
      return "I'm being rate limited. Please wait a moment and try your question again.";
    }
    
    return "I'm having trouble connecting to my AI service right now. Please try again in a moment.";
  }
}
