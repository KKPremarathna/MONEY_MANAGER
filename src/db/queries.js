import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from './index';
import { transactions, categories, users, defaultCategories } from './schema';
import { eq, desc, sum, gte, lte, and } from 'drizzle-orm';

// Hook to get all transactions
export function useTransactions(type = null, dateFilter = 'all', referenceDate = new Date()) {
  let conditions = [];

  if (type) {
    conditions.push(eq(transactions.type, type));
  }

  const ref = new Date(referenceDate);
  if (dateFilter === 'daily') {
    const startOfDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;
    conditions.push(gte(transactions.date, new Date(startOfDay)));
    conditions.push(lte(transactions.date, new Date(endOfDay)));
  } else if (dateFilter === 'monthly') {
    const startOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1).getTime();
    const endOfMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    conditions.push(gte(transactions.date, new Date(startOfMonth)));
    conditions.push(lte(transactions.date, new Date(endOfMonth)));
  } else if (dateFilter === 'yearly') {
    const startOfYear = new Date(ref.getFullYear(), 0, 1).getTime();
    const endOfYear = new Date(ref.getFullYear(), 11, 31, 23, 59, 59, 999).getTime();
    conditions.push(gte(transactions.date, new Date(startOfYear)));
    conditions.push(lte(transactions.date, new Date(endOfYear)));
  }

  let query = db.select({
    id: transactions.id,
    amount: transactions.amount,
    date: transactions.date,
    note: transactions.note,
    type: transactions.type,
    categoryName: categories.name,
    categoryIcon: categories.icon,
    categoryColor: categories.color
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
    date: new Date()
  });
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
