import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  isHighlight?: boolean;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your expense assistant. I can help you add expenses, check your spending, or answer questions. Try saying \"Add lunch expense of ₹80\"",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [budgetMessageAdded, setBudgetMessageAdded] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["/api/expenses/analytics/stats"],
    queryFn: () => api.expenses.getStats(),
  });

  // Add budget setup message when chat opens if budget is 0
  useEffect(() => {
    if (isOpen && stats && stats.monthlyBudget === 0 && !budgetMessageAdded) {
      const budgetMessage: Message = {
        id: "budget-setup",
        text: "🎯 **First set your budget!** Try: \"Set my budget to ₹5000\"",
        isBot: true,
        timestamp: new Date(),
        isHighlight: true,
      };
      setMessages(prev => [...prev, budgetMessage]);
      setBudgetMessageAdded(true);
    }
  }, [isOpen, stats, budgetMessageAdded]);

  const chatMutation = useMutation({
    mutationFn: api.chat.sendMessage,
    onSuccess: (response) => {
      const botMessage: Message = {
        id: Date.now().toString() + "_bot",
        text: response.response_text,
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      
      // If an expense was added or budget was set, refresh the data
      if (response.intent === "add_expense" || response.intent === "set_budget") {
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/expenses/analytics/stats"] });
      }
    },
    onError: () => {
      const errorMessage: Message = {
        id: Date.now().toString() + "_error",
        text: "Sorry, I'm having trouble right now. Please try again later.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    },
  });

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputValue);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const handleQuickQuery = (query: string) => {
    setInputValue(query);
    setTimeout(() => sendMessage(), 100);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" data-testid="chatbot-container">
      {/* Chatbot Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-lg hover:scale-105 transition-all"
        data-testid="button-chat-toggle"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-surface rounded-2xl shadow-2xl border border-gray-200" data-testid="chat-window">
          <div className="p-4 bg-primary rounded-t-2xl text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold">ExpenseBot</h3>
                  <p className="text-xs opacity-90">Your smart assistant</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1"
                data-testid="button-chat-close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="h-64 overflow-y-auto p-4 space-y-3" data-testid="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isBot ? 'items-start' : 'items-end justify-end'} space-x-2`}>
                {message.isBot && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className={`max-w-xs rounded-lg px-3 py-2 ${
                  message.isBot 
                    ? message.isHighlight 
                      ? 'bg-yellow-100 border-2 border-yellow-300 text-text-primary font-semibold' 
                      : 'bg-gray-100 text-text-primary'
                    : 'bg-primary text-white'
                }`}>
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3 w-3 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your expenses..."
                className="flex-1 text-sm"
                disabled={chatMutation.isPending}
                data-testid="input-chat"
              />
              <Button
                onClick={sendMessage}
                disabled={chatMutation.isPending || !inputValue.trim()}
                size="sm"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mt-3 flex flex-wrap gap-1">
              <button
                onClick={() => handleQuickQuery("How much did I spend today?")}
                className="px-2 py-1 bg-gray-100 rounded-full text-xs text-text-secondary hover:bg-gray-200 transition-colors"
                data-testid="button-quick-query-today"
              >
                Today's spending?
              </button>
              <button
                onClick={() => handleQuickQuery("Add ₹50 canteen lunch")}
                className="px-2 py-1 bg-gray-100 rounded-full text-xs text-text-secondary hover:bg-gray-200 transition-colors"
                data-testid="button-quick-query-add"
              >
                Add expense
              </button>
              <button
                onClick={() => handleQuickQuery("Set my budget to ₹5000")}
                className="px-2 py-1 bg-gray-100 rounded-full text-xs text-text-secondary hover:bg-gray-200 transition-colors"
                data-testid="button-quick-query-budget"
              >
                Set budget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
