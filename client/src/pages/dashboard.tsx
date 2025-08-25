import { useState } from "react";
import { Wallet } from "lucide-react";
import QuickStats from "@/components/quick-stats";
import ExpenseForm from "@/components/expense-form";
import ExpenseList from "@/components/expense-list";
import ExpenseCharts from "@/components/expense-charts";
import DebtTracker from "@/components/debt-tracker";
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Statistics Section */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Financial Overview</h2>
            <p className="text-gray-600">Track your spending across different time periods</p>
          </div>
          <QuickStats />
        </section>

        {/* Management Section */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Expense Management</h2>
            <p className="text-gray-600">Add new expenses and filter your transaction history</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Expense Form */}
              <div className="lg:col-span-1">
                <ExpenseForm activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
              </div>

              {/* Expense List */}
              <div className="lg:col-span-2">
                <ExpenseList activeFilter={activeFilter} />
              </div>
            </div>
          </div>
        </section>

        {/* Analytics Section */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Spending Analytics</h2>
            <p className="text-gray-600">Visual insights into your spending patterns and trends</p>
          </div>
          <div className="p-6">
            <ExpenseCharts />
          </div>
        </section>

        {/* Debt Tracking Section */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">DEBTS</h2>
            <p className="text-gray-600">Track money you owe and money owed to you</p>
          </div>
          <div className="p-6">
            <DebtTracker />
          </div>
        </section>
      </div>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}
