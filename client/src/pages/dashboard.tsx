import { useState } from "react";
import expenzaLogo from "../assets/expenza-logo.png";
import QuickStats from "@/components/quick-stats";
import ExpenseForm from "@/components/expense-form";
import ExpenseList from "@/components/expense-list";
import ExpenseCharts from "@/components/expense-charts";
import DebtTracker from "@/components/debt-tracker";
import Chatbot from "@/components/chatbot";

export default function Dashboard() {
  const [activeFilter, setActiveFilter] = useState("today");

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Enhanced Header with Gradient */}
      <header className="relative bg-gradient-primary shadow-elegant border-b border-white/20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)`,
            backgroundSize: '100px 100px'
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-24">
            <div className="flex items-center space-x-5 animate-fade-up">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 shadow-2xl">
                <img src={expenzaLogo} alt="EXPENZA" className="w-14 h-14 object-contain" />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold text-white mb-1 tracking-tight">
                  EXPENZA
                </h1>
                <p className="text-white/80 font-medium tracking-wider text-sm uppercase">Track Save Thrive</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Statistics Section */}
        <section className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-elegant border border-white/20 p-8 hover-lift animate-fade-up">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-8 bg-gradient-primary rounded-full"></div>
              <h2 className="text-3xl font-display font-bold text-gray-800">Financial Overview</h2>
            </div>
            <p className="text-gray-600 text-lg">Track your spending across different time periods</p>
          </div>
          <QuickStats />
        </section>

        {/* Management Section */}
        <section className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-elegant border border-white/20 hover-lift animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="p-8 border-b border-gray-100/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-8 bg-gradient-secondary rounded-full"></div>
              <h2 className="text-3xl font-display font-bold text-gray-800">Expense Management</h2>
            </div>
            <p className="text-gray-600 text-lg">Add new expenses and filter your transaction history</p>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
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
        <section className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-elegant border border-white/20 hover-lift animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="p-8 border-b border-gray-100/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-8 bg-gradient-primary rounded-full"></div>
              <h2 className="text-3xl font-display font-bold text-gray-800">Spending Analytics</h2>
            </div>
            <p className="text-gray-600 text-lg">Visual insights into your spending patterns and trends</p>
          </div>
          <div className="p-8">
            <ExpenseCharts />
          </div>
        </section>

        {/* Debt Tracking Section */}
        <section className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-elegant border border-white/20 hover-lift animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <div className="p-8 border-b border-gray-100/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-8 bg-gradient-secondary rounded-full"></div>
              <h2 className="text-3xl font-display font-bold text-gray-800">Debt Tracking</h2>
            </div>
            <p className="text-gray-600 text-lg">Track money you owe and money owed to you</p>
          </div>
          <div className="p-8">
            <DebtTracker />
          </div>
        </section>
      </div>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}
