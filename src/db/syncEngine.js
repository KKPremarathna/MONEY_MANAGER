import { db } from './index';
import { transactions, categories, users, defaultCategories } from './schema';
import { eq, and, sql } from 'drizzle-orm';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Check if a user session is active
 */
export async function getSession() {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session) return null;
  return data.session;
}

/**
 * Upload profile picture to Supabase Storage 'avatars' bucket
 */
export async function uploadAvatar(localUri) {
  try {
    if (!localUri) {
      throw new Error("No profile image provided.");
    }
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase credentials are not configured in .env.");
    }
    
    // If it's already a cloud URL, return it
    if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
      return localUri;
    }

    const session = await getSession();
    if (!session) {
      throw new Error("No active cloud session found. Please log out and sign in again.");
    }

    const userId = session.user.id;

    // Fetch file extension
    const fileExt = localUri.split('.').pop()?.split('?')[0] || 'jpg';
    const filePath = `${userId}/avatar.${fileExt}`;

    // Use FormData for React Native file upload compatibility
    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      name: `avatar.${fileExt}`,
      type: `image/${fileExt}`,
    });

    // Upload FormData to Supabase Storage
    const { error } = await supabase.storage
      .from('profilePIC')
      .upload(filePath, formData, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) throw error;

    // Get public access URL
    const { data: { publicUrl } } = supabase.storage
      .from('profilePIC')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

/**
 * Upload unsynced categories and transactions to Supabase
 */
export async function syncUp() {
  try {
    if (!isSupabaseConfigured()) return;
    const session = await getSession();
    if (!session) return;

    const userId = session.user.id;

    // 1. Sync Categories
    const unsyncedCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.synced, false))
      .execute();

    for (const cat of unsyncedCategories) {
      const { error } = await supabase
        .from('categories')
        .upsert({
          id: cat.id,
          user_id: userId,
          name: cat.name,
          type: cat.type,
          color: cat.color,
          icon: cat.icon,
          budget: cat.budget,
          budget_type: cat.budgetType,
        });

      if (!error) {
        await db
          .update(categories)
          .set({ synced: true })
          .where(eq(categories.id, cat.id))
          .execute();
      } else {
        console.error('Failed to sync category up:', error);
      }
    }

    // 2. Sync Transactions
    const unsyncedTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.synced, false))
      .execute();

    for (const tx of unsyncedTransactions) {
      const { error } = await supabase
        .from('transactions')
        .upsert({
          id: tx.id,
          user_id: userId,
          amount: tx.amount,
          date: tx.date.toISOString(),
          note: tx.note,
          category_id: tx.categoryId,
          type: tx.type,
          currency: tx.currency,
        });

      if (!error) {
        await db
          .update(transactions)
          .set({ synced: true })
          .where(eq(transactions.id, tx.id))
          .execute();
      } else {
        console.error('Failed to sync transaction up:', error);
      }
    }
  } catch (error) {
    console.error('Error in syncUp:', error);
  }
}

/**
 * Download categories and transactions from Supabase to local SQLite
 */
export async function syncDown() {
  try {
    if (!isSupabaseConfigured()) return;
    const session = await getSession();
    if (!session) return;

    // Disable change listeners or wrap in a transaction to prevent loops
    // 1. Fetch remote categories
    const { data: remoteCategories, error: catError } = await supabase
      .from('categories')
      .select('*');

    if (catError) {
      console.error('Failed to fetch remote categories:', catError);
    } else if (remoteCategories) {
      for (const rc of remoteCategories) {
        // Check if category exists locally
        const localCat = await db
          .select()
          .from(categories)
          .where(eq(categories.id, rc.id))
          .limit(1)
          .execute();

        const catData = {
          name: rc.name,
          type: rc.type,
          color: rc.color,
          icon: rc.icon,
          budget: rc.budget,
          budgetType: rc.budget_type,
          synced: true,
        };

        if (localCat.length > 0) {
          await db
            .update(categories)
            .set(catData)
            .where(eq(categories.id, rc.id))
            .execute();
        } else {
          await db
            .insert(categories)
            .values({ id: rc.id, ...catData })
            .execute();
        }
      }
    }

    // 2. Fetch remote transactions
    const { data: remoteTransactions, error: txError } = await supabase
      .from('transactions')
      .select('*');

    if (txError) {
      console.error('Failed to fetch remote transactions:', txError);
    } else if (remoteTransactions) {
      for (const rt of remoteTransactions) {
        const localTx = await db
          .select()
          .from(transactions)
          .where(eq(transactions.id, rt.id))
          .limit(1)
          .execute();

        const txData = {
          amount: parseFloat(rt.amount),
          date: new Date(rt.date),
          note: rt.note,
          categoryId: rt.category_id,
          type: rt.type,
          currency: rt.currency,
          synced: true,
        };

        if (localTx.length > 0) {
          await db
            .update(transactions)
            .set(txData)
            .where(eq(transactions.id, rt.id))
            .execute();
        } else {
          await db
            .insert(transactions)
            .values({ id: rt.id, ...txData })
            .execute();
        }
      }
    }
  } catch (error) {
    console.error('Error in syncDown:', error);
  }
}

/**
 * High level sync task: upload first, then download
 */
export async function syncAll() {
  await syncUp();
  await syncDown();
}

/**
 * Handle remote deletions immediately if online
 */
export async function deleteRemoteTransaction(id) {
  try {
    if (!isSupabaseConfigured()) return;
    const session = await getSession();
    if (!session) return;

    await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
  } catch (error) {
    console.error('Error deleting remote transaction:', error);
  }
}

export async function deleteRemoteCategory(id) {
  try {
    if (!isSupabaseConfigured()) return;
    const session = await getSession();
    if (!session) return;

    await supabase
      .from('categories')
      .delete()
      .eq('id', id);
  } catch (error) {
    console.error('Error deleting remote category:', error);
  }
}

/**
 * Clear local DB profile and restore default categories (e.g. on logout)
 */
export async function clearLocalData() {
  try {
    await db.delete(transactions).execute();
    await db.delete(categories).execute();
    await db.delete(users).execute();

    // Re-seed defaults
    for (const cat of defaultCategories) {
      await db.insert(categories).values(cat).execute();
    }
  } catch (error) {
    console.error('Failed to clear local data:', error);
  }
}
