import { MongoClient, ObjectId } from "mongodb";

interface OldOrder {
  _id: ObjectId;
  customerId: ObjectId;
  customerName: string;
  customerPhone: string;
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  tableNumber?: string;
  floorNumber?: string;
  orderDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

async function consolidateCustomerOrders() {
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

    const allOrders = await ordersCollection.find({}).toArray() as unknown as OldOrder[];
    
    console.log(`Found ${allOrders.length} order documents`);

    const customerOrdersMap = new Map<string, OldOrder[]>();
    
    for (const order of allOrders) {
      const customerIdStr = order.customerId.toString();
      
      if (!customerOrdersMap.has(customerIdStr)) {
        customerOrdersMap.set(customerIdStr, []);
      }
      
      customerOrdersMap.get(customerIdStr)!.push(order);
    }

    console.log(`Found ${customerOrdersMap.size} unique customers`);

    const customersToConsolidate = Array.from(customerOrdersMap.entries()).filter(
      ([_, orders]) => orders.length > 1
    );

    if (customersToConsolidate.length === 0) {
      console.log("No customers with multiple order documents found. Migration not needed.");
      return;
    }

    console.log(`Consolidating ${customersToConsolidate.length} customers with duplicate order documents`);

    const bulkOps = [];
    
    for (const [customerIdStr, orders] of customersToConsolidate) {
      const firstOrder = orders[0];
      const orderIds = orders.map(o => o._id);
      
      const orderEntries = orders.map(order => ({
        _id: order._id,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        tableNumber: order.tableNumber,
        floorNumber: order.floorNumber,
        orderDate: order.orderDate,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }));

      const consolidatedDoc = {
        _id: new ObjectId(),
        customerId: firstOrder.customerId,
        customerName: firstOrder.customerName,
        customerPhone: firstOrder.customerPhone,
        orders: orderEntries,
        createdAt: firstOrder.createdAt,
        updatedAt: new Date(),
      };

      bulkOps.push({
        insertOne: {
          document: consolidatedDoc
        }
      });
      
      bulkOps.push({
        deleteMany: {
          filter: { _id: { $in: orderIds } }
        }
      });
      
      console.log(`Queued consolidation of ${orders.length} orders for customer ${firstOrder.customerName} (${firstOrder.customerPhone})`);
    }
    
    if (bulkOps.length > 0) {
      console.log(`Executing ${bulkOps.length} bulk operations...`);
      await ordersCollection.bulkWrite(bulkOps, { ordered: true });
      console.log("✅ All bulk operations completed successfully");
    }

    console.log("Migration completed successfully!");
    console.log(`Consolidated ${customersToConsolidate.length} customers`);

  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

consolidateCustomerOrders()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
