import * as FileSystem from 'expo-file-system/legacy';
import { supabase, isSupabaseConfigured } from '../db/supabase';

const RECEIPTS_BUCKET = 'receipts';

/**
 * Upload a receipt image to Supabase Storage
 * Only runs if user is authenticated and Supabase is configured
 * @param {string} localUri - Local filesystem path to the receipt
 * @param {number} transactionId - Transaction ID
 * @returns {Promise<string|null>} Remote storage path or null
 */
export async function syncReceiptToCloud(localUri, transactionId) {
  if (!isSupabaseConfigured() || !localUri) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const userId = session.user.id;
    const extension = localUri.split('.').pop() || 'jpg';
    const remotePath = `${userId}/${transactionId}.${extension}`;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: 'base64',
    });

    // Convert base64 to Uint8Array for upload
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const { error } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .upload(remotePath, bytes.buffer, {
        contentType: extension === 'pdf' ? 'application/pdf' : `image/${extension === 'png' ? 'png' : 'jpeg'}`,
        upsert: true,
      });

    if (error) {
      console.log('Receipt cloud sync failed:', error.message);
      return null;
    }

    console.log('Receipt synced to cloud:', remotePath);
    return remotePath;
  } catch (error) {
    console.log('Receipt cloud sync error:', error);
    return null;
  }
}

/**
 * Download a receipt from Supabase Storage if local copy is missing
 * @param {number} transactionId - Transaction ID
 * @param {string} localDir - Local receipts directory
 * @returns {Promise<string|null>} Local file path or null
 */
export async function downloadReceiptFromCloud(transactionId, localDir) {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const userId = session.user.id;

    // Try common extensions including pdf
    for (const ext of ['jpg', 'jpeg', 'png', 'pdf']) {
      const remotePath = `${userId}/${transactionId}.${ext}`;

      const { data, error } = await supabase.storage
        .from(RECEIPTS_BUCKET)
        .download(remotePath);

      if (!error && data) {
        const localPath = `${localDir}receipt_${transactionId}_cloud.${ext}`;
        
        // Convert blob to base64 and save
        const reader = new FileReader();
        const base64Promise = new Promise((resolve) => {
          reader.onloadend = () => {
            const base64data = reader.result.split(',')[1];
            resolve(base64data);
          };
          reader.readAsDataURL(data);
        });

        const base64 = await base64Promise;
        await FileSystem.writeAsStringAsync(localPath, base64, {
          encoding: 'base64',
        });

        return localPath;
      }
    }

    return null;
  } catch (error) {
    console.log('Receipt cloud download error:', error);
    return null;
  }
}

/**
 * Delete a receipt from Supabase Storage
 * @param {number} transactionId - Transaction ID
 */
export async function deleteReceiptFromCloud(transactionId) {
  if (!isSupabaseConfigured()) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const userId = session.user.id;

    // Try to delete common extensions
    const paths = ['jpg', 'jpeg', 'png', 'pdf'].map(
      ext => `${userId}/${transactionId}.${ext}`
    );

    await supabase.storage
      .from(RECEIPTS_BUCKET)
      .remove(paths);
  } catch (error) {
    console.log('Receipt cloud delete error:', error);
  }
}
