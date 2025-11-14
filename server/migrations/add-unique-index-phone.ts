import { MongoClient } from 'mongodb';

const connectionString = process.env.MONGODB_URI || process.env.DATABASE_URL || "";
if (!connectionString) {
  console.error("MONGODB_URI environment variable is not set");
  process.exit(1);
}

async function addUniqueIndex() {
  const client = new MongoClient(connectionString);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('restaurant_pos');
    const customersCollection = db.collection('customers');
    
    const existingIndexes = await customersCollection.indexes();
    const hasUniqueIndex = existingIndexes.some(
      index => index.key.phoneNumber === 1 && index.unique === true
    );
    
    if (!hasUniqueIndex) {
      console.log('Creating unique index on phoneNumber...');
      await customersCollection.createIndex(
        { phoneNumber: 1 },
        { unique: true }
      );
      console.log('Unique index created successfully');
    } else {
      console.log('Unique index already exists');
    }
    
    await customersCollection.updateMany(
      { favorites: { $exists: false } },
      { $set: { favorites: [] } }
    );
    console.log('Migrated existing customers to include favorites field');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

addUniqueIndex();
