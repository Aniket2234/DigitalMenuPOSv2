// import { MongoClient, Db, Collection, ObjectId } from "mongodb";
// import { type User, type InsertUser, type MenuItem, type InsertMenuItem, type CartItem, type InsertCartItem } from "@shared/schema";

// export interface IStorage {
//   getUser(id: string): Promise<User | undefined>;
//   getUserByUsername(username: string): Promise<User | undefined>;
//   createUser(user: InsertUser): Promise<User>;

//   getMenuItems(): Promise<MenuItem[]>;
//   getMenuItemsByCategory(category: string): Promise<MenuItem[]>;
//   getMenuItem(id: string): Promise<MenuItem | undefined>;
//   getCategories(): string[];
//   addMenuItem(item: InsertMenuItem): Promise<MenuItem>;

//   getCartItems(): Promise<CartItem[]>;
//   addToCart(item: InsertCartItem): Promise<CartItem>;
//   removeFromCart(id: string): Promise<void>;
//   clearCart(): Promise<void>;
// }

// export class MongoStorage implements IStorage {
//   private client: MongoClient;
//   private db: Db;
//   private categoryCollections: Map<string, Collection<MenuItem>>;
//   private cartItemsCollection: Collection<CartItem>;
//   private usersCollection: Collection<User>;
//   private restaurantId: ObjectId;

//   // Define available categories - these match menu.tsx categories
//   private readonly categories = [
//     "soups",
//     "vegstarter",
//     "chickenstarter",
//     "prawnsstarter",
//     "seafood",
//     "springrolls",
//     "momos",
//     "gravies",
//     "potrice",
//     "rice",
//     "ricewithgravy",
//     "noodle",
//     "noodlewithgravy",
//     "thai",
//     "chopsuey",
//     "desserts",
//     "beverages",
//     "extra"
//   ];



//   constructor(connectionString: string) {
//     this.client = new MongoClient(connectionString);
//     this.db = this.client.db("mingsdb");
//     this.categoryCollections = new Map();

//     // Initialize collections for each category with correct collection names
//     const categoryCollectionMapping = {
//       "soups": "soups",
//       "vegstarter": "vegstarter",
//       "chickenstarter": "chickenstarter",
//       "prawnsstarter": "prawnsstarter",
//       "seafood": "seafood",
//       "springrolls": "springrolls",
//       "momos": "momos",
//       "gravies": "gravies",
//       "potrice": "potrice",
//       "rice": "rice",
//       "ricewithgravy": "ricewithgravy",
//       "noodle": "noodle",
//       "noodlewithgravy": "noodlewithgravy",
//       "thai": "thai",
//       "chopsuey": "chopsuey",
//       "desserts": "desserts",
//       "beverages": "beverages",
//       "extra": "extra"
//     };


//     this.categories.forEach(category => {
//       const collectionName = categoryCollectionMapping[category as keyof typeof categoryCollectionMapping];
//       this.categoryCollections.set(category, this.db.collection(collectionName));
//     });

//     this.cartItemsCollection = this.db.collection("cartitems");
//     this.usersCollection = this.db.collection("users");
//     this.restaurantId = new ObjectId("6874cff2a880250859286de6");
//   }

//   async connect() {
//     await this.client.connect();
//     await this.ensureCollectionsExist();
//   }

//   private async ensureCollectionsExist() {
//     try {
//       // Get list of existing collections
//       const existingCollections = await this.db.listCollections().toArray();
//       const existingNames = existingCollections.map(c => c.name);

//       // Create collections for categories that don't exist
//       for (const [category, collection] of this.categoryCollections) {
//         const collectionName = collection.collectionName;
//         if (!existingNames.includes(collectionName)) {
//           await this.db.createCollection(collectionName);
//           console.log(`Created collection: ${collectionName} for category: ${category}`);
//         }
//       }
//     } catch (error) {
//       console.error("Error ensuring collections exist:", error);
//     }
//   }

//   async getUser(id: string): Promise<User | undefined> {
//     try {
//       const user = await this.usersCollection.findOne({ _id: new ObjectId(id) });
//       return user || undefined;
//     } catch (error) {
//       console.error("Error getting user:", error);
//       return undefined;
//     }
//   }

//   async getUserByUsername(username: string): Promise<User | undefined> {
//     try {
//       const user = await this.usersCollection.findOne({ username });
//       return user || undefined;
//     } catch (error) {
//       console.error("Error getting user by username:", error);
//       return undefined;
//     }
//   }

//   async createUser(insertUser: InsertUser): Promise<User> {
//     try {
//       const now = new Date();
//       const user: Omit<User, '_id'> = {
//         ...insertUser,
//         createdAt: now,
//         updatedAt: now,
//       };

//       const result = await this.usersCollection.insertOne(user as User);
//       return {
//         _id: result.insertedId,
//         ...user,
//       } as User;
//     } catch (error) {
//       console.error("Error creating user:", error);
//       throw error;
//     }
//   }

//   async getMenuItems(): Promise<MenuItem[]> {
//     try {
//       const allMenuItems: MenuItem[] = [];

//       // Get items from all category collections
//       for (const [category, collection] of this.categoryCollections) {
//         const items = await collection.find({}).toArray();
//         allMenuItems.push(...items);
//       }

//       // Apply custom sorting: Veg items first, then Chicken, then Prawns, then others
//       return this.sortMenuItems(allMenuItems);
//     } catch (error) {
//       console.error("Error getting menu items:", error);
//       return [];
//     }
//   }

//   async getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
//     try {
//       const collection = this.categoryCollections.get(category);
//       if (!collection) {
//         console.error(`Category "${category}" not found`);
//         return [];
//       }

//       const menuItems = await collection.find({}).toArray();
//       // Apply custom sorting: Veg items first, then Chicken, then Prawns, then others
//       return this.sortMenuItems(menuItems);
//     } catch (error) {
//       console.error("Error getting menu items by category:", error);
//       return [];
//     }
//   }

//   async getMenuItem(id: string): Promise<MenuItem | undefined> {
//     try {
//       // Search across all category collections
//       for (const [category, collection] of this.categoryCollections) {
//         const menuItem = await collection.findOne({ _id: new ObjectId(id) });
//         if (menuItem) {
//           return menuItem;
//         }
//       }
//       return undefined;
//     } catch (error) {
//       console.error("Error getting menu item:", error);
//       return undefined;
//     }
//   }

//   getCategories(): string[] {
//     return [...this.categories];
//   }

//   async addMenuItem(item: InsertMenuItem): Promise<MenuItem> {
//     try {
//       const collection = this.categoryCollections.get(item.category);
//       if (!collection) {
//         throw new Error(`Category "${item.category}" not found`);
//       }

//       const now = new Date();
//       const menuItem: Omit<MenuItem, '_id'> = {
//         ...item,
//         restaurantId: this.restaurantId,
//         createdAt: now,
//         updatedAt: now,
//         __v: 0
//       };

//       const result = await collection.insertOne(menuItem as MenuItem);
//       return {
//         _id: result.insertedId,
//         ...menuItem,
//       } as MenuItem;
//     } catch (error) {
//       console.error("Error adding menu item:", error);
//       throw error;
//     }
//   }

//   async getCartItems(): Promise<CartItem[]> {
//     try {
//       const cartItems = await this.cartItemsCollection.find({}).toArray();
//       return cartItems;
//     } catch (error) {
//       console.error("Error getting cart items:", error);
//       return [];
//     }
//   }

//   async addToCart(item: InsertCartItem): Promise<CartItem> {
//     try {
//       const menuItemObjectId = new ObjectId(item.menuItemId);
//       const existing = await this.cartItemsCollection.findOne({ menuItemId: menuItemObjectId });

//       if (existing) {
//         const updatedCart = await this.cartItemsCollection.findOneAndUpdate(
//           { _id: existing._id },
//           {
//             $inc: { quantity: item.quantity || 1 },
//             $set: { updatedAt: new Date() }
//           },
//           { returnDocument: 'after' }
//         );
//         return updatedCart!;
//       }

//       const now = new Date();
//       const cartItem: Omit<CartItem, '_id'> = {
//         menuItemId: menuItemObjectId,
//         quantity: item.quantity || 1,
//         createdAt: now,
//         updatedAt: now,
//       };

//       const result = await this.cartItemsCollection.insertOne(cartItem as CartItem);
//       return {
//         _id: result.insertedId,
//         ...cartItem,
//       } as CartItem;
//     } catch (error) {
//       console.error("Error adding to cart:", error);
//       throw error;
//     }
//   }

//   async removeFromCart(id: string): Promise<void> {
//     try {
//       await this.cartItemsCollection.deleteOne({ _id: new ObjectId(id) });
//     } catch (error) {
//       console.error("Error removing from cart:", error);
//       throw error;
//     }
//   }

//   async clearCart(): Promise<void> {
//     try {
//       await this.cartItemsCollection.deleteMany({});
//     } catch (error) {
//       console.error("Error clearing cart:", error);
//       throw error;
//     }
//   }

//   private sortMenuItems(items: MenuItem[]): MenuItem[] {
//     return items.sort((a, b) => {
//       const aName = a.name.toLowerCase();
//       const bName = b.name.toLowerCase();
      
//       // First priority: Veg items before non-veg items
//       if (a.isVeg !== b.isVeg) {
//         return a.isVeg ? -1 : 1; // Veg items first
//       }
      
//       // Second priority: Within same veg/non-veg category, sort by name type
//       const getSortOrder = (name: string): number => {
//         if (name.startsWith('veg')) return 1;
//         if (name.startsWith('chicken')) return 2;
//         if (name.startsWith('prawns') || name.startsWith('prawn')) return 3;
//         return 4;
//       };
      
//       const aOrder = getSortOrder(aName);
//       const bOrder = getSortOrder(bName);
      
//       // If same sort order, sort alphabetically
//       if (aOrder === bOrder) {
//         return aName.localeCompare(bName);
//       }
      
//       return aOrder - bOrder;
//     });
//   }
// }

// const connectionString = "mongodb+srv://airavatatechnologiesprojects:8tJ6v8oTyQE1AwLV@mingsdb.mmjpnwc.mongodb.net/?retryWrites=true&w=majority&appName=MINGSDB";
// export const storage = new MongoStorage(connectionString);
import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { type User, type InsertUser, type MenuItem, type InsertMenuItem, type CartItem, type InsertCartItem, type Customer, type InsertCustomer, type Order, type InsertOrder, type OrderEntry, type CustomerOrderHistory } from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(category: string): Promise<MenuItem[]>;
  getMenuItem(id: string): Promise<MenuItem | undefined>;
  getCategories(): string[];
  addMenuItem(item: InsertMenuItem): Promise<MenuItem>;

  getCartItems(): Promise<CartItem[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  removeFromCart(id: string): Promise<void>;
  clearCart(): Promise<void>;

  getCustomerByPhone(phoneNumber: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomerName(phoneNumber: string, name: string): Promise<Customer | undefined>;
  incrementVisitCount(phoneNumber: string): Promise<void>;
  updateLoginStatus(phoneNumber: string, loginStatus: 'loggedin' | 'loggedout'): Promise<Customer | undefined>;
  updateCustomerTableInfo(phoneNumber: string, tableNumber: string, floorNumber: string): Promise<Customer | undefined>;

  createOrder(order: InsertOrder): Promise<Order>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: Order['status']): Promise<void>;
  updatePaymentStatus(id: string, paymentStatus: Order['paymentStatus'], paymentMethod?: string): Promise<void>;
  deleteOrderFromHistory(customerId: string, orderId: string): Promise<void>;
  deleteAllOrdersFromHistory(customerId: string): Promise<void>;
  addFavorite(customerId: string, menuItemId: string): Promise<void>;
  removeFavorite(customerId: string, menuItemId: string): Promise<void>;
  getCustomerFavorites(customerId: string): Promise<string[]>;
}

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private categoryCollections: Map<string, Collection<MenuItem>>;
  private cartItemsCollection: Collection<CartItem>;
  private usersCollection: Collection<User>;
  private customersCollection: Collection<Customer>;
  private ordersCollection: Collection<Order>;
  private restaurantId: ObjectId;
  
  // Collection name for digital menu orders (separate from POS software orders)
  private readonly DIGITAL_MENU_ORDERS_COLLECTION = "digital_menu_customer_orders";

  // Define available categories - these match menu.tsx categories
  private readonly categories = [
    "new",
    "soups",
    "vegstarter",
    "chickenstarter",
    "prawnsstarter",
    "seafood",
    "springrolls",
    "momos",
    "gravies",
    "potrice",
    "rice",
    "ricewithgravy",
    "noodle",
    "noodlewithgravy",
    "thai",
    "chopsuey",
    "desserts",
    "beverages",
    "extra"
  ];



  constructor(connectionString: string) {
    this.client = new MongoClient(connectionString);
    this.db = this.client.db("restaurant_pos");
    this.categoryCollections = new Map();

    // Initialize collections for each category with correct collection names
    const categoryCollectionMapping = {
      "new": "new",
      "soups": "soups",
      "vegstarter": "vegstarter",
      "chickenstarter": "chickenstarter",
      "prawnsstarter": "prawnsstarter",
      "seafood": "seafood",
      "springrolls": "springrolls",
      "momos": "momos",
      "gravies": "gravies",
      "potrice": "potrice",
      "rice": "rice",
      "ricewithgravy": "ricewithgravy",
      "noodle": "noodle",
      "noodlewithgravy": "noodlewithgravy",
      "thai": "thai",
      "chopsuey": "chopsuey",
      "desserts": "desserts",
      "beverages": "beverages",
      "extra": "extra"
    };


    this.categories.forEach(category => {
      const collectionName = categoryCollectionMapping[category as keyof typeof categoryCollectionMapping];
      this.categoryCollections.set(category, this.db.collection(collectionName));
    });

    this.cartItemsCollection = this.db.collection("cartitems");
    this.usersCollection = this.db.collection("users");
    this.customersCollection = this.db.collection("customers");
    // Use separate collection for digital menu orders to avoid conflicts with POS software
    this.ordersCollection = this.db.collection(this.DIGITAL_MENU_ORDERS_COLLECTION);
    this.restaurantId = new ObjectId("6874cff2a880250859286de6");
  }

  async connect() {
    await this.client.connect();
    // DISABLED: Auto-creation of collections to prevent database modifications
    // await this.ensureCollectionsExist();
    
    // Run migration to ensure all customer documents have required fields
    await this.migrateCustomerFields();
  }

  /**
   * Migration function to backfill missing fields in existing customer documents
   * This ensures all customers have the complete schema as defined in DIGITAL_MENU_STORAGE.md
   */
  private async migrateCustomerFields(): Promise<void> {
    try {
      console.log('[Migration] Starting customer fields backfill...');
      const now = new Date();
      
      // Update all customer documents to ensure they have all required fields
      // Using $set with conditional logic to avoid overwriting existing values
      const result = await this.customersCollection.updateMany(
        {}, // Match all documents
        [
          {
            $set: {
              // Only set if field doesn't exist
              visitCount: { $ifNull: ['$visitCount', 1] },
              favorites: { $ifNull: ['$favorites', []] },
              firstVisit: { $ifNull: ['$firstVisit', now] },
              lastVisit: { $ifNull: ['$lastVisit', now] },
              loginStatus: { $ifNull: ['$loginStatus', 'loggedout'] },
              tableNumber: { $ifNull: ['$tableNumber', 'NA'] },
              floorNumber: { $ifNull: ['$floorNumber', 'NA'] },
              tableStatus: { $ifNull: ['$tableStatus', 'free'] },
              currentOrder: { $ifNull: ['$currentOrder', null] },
              orderHistory: { $ifNull: ['$orderHistory', []] },
              createdAt: { $ifNull: ['$createdAt', now] },
              updatedAt: { $ifNull: ['$updatedAt', now] },
            }
          }
        ]
      );

      console.log(`[Migration] Customer fields migration complete:
        - Matched: ${result.matchedCount} documents
        - Modified: ${result.modifiedCount} documents`);

      // Remove deprecated tableName field from all documents
      console.log('[Migration] Removing deprecated tableName field...');
      const removeResult = await this.customersCollection.updateMany(
        { tableName: { $exists: true } },
        { $unset: { tableName: "" } }
      );
      console.log(`[Migration] Removed tableName from ${removeResult.modifiedCount} documents`);
        
    } catch (error) {
      console.error('[Migration] Error during customer fields migration:', error);
      // Don't throw - allow server to start even if migration fails
      // The migration will be retried on next server restart
    }
  }

  private async ensureCollectionsExist() {
    // DISABLED: This method is no longer called to prevent auto-creation of collections
    // The database should already have all necessary collections
    console.log("Auto-collection creation is disabled - using existing collections only");
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      const user = await this.usersCollection.findOne({ _id: new ObjectId(id) });
      return user || undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await this.usersCollection.findOne({ username });
      return user || undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const now = new Date();
      const user: Omit<User, '_id'> = {
        ...insertUser,
        createdAt: now,
        updatedAt: now,
      };

      const result = await this.usersCollection.insertOne(user as User);
      return {
        _id: result.insertedId,
        ...user,
      } as User;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async getMenuItems(): Promise<MenuItem[]> {
    try {
      // Fetch all menu items from single menuItems collection
      const menuItemsCollection = this.db.collection("menuItems");
      const allMenuItems = await menuItemsCollection.find({}).toArray();

      // Apply custom sorting: Veg items first, then Chicken, then Prawns, then others
      return this.sortMenuItems(allMenuItems as any);
    } catch (error) {
      console.error("Error getting menu items:", error);
      return [];
    }
  }

  async getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
    try {
      // Fetch menu items filtered by category from single menuItems collection
      const menuItemsCollection = this.db.collection("menuItems");
      const menuItems = await menuItemsCollection.find({ category }).toArray();
      
      // Apply custom sorting: Veg items first, then Chicken, then Prawns, then others
      return this.sortMenuItems(menuItems as any);
    } catch (error) {
      console.error("Error getting menu items by category:", error);
      return [];
    }
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    try {
      // Search in menuItems collection by id field (not _id)
      const menuItemsCollection = this.db.collection("menuItems");
      const menuItem = await menuItemsCollection.findOne({ id });
      return menuItem as any || undefined;
    } catch (error) {
      console.error("Error getting menu item:", error);
      return undefined;
    }
  }

  getCategories(): string[] {
    return [...this.categories];
  }

  async addMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    try {
      const menuItemsCollection = this.db.collection("menuItems");
      const now = new Date();
      const menuItem: Omit<MenuItem, '_id'> = {
        ...item,
        restaurantId: this.restaurantId,
        createdAt: now,
        updatedAt: now,
        __v: 0
      };

      const result = await menuItemsCollection.insertOne(menuItem as MenuItem);
      return {
        _id: result.insertedId,
        ...menuItem,
      } as MenuItem;
    } catch (error) {
      console.error("Error adding menu item:", error);
      throw error;
    }
  }

  async getCartItems(): Promise<CartItem[]> {
    try {
      const cartItems = await this.cartItemsCollection.find({}).toArray();
      return cartItems;
    } catch (error) {
      console.error("Error getting cart items:", error);
      return [];
    }
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    try {
      const menuItemObjectId = new ObjectId(item.menuItemId);
      const existing = await this.cartItemsCollection.findOne({ menuItemId: menuItemObjectId });

      if (existing) {
        const updatedCart = await this.cartItemsCollection.findOneAndUpdate(
          { _id: existing._id },
          {
            $inc: { quantity: item.quantity || 1 },
            $set: { updatedAt: new Date() }
          },
          { returnDocument: 'after' }
        );
        return updatedCart!;
      }

      const now = new Date();
      const cartItem: Omit<CartItem, '_id'> = {
        menuItemId: menuItemObjectId,
        quantity: item.quantity || 1,
        createdAt: now,
        updatedAt: now,
      };

      const result = await this.cartItemsCollection.insertOne(cartItem as CartItem);
      return {
        _id: result.insertedId,
        ...cartItem,
      } as CartItem;
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  }

  async removeFromCart(id: string): Promise<void> {
    try {
      await this.cartItemsCollection.deleteOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  }

  async clearCart(): Promise<void> {
    try {
      await this.cartItemsCollection.deleteMany({});
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  }

  async getCustomerByPhone(phoneNumber: string): Promise<Customer | undefined> {
    try {
      const customer = await this.customersCollection.findOne({ phoneNumber });
      console.log('[getCustomerByPhone] Phone:', phoneNumber);
      console.log('[getCustomerByPhone] Customer found:', !!customer);
      console.log('[getCustomerByPhone] Customer currentOrder:', customer?.currentOrder);
      console.log('[getCustomerByPhone] Customer ID:', customer?._id);
      return customer || undefined;
    } catch (error) {
      console.error("Error getting customer by phone:", error);
      return undefined;
    }
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    try {
      const now = new Date();
      const customer: Omit<Customer, '_id'> = {
        ...insertCustomer,
        visitCount: 1,
        favorites: [],
        firstVisit: now,
        lastVisit: now,
        loginStatus: 'loggedin',
        tableNumber: 'NA',
        floorNumber: 'NA',
        tableStatus: 'free',
        currentOrder: null,
        orderHistory: [],
        createdAt: now,
        updatedAt: now,
      };

      const result = await this.customersCollection.insertOne(customer as Customer);
      return {
        _id: result.insertedId,
        ...customer,
      } as Customer;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  }

  async updateCustomerName(phoneNumber: string, name: string): Promise<Customer | undefined> {
    try {
      const now = new Date();
      const updatedCustomer = await this.customersCollection.findOneAndUpdate(
        { phoneNumber },
        {
          $set: { name, updatedAt: now }
        },
        { returnDocument: 'after' }
      );
      return updatedCustomer || undefined;
    } catch (error) {
      console.error("Error updating customer name:", error);
      return undefined;
    }
  }

  async incrementVisitCount(phoneNumber: string): Promise<void> {
    try {
      const { shouldIncrementVisit } = await import("@shared/utils/timezone");
      
      const customer = await this.getCustomerByPhone(phoneNumber);
      if (!customer) {
        throw new Error("Customer not found");
      }

      if (shouldIncrementVisit(customer.lastVisit)) {
        const now = new Date();
        await this.customersCollection.updateOne(
          { phoneNumber },
          {
            $inc: { visitCount: 1 },
            $set: { lastVisit: now, updatedAt: now }
          }
        );
      }
    } catch (error) {
      console.error("Error incrementing visit count:", error);
      throw error;
    }
  }

  async updateLoginStatus(phoneNumber: string, loginStatus: 'loggedin' | 'loggedout'): Promise<Customer | undefined> {
    try {
      const now = new Date();
      const updateFields: any = { 
        loginStatus, 
        updatedAt: now 
      };
      
      // Reset table, floor, and currentOrder when logging out
      if (loginStatus === 'loggedout') {
        updateFields.tableNumber = 'NA';
        updateFields.floorNumber = 'NA';
        updateFields.currentOrder = null;
      }
      
      const updatedCustomer = await this.customersCollection.findOneAndUpdate(
        { phoneNumber },
        { $set: updateFields },
        { returnDocument: 'after' }
      );
      return updatedCustomer || undefined;
    } catch (error) {
      console.error("Error updating login status:", error);
      return undefined;
    }
  }

  async updateCustomerTableInfo(phoneNumber: string, tableNumber: string, floorNumber: string): Promise<Customer | undefined> {
    try {
      const now = new Date();
      const maskedPhone = phoneNumber.slice(0, 3) + '*'.repeat(phoneNumber.length - 3);
      console.log(`[Storage] Updating customer table info for phone: ${maskedPhone}, tableNumber: ${tableNumber}, floorNumber: ${floorNumber}`);
      const updatedCustomer = await this.customersCollection.findOneAndUpdate(
        { phoneNumber },
        {
          $set: { 
            tableNumber,
            floorNumber, 
            updatedAt: now 
          }
        },
        { returnDocument: 'after' }
      );
      if (updatedCustomer) {
        console.log(`[Storage] Successfully updated customer - tableNumber: ${updatedCustomer.tableNumber}, floorNumber: ${updatedCustomer.floorNumber}`);
      } else {
        console.log(`[Storage] Customer not found for phone: ${maskedPhone}`);
      }
      return updatedCustomer || undefined;
    } catch (error) {
      console.error("Error updating customer table info:", error);
      return undefined;
    }
  }

  async updateCustomerTableStatus(phoneNumber: string, tableStatus: 'free' | 'occupied' | 'preparing' | 'ready' | 'served'): Promise<Customer | undefined> {
    try {
      const now = new Date();
      const maskedPhone = phoneNumber.slice(0, 3) + '*'.repeat(phoneNumber.length - 3);
      console.log(`[Storage] Updating table status for phone: ${maskedPhone}, tableStatus: ${tableStatus}`);
      const updatedCustomer = await this.customersCollection.findOneAndUpdate(
        { phoneNumber },
        {
          $set: { 
            tableStatus, 
            updatedAt: now 
          }
        },
        { returnDocument: 'after' }
      );
      if (updatedCustomer) {
        console.log(`[Storage] Successfully updated table status - tableStatus: ${updatedCustomer.tableStatus}`);
      } else {
        console.log(`[Storage] Customer not found for phone: ${maskedPhone}`);
      }
      return updatedCustomer || undefined;
    } catch (error) {
      console.error("Error updating customer table status:", error);
      return undefined;
    }
  }

  async addFavorite(customerId: string, menuItemId: string): Promise<void> {
    try {
      const now = new Date();
      await this.customersCollection.updateOne(
        { _id: new ObjectId(customerId) },
        {
          $addToSet: { favorites: menuItemId },
          $set: { updatedAt: now }
        }
      );
    } catch (error) {
      console.error("Error adding favorite:", error);
      throw error;
    }
  }

  async removeFavorite(customerId: string, menuItemId: string): Promise<void> {
    try {
      const now = new Date();
      await this.customersCollection.updateOne(
        { _id: new ObjectId(customerId) },
        {
          $pull: { favorites: menuItemId },
          $set: { updatedAt: now }
        }
      );
    } catch (error) {
      console.error("Error removing favorite:", error);
      throw error;
    }
  }

  async getCustomerFavorites(customerId: string): Promise<string[]> {
    try {
      const customer = await this.customersCollection.findOne(
        { _id: new ObjectId(customerId) },
        { projection: { favorites: 1, _id: 0 } }
      );
      return customer?.favorites || [];
    } catch (error) {
      console.error("Error getting favorites:", error);
      return [];
    }
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const now = new Date();
    const orderId = new ObjectId();
    const customerId = new ObjectId(insertOrder.customerId);
    
    const orderEntry: OrderEntry = {
      _id: orderId,
      items: insertOrder.items,
      subtotal: insertOrder.subtotal,
      tax: insertOrder.tax,
      total: insertOrder.total,
      status: insertOrder.status || 'pending',
      paymentStatus: insertOrder.paymentStatus || 'pending',
      paymentMethod: insertOrder.paymentMethod,
      tableNumber: insertOrder.tableNumber,
      floorNumber: insertOrder.floorNumber,
      orderDate: now,
      createdAt: now,
      updatedAt: now,
    };

    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        await this.ordersCollection.updateOne(
          { customerId },
          {
            $setOnInsert: {
              customerId,
              customerName: insertOrder.customerName,
              customerPhone: insertOrder.customerPhone,
              createdAt: now,
            },
            $set: {
              updatedAt: now,
            },
            $push: {
              orders: orderEntry,
            },
          },
          { upsert: true }
        );
        
        // Update the customer's currentOrder field
        console.log('[Create Order] Updating customer currentOrder for customerId:', customerId.toString());
        console.log('[Create Order] Order entry:', orderEntry);
        const updateResult = await this.customersCollection.updateOne(
          { _id: customerId },
          {
            $set: {
              currentOrder: orderEntry,
              updatedAt: now,
            },
          }
        );
        console.log('[Create Order] Customer update result:', updateResult);
        console.log('[Create Order] Matched:', updateResult.matchedCount, 'Modified:', updateResult.modifiedCount);
        
        await this.incrementVisitCount(insertOrder.customerPhone);
        
        return {
          _id: orderId,
          customerId,
          customerName: insertOrder.customerName,
          customerPhone: insertOrder.customerPhone,
          items: insertOrder.items,
          subtotal: insertOrder.subtotal,
          tax: insertOrder.tax,
          total: insertOrder.total,
          status: insertOrder.status || 'pending',
          paymentStatus: insertOrder.paymentStatus || 'pending',
          paymentMethod: insertOrder.paymentMethod,
          tableNumber: insertOrder.tableNumber,
          floorNumber: insertOrder.floorNumber,
          orderDate: now,
          createdAt: now,
          updatedAt: now,
        } as Order;
      } catch (error: any) {
        if (error.code === 11000 && attempt < maxRetries - 1) {
          console.log(`Duplicate key conflict on attempt ${attempt + 1}, retrying...`);
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          continue;
        }
        console.error("Error creating order:", error);
        throw error;
      }
    }
    
    throw new Error("Failed to create order after maximum retries");
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    try {
      const customerHistory = await this.ordersCollection.findOne({
        customerId: new ObjectId(customerId),
      }) as CustomerOrderHistory | null;
      
      if (!customerHistory || !customerHistory.orders) {
        return [];
      }
      
      return customerHistory.orders.map((orderEntry) => ({
        _id: orderEntry._id,
        customerId: customerHistory.customerId,
        customerName: customerHistory.customerName,
        customerPhone: customerHistory.customerPhone,
        items: orderEntry.items,
        subtotal: orderEntry.subtotal,
        tax: orderEntry.tax,
        total: orderEntry.total,
        status: orderEntry.status,
        paymentStatus: orderEntry.paymentStatus,
        paymentMethod: orderEntry.paymentMethod,
        tableNumber: orderEntry.tableNumber,
        floorNumber: orderEntry.floorNumber,
        orderDate: orderEntry.orderDate,
        createdAt: orderEntry.createdAt,
        updatedAt: orderEntry.updatedAt,
      })).sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
    } catch (error) {
      console.error("Error getting orders by customer:", error);
      return [];
    }
  }

  async getOrder(id: string): Promise<Order | undefined> {
    try {
      const orderId = new ObjectId(id);
      const customerHistory = await this.ordersCollection.findOne({
        "orders._id": orderId,
      }) as CustomerOrderHistory | null;
      
      if (!customerHistory) {
        return undefined;
      }
      
      const orderEntry = customerHistory.orders.find(
        (o) => o._id.toString() === orderId.toString()
      );
      
      if (!orderEntry) {
        return undefined;
      }
      
      return {
        _id: orderEntry._id,
        customerId: customerHistory.customerId,
        customerName: customerHistory.customerName,
        customerPhone: customerHistory.customerPhone,
        items: orderEntry.items,
        subtotal: orderEntry.subtotal,
        tax: orderEntry.tax,
        total: orderEntry.total,
        status: orderEntry.status,
        paymentStatus: orderEntry.paymentStatus,
        paymentMethod: orderEntry.paymentMethod,
        tableNumber: orderEntry.tableNumber,
        floorNumber: orderEntry.floorNumber,
        orderDate: orderEntry.orderDate,
        createdAt: orderEntry.createdAt,
        updatedAt: orderEntry.updatedAt,
      };
    } catch (error) {
      console.error("Error getting order:", error);
      return undefined;
    }
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<void> {
    try {
      const orderId = new ObjectId(id);
      const now = new Date();
      
      // Update the order status in the orders collection
      await this.ordersCollection.updateOne(
        { "orders._id": orderId },
        {
          $set: {
            "orders.$.status": status,
            "orders.$.updatedAt": now,
            updatedAt: now,
          },
        }
      );
      
      // If order is completed or cancelled, clear currentOrder from customer (only if it's the current order)
      if (status === 'completed' || status === 'cancelled') {
        const orderHistory = await this.ordersCollection.findOne({ "orders._id": orderId });
        if (orderHistory) {
          // Only clear currentOrder if this order is the customer's current order
          await this.customersCollection.updateOne(
            { 
              _id: orderHistory.customerId,
              "currentOrder._id": orderId
            },
            {
              $set: {
                currentOrder: null,
                updatedAt: now,
              },
            }
          );
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  async updatePaymentStatus(id: string, paymentStatus: Order['paymentStatus'], paymentMethod?: string): Promise<void> {
    try {
      const orderId = new ObjectId(id);
      const now = new Date();
      const update: any = {
        "orders.$.paymentStatus": paymentStatus,
        "orders.$.updatedAt": now,
        updatedAt: now,
      };
      if (paymentMethod) {
        update["orders.$.paymentMethod"] = paymentMethod;
      }
      
      await this.ordersCollection.updateOne(
        { "orders._id": orderId },
        { $set: update }
      );
      
      // CRITICAL: Also update the customer's currentOrder paymentStatus
      // Since currentOrder is a denormalized copy, we need to keep it in sync
      const customerUpdate: any = {
        "currentOrder.paymentStatus": paymentStatus,
        "currentOrder.updatedAt": now,
        updatedAt: now,
      };
      if (paymentMethod) {
        customerUpdate["currentOrder.paymentMethod"] = paymentMethod;
      }
      
      await this.customersCollection.updateOne(
        { "currentOrder._id": orderId },
        { $set: customerUpdate }
      );
      console.log(`[Storage] Updated currentOrder paymentStatus to '${paymentStatus}' for order ${orderId}`);
      
      // If payment is invoice generated or paid, update customer status and release table
      if (paymentStatus === 'invoice_generated' || paymentStatus === 'paid') {
        const orderHistory = await this.ordersCollection.findOne({ "orders._id": orderId });
        if (orderHistory) {
          // CRITICAL: Release table BEFORE clearing currentOrder
          // This ensures the ownership check ("currentOrder._id": orderId) still matches
          const releaseResult = await this.customersCollection.updateOne(
            {
              _id: orderHistory.customerId,
              "currentOrder._id": orderId,  // Verify this order is still the customer's current order
              tableStatus: 'served'  // Only release if currently served
            },
            {
              $set: {
                tableStatus: 'free',
                updatedAt: now,
              }
            }
          );
          
          if (releaseResult.modifiedCount > 0) {
            console.log(`[Storage] Table status released to 'free' for customer ${orderHistory.customerId}`);
          } else {
            console.log(`[Storage] Table was not released (order not current or table not served) for customer ${orderHistory.customerId}`);
          }
          
          // Clear currentOrder when invoice is generated or payment is fully paid
          // This allows the customer to start a fresh order
          if (paymentStatus === 'invoice_generated' || paymentStatus === 'paid') {
            await this.customersCollection.updateOne(
              { 
                _id: orderHistory.customerId,
                "currentOrder._id": orderId
              },
              {
                $set: {
                  currentOrder: null,
                  updatedAt: now,
                },
              }
            );
            console.log(`[Storage] Invoice generated/Payment completed, currentOrder cleared for customer ${orderHistory.customerId}`);
          }
        }
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  }

  async deleteOrderFromHistory(customerId: string, orderId: string): Promise<void> {
    try {
      const customerObjectId = new ObjectId(customerId);
      const orderObjectId = new ObjectId(orderId);
      const now = new Date();
      
      // Delete the order from history
      await this.ordersCollection.updateOne(
        { customerId: customerObjectId },
        {
          $pull: {
            orders: { _id: orderObjectId }
          },
          $set: {
            updatedAt: now
          }
        }
      );
      
      // Clear currentOrder if the deleted order is the current one
      await this.customersCollection.updateOne(
        { 
          _id: customerObjectId,
          "currentOrder._id": orderObjectId
        },
        {
          $set: {
            currentOrder: null,
            updatedAt: now
          }
        }
      );
    } catch (error) {
      console.error("Error deleting order from history:", error);
      throw error;
    }
  }

  async deleteAllOrdersFromHistory(customerId: string): Promise<void> {
    try {
      const customerObjectId = new ObjectId(customerId);
      const now = new Date();
      
      // Delete all orders from history
      await this.ordersCollection.updateOne(
        { customerId: customerObjectId },
        {
          $set: {
            orders: [],
            updatedAt: now
          }
        }
      );
      
      // Also clear currentOrder since all orders are being deleted
      await this.customersCollection.updateOne(
        { _id: customerObjectId },
        {
          $set: {
            currentOrder: null,
            updatedAt: now
          }
        }
      );
    } catch (error) {
      console.error("Error deleting all orders from history:", error);
      throw error;
    }
  }

  async addFavorite(customerId: string, menuItemId: string): Promise<void> {
    try {
      await this.customersCollection.updateOne(
        { _id: new ObjectId(customerId) },
        {
          $push: { favorites: menuItemId },
          $set: { updatedAt: new Date() }
        }
      );
    } catch (error) {
      console.error("Error adding favorite:", error);
      throw error;
    }
  }

  async removeFavorite(customerId: string, menuItemId: string): Promise<void> {
    try {
      await this.customersCollection.updateOne(
        { _id: new ObjectId(customerId) },
        {
          $pull: { favorites: menuItemId },
          $set: { updatedAt: new Date() }
        }
      );
    } catch (error) {
      console.error("Error removing favorite:", error);
      throw error;
    }
  }

  async getCustomerFavorites(customerId: string): Promise<string[]> {
    try {
      const customer = await this.customersCollection.findOne({
        _id: new ObjectId(customerId)
      });
      return customer?.favorites || [];
    } catch (error) {
      console.error("Error getting customer favorites:", error);
      return [];
    }
  }

  getDatabase(): Db {
    return this.db;
  }

  async getTableStatus(phoneNumber: string): Promise<{ tableStatus: string; tableNumber: string; floorNumber: string } | undefined> {
    try {
      const customer = await this.customersCollection.findOne(
        { phoneNumber },
        { projection: { tableStatus: 1, tableNumber: 1, floorNumber: 1, _id: 0 } }
      );
      if (customer) {
        return {
          tableStatus: customer.tableStatus || 'free',
          tableNumber: customer.tableNumber || 'NA',
          floorNumber: customer.floorNumber || 'NA'
        };
      }
      return undefined;
    } catch (error) {
      console.error("Error getting table status:", error);
      return undefined;
    }
  }

  private sortMenuItems(items: MenuItem[]): MenuItem[] {
    return items.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // First priority: Veg items before non-veg items
      if (a.isVeg !== b.isVeg) {
        return a.isVeg ? -1 : 1; // Veg items first
      }
      
      // Second priority: Within same veg/non-veg category, sort by name type
      const getSortOrder = (name: string): number => {
        if (name.startsWith('veg')) return 1;
        if (name.startsWith('chicken')) return 2;
        if (name.startsWith('prawns') || name.startsWith('prawn')) return 3;
        return 4;
      };
      
      const aOrder = getSortOrder(aName);
      const bOrder = getSortOrder(bName);
      
      // If same sort order, sort alphabetically
      if (aOrder === bOrder) {
        return aName.localeCompare(bName);
      }
      
      return aOrder - bOrder;
    });
  }
}

// REMOVED: Hardcoded connection string removed for security
// Connection string will now come from environment variables via MONGODB_URI
const connectionString = process.env.MONGODB_URI || process.env.DATABASE_URL || "";
if (!connectionString) {
  throw new Error("MONGODB_URI environment variable is not set. Please configure your MongoDB connection string.");
}
export const storage = new MongoStorage(connectionString);
