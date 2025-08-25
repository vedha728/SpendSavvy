import { useState } from "react";
import { Wallet } from "lucide-react";
import QuickStats from "@/components/quick-stats";
import ExpenseForm from "@/components/expense-form";
import ExpenseList from "@/components/expense-list";
import ExpenseCharts from "@/components/expense-charts";
import Chatbot from "@/components/chatbot";

export default function Dashboard() {
  const [activeFilter, setActiveFilter] = useState("today");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg transform rotate-12">
                <Wallet className="text-white text-xl transform -rotate-12" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  ExpenseWise
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <QuickStats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Expense Form */}
          <div className="lg:col-span-1">
            <ExpenseForm activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
          </div>

          {/* Expense List */}
          <div className="lg:col-span-2">
            <ExpenseList activeFilter={activeFilter} />
          </div>
        </div>

        {/* Spending Overview - Moved to bottom */}
        <div className="mb-8">
          <ExpenseCharts />
        </div>
      </div>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}
