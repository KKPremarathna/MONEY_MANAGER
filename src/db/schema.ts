import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  color: text('color'),
  icon: text('icon'),
  budget: real('budget'),
  budgetType: text('budget_type').default('monthly'),
  synced: integer('synced', { mode: 'boolean' }).default(false),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  imageUri: text('image_uri'),
  biometricsEnabled: integer('biometrics_enabled', { mode: 'boolean' }).default(false),
});

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  amount: real('amount').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  note: text('note'),
  categoryId: integer('category_id').references(() => categories.id),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  currency: text('currency', { enum: ['USD', 'LKR'] }).notNull().default('LKR'),
  receiptUri: text('receipt_uri'),
  synced: integer('synced', { mode: 'boolean' }).default(false),
});

// Seed data definitions
export const defaultCategories = [
  // Expenses
  { name: 'Food', type: 'expense', color: '#FF6B6B', icon: 'fast-food-outline' },
  { name: 'Transport', type: 'expense', color: '#4ECDC4', icon: 'bus-outline' },
  { name: 'Phone', type: 'expense', color: '#45B7D1', icon: 'call-outline' },
  { name: 'Entertainment', type: 'expense', color: '#96CEB4', icon: 'film-outline' },
  { name: 'Shopping', type: 'expense', color: '#FFEEAD', icon: 'cart-outline' },
  { name: 'Education', type: 'expense', color: '#D4A5A5', icon: 'book-outline' },
  { name: 'Travel', type: 'expense', color: '#9B59B6', icon: 'airplane-outline' },
  { name: 'Health', type: 'expense', color: '#FF9F43', icon: 'medkit-outline' },
  // Incomes
  { name: 'Salary', type: 'income', color: '#2ECC71', icon: 'cash-outline' },
  { name: 'Investment', type: 'income', color: '#F1C40F', icon: 'trending-up-outline' },
  { name: 'Parttime', type: 'income', color: '#E67E22', icon: 'time-outline' },
  { name: 'Bonus', type: 'income', color: '#1ABC9C', icon: 'gift-outline' },
];
