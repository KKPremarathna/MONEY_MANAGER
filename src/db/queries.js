import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from './index';
import { transactions, categories, users, defaultCategories } from './schema';
import { eq, desc, sum, gte, lte, and } from 'drizzle-orm';

// Hook to get all transactions
export function useTransactions(type = null) {
  let conditions = [];

  if (type) {
    conditions.push(eq(transactions.type, type));
  }

  let query = db.select({
    id: transactions.id,
    amount: transactions.amount,
    date: transactions.date,
    note: transactions.note,
    type: transactions.type,
    categoryName: categories.name,
    categoryIcon: categories.icon,
    categoryColor: categories.color,
    categoryBudget: categories.budget,
    categoryBudgetType: categories.budgetType,
    categoryId: transactions.categoryId
  })
  .from(transactions)
  .leftJoin(categories, eq(transactions.categoryId, categories.id))
  .orderBy(desc(transactions.date));

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const { data } = useLiveQuery(query);
  return data || [];
}

// Hook to get total balance, income, and expenses
export function useBalance() {
  const { data } = useLiveQuery(
    db.select({
      type: transactions.type,
      total: sum(transactions.amount).mapWith(Number)
    })
    .from(transactions)
    .groupBy(transactions.type)
  );

  let income = 0;
  let expense = 0;

  (data || []).forEach(row => {
    if (row.type === 'income') income = row.total || 0;
    if (row.type === 'expense') expense = row.total || 0;
  });

  return {
    income,
    expense,
    balance: income - expense
  };
}

export async function insertTransaction(data) {
  await db.insert(transactions).values({
    ...data,
    date: data.date || new Date()
  });
}

export async function deleteTransaction(id) {
  await db.delete(transactions).where(eq(transactions.id, id)).execute();
}

export async function updateTransaction(id, data) {
  await db.update(transactions)
    .set(data)
    .where(eq(transactions.id, id))
    .execute();
}

export function useCategories(type) {
  const query = db.select().from(categories).where(eq(categories.type, type));
  const { data } = useLiveQuery(query);
  return data || [];
}

export function useUserProfile() {
  const query = db.select().from(users).limit(1);
  const { data } = useLiveQuery(query);
  return data && data.length > 0 ? data[0] : null;
}

export async function createUserProfile(name, email, imageUri = null) {
  await db.insert(users).values({ name, email, imageUri });
}

export async function updateUserProfile(id, data) {
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function deleteUserProfile() {
  await db.delete(users);
}

export async function insertCategory(data) {
  await db.insert(categories).values(data);
}

export async function deleteCategory(id) {
  await db.delete(categories).where(eq(categories.id, id));
}

export async function updateCategoryBudget(id, budget, budgetType) {
  await db.update(categories)
    .set({ budget, budgetType })
    .where(eq(categories.id, id))
    .execute();
}

export async function getCategorySpentForMonth(categoryId, year, month) {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
  
  const result = await db.select({
    total: sum(transactions.amount)
  })
  .from(transactions)
  .where(and(
    eq(transactions.categoryId, categoryId),
    eq(transactions.type, 'expense'),
    gte(transactions.date, startOfMonth),
    lte(transactions.date, endOfMonth)
  ))
  .execute();
  
  return result[0]?.total || 0;
}

export async function getCategorySpentForDay(categoryId, year, month, day) {
  const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
  const endOfDay = new Date(year, month, day, 23, 59, 59, 999);
  
  const result = await db.select({
    total: sum(transactions.amount)
  })
  .from(transactions)
  .where(and(
    eq(transactions.categoryId, categoryId),
    eq(transactions.type, 'expense'),
    gte(transactions.date, startOfDay),
    lte(transactions.date, endOfDay)
  ))
  .execute();
  
  return result[0]?.total || 0;
}

export async function resetDatabase() {
  try {
    await db.delete(transactions).execute();
    await db.delete(categories).execute();
    await db.delete(users).execute();

    for (const cat of defaultCategories) {
      await db.insert(categories).values(cat).execute();
    }
  } catch (error) {
    console.error("Failed to reset database:", error);
    throw error;
  }
}
