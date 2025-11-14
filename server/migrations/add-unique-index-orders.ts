import { MongoClient } from "mongodb";

async function addUniqueIndexToOrders() {
  const connectionString = process.env.MONGODB_URI || process.env.DATABASE_URL || "";
  
  if (!connectionString) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  const client = new MongoClient(connectionString);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("restaurant_pos");
    const ordersCollection = db.collection("digital_menu_customer_orders");

    console.log("Creating unique index on customerId...");
    await ordersCollection.createIndex(
      { customerId: 1 },
      { unique: true, name: "customerId_unique" }
    );
    
    console.log("✅ Unique index created successfully on customerId");
    console.log("This ensures each customer can only have ONE document in the collection");

  } catch (error: any) {
    if (error.code === 85 || error.codeName === "IndexOptionsConflict") {
      console.log("⚠️  Unique index already exists on customerId");
    } else if (error.code === 11000) {
      console.error("❌ Cannot create unique index - duplicate customerId values exist!");
      console.error("Please run the consolidate-customer-orders migration first");
      throw error;
    } else {
      console.error("Migration failed:", error);
      throw error;
    }
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

addUniqueIndexToOrders()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
