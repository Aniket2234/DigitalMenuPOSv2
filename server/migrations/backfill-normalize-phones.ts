import { MongoClient } from 'mongodb';

const connectionString = process.env.MONGODB_URI || process.env.DATABASE_URL || "";
if (!connectionString) {
  console.error("MONGODB_URI environment variable is not set");
  process.exit(1);
}

function normalizePhoneNumber(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length > 10) {
    return digitsOnly.slice(-10);
  }
  return digitsOnly;
}

async function backfillPhoneNumbers() {
  const client = new MongoClient(connectionString);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('restaurant_pos');
    const customersCollection = db.collection('customers');
    
    const customers = await customersCollection.find({}).toArray();
    console.log(`Found ${customers.length} customers to process`);
    
    let updated = 0;
    let skipped = 0;
    for (const customer of customers) {
      if (!customer.phoneNumber) {
        console.log(`Skipping customer ${customer._id}: no phone number`);
        skipped++;
        continue;
      }
      
      const normalizedPhone = normalizePhoneNumber(customer.phoneNumber);
      
      if (customer.phoneNumber !== normalizedPhone) {
        await customersCollection.updateOne(
          { _id: customer._id },
          { $set: { phoneNumber: normalizedPhone } }
        );
        console.log(`Updated customer ${customer._id}: ${customer.phoneNumber} -> ${normalizedPhone}`);
        updated++;
      }
    }
    
    console.log(`Backfill complete. Updated ${updated} customers, skipped ${skipped} customers without phone numbers.`);
    
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

backfillPhoneNumbers();
