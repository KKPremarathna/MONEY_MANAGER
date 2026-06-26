import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { setSkipNextBackgroundLock } from '../utils/lockManager';

const RECEIPTS_DIR = FileSystem.documentDirectory + 'receipts/';

/**
 * Ensure the receipts directory exists
 */
async function ensureReceiptsDir() {
  const dirInfo = await FileSystem.getInfoAsync(RECEIPTS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(RECEIPTS_DIR, { intermediates: true });
  }
}

/**
 * Pick a receipt image from camera or gallery
 * @param {'camera' | 'gallery'} source
 * @returns {Promise<string|null>} Image URI or null if cancelled
 */
export async function pickReceiptImage(source) {
  let result;

  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission is required to scan receipts.');
    }

    setSkipNextBackgroundLock(true);
    result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Gallery permission is required to select receipt images.');
    }

    setSkipNextBackgroundLock(true);
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
  }

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return result.assets[0].uri;
}

/**
 * Pick a receipt document (PDF) from the file system
 * @returns {Promise<string|null>} Document URI or null if cancelled
 */
export async function pickReceiptDocument() {
  try {
    setSkipNextBackgroundLock(true);
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('Failed to pick document:', error);
    return null;
  }
}

/**
 * Save a receipt image to persistent local storage
 * @param {string} tempUri - Temporary URI from image picker
 * @param {number} transactionId - Transaction ID to associate with
 * @returns {Promise<string>} Persistent local URI
 */
export async function saveReceiptLocally(tempUri, transactionId) {
  await ensureReceiptsDir();

  const extension = tempUri.split('.').pop() || 'jpg';
  const filename = `receipt_${transactionId}_${Date.now()}.${extension}`;
  const destUri = RECEIPTS_DIR + filename;

  await FileSystem.copyAsync({
    from: tempUri,
    to: destUri,
  });

  return destUri;
}

/**
 * Delete a receipt image from local storage
 * @param {string} receiptUri - Local URI of the receipt
 */
export async function deleteReceiptLocally(receiptUri) {
  if (!receiptUri) return;

  try {
    const fileInfo = await FileSystem.getInfoAsync(receiptUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(receiptUri, { idempotent: true });
    }
  } catch (error) {
    console.error('Failed to delete receipt:', error);
  }
}

