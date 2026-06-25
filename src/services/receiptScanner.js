import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
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
 * Analyze a receipt image using Gemini AI
 * @param {string} imageUri - Local URI of the receipt image
 * @param {Array} categories - User's existing categories [{id, name, type, icon, color}]
 * @returns {Promise<{amount: number|null, categoryName: string|null, note: string|null, date: string|null}>}
 */
export async function analyzeReceipt(imageUri, categories) {
  if (!GEMINI_API_KEY) {
    console.log('No Gemini API key configured — skipping receipt analysis');
    return { amount: null, categoryName: null, note: null, date: null };
  }

  try {
    // Read the file as base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    const isPdf = imageUri.toLowerCase().endsWith('.pdf');
    const mimeType = isPdf ? 'application/pdf' : 'image/jpeg';

    // Build category name list for the prompt
    const categoryNames = categories.map(c => c.name).join(', ');

    const prompt = `You are a receipt/bill analysis assistant. Analyze this receipt image and extract the following details.

Available expense categories: ${categoryNames}

Return ONLY a valid JSON object (no markdown, no code blocks) with these fields:
{
  "amount": <total amount as a number, or null if not found>,
  "categoryName": "<best matching category from the list above, or null if unclear>",
  "note": "<merchant/store name and brief description of purchase, or null>",
  "date": "<date from receipt in YYYY-MM-DD format, or null if not visible>"
}

Important rules:
- For amount, extract the TOTAL / GRAND TOTAL / NET amount (not individual item prices)
- For categoryName, pick the BEST match from the provided categories list only
- For note, be concise (e.g. "Keells Super - Groceries", "Dialog - Mobile Bill")
- If the image is not a receipt/bill, return all null values
- Return ONLY the JSON object, nothing else`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return { amount: null, categoryName: null, note: null, date: null };
    }

    const data = await response.json();
    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      console.log('No text content in Gemini response');
      return { amount: null, categoryName: null, note: null, date: null };
    }

    // Parse the JSON response — handle potential markdown wrapping
    let cleanJson = textContent.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanJson);

    return {
      amount: typeof parsed.amount === 'number' ? parsed.amount : null,
      categoryName: typeof parsed.categoryName === 'string' ? parsed.categoryName : null,
      note: typeof parsed.note === 'string' ? parsed.note : null,
      date: typeof parsed.date === 'string' ? parsed.date : null,
    };
  } catch (error) {
    console.error('Receipt analysis failed:', error);
    return { amount: null, categoryName: null, note: null, date: null };
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

/**
 * Check if Gemini API key is configured
 * @returns {boolean}
 */
export function isGeminiConfigured() {
  return GEMINI_API_KEY && GEMINI_API_KEY.length > 0;
}
