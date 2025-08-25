import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MessageCircle, X, Send, Bot, Sparkles } from "lucide-react";
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
      text: "Hi! I'm your EXPENZA assistant. I can help you track, save, and thrive with your expenses and debts. Try saying \"Add lunch expense of ₹80\"",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [budgetMessageAdded, setBudgetMessageAdded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Draggable functionality
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const chatWindowRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      
      // If an expense was added, budget was set, or debt was added, refresh the data
      if (response.intent === "add_expense" || response.intent === "set_budget" || response.intent === "add_debt") {
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/expenses/analytics/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/debts"] });
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

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Constrain within viewport
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const chatWidth = 320; // w-80 = 320px
    const chatHeight = 500; // approximate height
    
    const constrainedX = Math.max(0, Math.min(newX, windowWidth - chatWidth));
    const constrainedY = Math.max(0, Math.min(newY, windowHeight - chatHeight));
    
    setPosition({ x: constrainedX, y: constrainedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, position]);

  return (
    <div className="fixed bottom-6 right-6 z-50" data-testid="chatbot-container">
      {/* Chatbot Toggle Button */}
      <div className="relative">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 border-2 border-white"
          data-testid="button-chat-toggle"
        >
          <div className="relative">
            <Bot className="h-7 w-7" />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300" />
          </div>
        </Button>
        {!isOpen && (
          <div className="absolute -top-12 right-0 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg">
            AI Chat
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>

      {/* Chatbot Window */}
      {isOpen && (
        <div 
          ref={chatWindowRef}
          className="fixed w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 select-none" 
          style={{
            left: position.x || 'auto',
            top: position.y || 'auto',
            right: position.x ? 'auto' : '1.5rem',
            bottom: position.y ? 'auto' : '5rem',
          }}
          data-testid="chat-window"
        >
          <div 
            className="p-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 rounded-t-2xl text-white cursor-move"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Bot className="h-5 w-5" />
                  <Sparkles className="h-3 w-3 absolute ml-1 -mt-1 text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">AI Chat</h3>
                  <p className="text-xs opacity-90">EXPENZA AI Assistant</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-xl p-2 transition-all cursor-pointer"
                data-testid="button-chat-close"
                onMouseDown={(e) => e.stopPropagation()}
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
            <div ref={messagesEndRef} />
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
              <button
                onClick={() => handleQuickQuery("harish owes me 500 for dinner")}
                className="px-2 py-1 bg-gray-100 rounded-full text-xs text-text-secondary hover:bg-gray-200 transition-colors"
                data-testid="button-quick-query-debt"
              >
                Add debt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
