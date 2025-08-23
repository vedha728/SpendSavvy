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
    return {
      intent: "unclear",
      response_text: "I'm having trouble understanding your request. Can you please rephrase it?",
    };
  }
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
    return "I'm having trouble analyzing your expenses at the moment.";
  }
}
