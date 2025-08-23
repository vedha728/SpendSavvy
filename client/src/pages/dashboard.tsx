import { Wallet, University } from "lucide-react";
import QuickStats from "@/components/quick-stats";
import ExpenseForm from "@/components/expense-form";
import ExpenseList from "@/components/expense-list";
import ExpenseCharts from "@/components/expense-charts";
import Chatbot from "@/components/chatbot";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Wallet className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">ExpenseWise</h1>
                <p className="text-xs text-text-secondary">Smart Student Tracker</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1">
                <University className="text-primary text-sm" />
                <span className="text-sm font-medium">SASTRA University</span>
              </div>
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">AK</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <QuickStats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Expense Form */}
          <div className="lg:col-span-1">
            <ExpenseForm />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <ExpenseCharts />
            <ExpenseList />
          </div>
        </div>
      </div>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}
