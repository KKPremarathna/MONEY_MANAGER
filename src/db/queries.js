import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from './index';
import { transactions, categories, users } from './schema';
import { eq, desc, sum, gte, and } from 'drizzle-orm';

// Hook to get all transactions
export function useTransactions(type = null, dateFilter = 'all') {
  let conditions = [];

  if (type) {
    conditions.push(eq(transactions.type, type));
  }

  const now = new Date();
  if (dateFilter === 'daily') {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    conditions.push(gte(transactions.date, new Date(startOfDay)));
  } else if (dateFilter === 'monthly') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    conditions.push(gte(transactions.date, new Date(startOfMonth)));
  } else if (dateFilter === 'yearly') {
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
    conditions.push(gte(transactions.date, new Date(startOfYear)));
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
