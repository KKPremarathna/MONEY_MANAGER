import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { categories, defaultCategories } from './schema';
import { eq } from 'drizzle-orm';

const expo = openDatabaseSync('money_manager.db', { enableChangeListener: true });
export const db = drizzle(expo);

export const seedDatabase = async () => {
  try {
    // Check if categories already exist
    const existingCategories = await db.select().from(categories).limit(1);
    
    if (existingCategories.length === 0) {
      console.log('Seeding default categories...');
      for (const cat of defaultCategories) {
        await db.insert(categories).values(cat);
      }
      console.log('Seeding complete.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
