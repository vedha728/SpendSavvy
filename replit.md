# ExpenseWise - Student Expense Tracker

## Overview

ExpenseWise is a modern full-stack expense tracking application specifically designed for students. Built with a React frontend and Express.js backend, the application provides intelligent expense management through AI-powered insights, interactive charts, and a conversational chatbot interface. The system features comprehensive CRUD operations for expenses, real-time analytics, and category-based organization to help students monitor their spending habits effectively.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **State Management**: TanStack Query for server state and caching
- **Form Handling**: React Hook Form with Zod validation schemas
- **Data Visualization**: Recharts for interactive charts and analytics

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints with standardized response formats
- **Validation**: Zod schemas shared between client and server
- **Error Handling**: Centralized error middleware with structured responses
- **Development**: Hot reloading with Vite integration

### Data Storage Solutions
- **Primary Database**: PostgreSQL configured through Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Schema Management**: Drizzle migrations in TypeScript
- **Development Storage**: In-memory storage implementation for development/testing
- **Connection**: Connection pooling through @neondatabase/serverless

### Database Schema Design
- **Expenses Table**: Core entity with decimal precision amounts, categorization, timestamps
- **Categories**: Predefined student-focused categories (canteen, travel, books, mobile, accommodation, etc.)
- **Validation**: Shared Zod schemas ensuring data consistency across tiers
- **Timestamps**: Created/updated tracking with automatic timestamp generation

### Authentication and Authorization
- **Current State**: Basic session management infrastructure in place
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple
- **Security**: CORS configuration and request logging middleware

### API Architecture
- **Expense Management**: Full CRUD operations with filtering by category and date range
- **Analytics**: Statistical endpoints for spending insights and trends
- **Chat Integration**: AI-powered expense processing through natural language
- **Response Format**: Consistent JSON responses with error handling
- **Query Parameters**: Flexible filtering for date ranges and categories

## External Dependencies

### Core Database
- **Neon PostgreSQL**: Serverless database hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and migration management
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### AI Integration
- **Google Gemini API**: Gemini 2.5 Flash and Pro models for natural language expense processing
- **Use Cases**: Intent recognition, expense extraction from text, spending insights generation
- **Features**: Conversational expense entry, automated categorization, spending analysis

### UI Component Libraries
- **Radix UI**: Headless component primitives for accessibility
- **Lucide React**: Consistent icon system throughout the application
- **shadcn/ui**: Pre-built component library with Tailwind integration

### Development Tools
- **Replit Integration**: Development environment optimization with error overlays
- **Vite Plugins**: Runtime error handling and development enhancements
- **TypeScript**: Strict type checking across the entire application stack

### Data Visualization
- **Recharts**: Interactive charts for expense analytics and trends
- **Chart Types**: Pie charts for category breakdown, line charts for spending trends
- **Responsive Design**: Mobile-optimized chart rendering

### Form and Validation
- **React Hook Form**: Performant form handling with minimal re-renders
- **Hookform Resolvers**: Zod integration for schema validation
- **Date Handling**: date-fns for consistent date manipulation and formatting

### Styling and Design
- **Tailwind CSS**: Utility-first styling with custom design system
- **CSS Variables**: Theme-based color system supporting light/dark modes
- **Google Fonts**: Custom font loading for improved typography
- **Class Variance Authority**: Type-safe component variant management