# Digital Menu Order Storage Structure

## Overview
All digital menu orders are stored in a **separate MongoDB collection** (`digital_menu_customer_orders`) to avoid conflicts with the existing POS software that shares the same MongoDB database (`mingsdb`).

## MongoDB Database Structure

```
MongoDB Database: mingsdb
│
├── 📁 POS Software Collections (DO NOT MODIFY - Used by POS Software)
│   └── orders (or other POS collections)
│
├── 📁 Digital Menu Collections (Safe to use)
│   ├── digital_menu_customer_orders ⭐ (NEW - Stores all digital menu orders)
│   ├── customers (Customer registration & visit tracking)
│   ├── menuItems (Menu items from all categories)
│   ├── cartitems (Shopping cart items)
│   └── users (Admin users)
```

## Digital Menu Customer Order Collection

**Collection Name:** `digital_menu_customer_orders`

### Document Structure

```json
{
  "_id": "ObjectId",
  "customerId": "ObjectId (reference to customers collection)",
  "customerName": "string",
  "customerPhone": "string (10 digits)",
  "items": [
    {
      "menuItemId": "string",
      "menuItemName": "string",
      "quantity": "number",
      "price": "number",
      "total": "number",
      "spiceLevel": "string (optional: 'no-spicy' | 'less-spicy' | 'regular' | 'more-spicy')",
      "notes": "string (optional - special instructions for this item)"
    }
  ],
  "subtotal": "number",
  "tax": "number",
  "total": "number",
  "status": "string ('pending' | 'confirmed' | 'preparing' | 'completed' | 'cancelled')",
  "paymentStatus": "string ('pending' | 'paid' | 'failed')",
  "paymentMethod": "string (optional)",
  "tableNumber": "string (optional - Table number where customer is seated)",
  "floorNumber": "string (optional - Floor name/number)",
  "orderDate": "Date (IST timezone - when order was placed)",
  "createdAt": "Date (IST timezone - when record was created)",
  "updatedAt": "Date (IST timezone - when record was last updated)"
}
```

### Example Order Document

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "customerId": "507f191e810c19729de860ea",
  "customerName": "Rajesh Kumar",
  "customerPhone": "9876543210",
  "items": [
    {
      "menuItemId": "item123",
      "menuItemName": "Japanese Katsu Curry Chicken",
      "quantity": 2,
      "price": 300,
      "total": 600,
      "spiceLevel": "regular",
      "notes": "Extra sauce on the side"
    },
    {
      "menuItemId": "item456",
      "menuItemName": "Korean Chicken Lollipop",
      "quantity": 1,
      "price": 280,
      "total": 280,
      "spiceLevel": "more-spicy",
      "notes": ""
    }
  ],
  "subtotal": 880,
  "tax": 88,
  "total": 968,
  "status": "pending",
  "paymentStatus": "pending",
  "paymentMethod": "",
  "tableNumber": "T-12",
  "floorNumber": "Ground Floor",
  "orderDate": "2025-11-14T11:30:00.000Z",
  "createdAt": "2025-11-14T11:30:00.000Z",
  "updatedAt": "2025-11-14T11:30:00.000Z"
}
```

## Complete Storage Tree Format

```
MongoDB Database Structure
└── mingsdb (Database)
    │
    ├── Digital Menu Collections
    │   │
    │   ├── digital_menu_customer_orders ⭐
    │   │   └── Document Fields:
    │   │       ├── _id (ObjectId)
    │   │       ├── customerId (ObjectId → customers._id)
    │   │       ├── customerName (string)
    │   │       ├── customerPhone (string)
    │   │       ├── items (array)
    │   │       │   └── Each item contains:
    │   │       │       ├── menuItemId
    │   │       │       ├── menuItemName
    │   │       │       ├── quantity
    │   │       │       ├── price
    │   │       │       ├── total
    │   │       │       ├── spiceLevel (optional)
    │   │       │       └── notes (optional)
    │   │       ├── subtotal (number)
    │   │       ├── tax (number)
    │   │       ├── total (number)
    │   │       ├── status (string)
    │   │       ├── paymentStatus (string)
    │   │       ├── paymentMethod (string, optional)
    │   │       ├── tableNumber (string, optional) 📍
    │   │       ├── floorNumber (string, optional) 🏢
    │   │       ├── orderDate (Date) 📅
    │   │       ├── createdAt (Date) ⏰
    │   │       └── updatedAt (Date) 🔄
    │   │
    │   ├── customers
    │   │   └── Document Fields:
    │   │       ├── _id (ObjectId)
    │   │       ├── name (string)
    │   │       ├── phoneNumber (string - 10 digits)
    │   │       ├── visitCount (number)
    │   │       ├── firstVisit (Date)
    │   │       ├── lastVisit (Date)
    │   │       ├── createdAt (Date)
    │   │       └── updatedAt (Date)
    │   │
    │   ├── menuItems
    │   │   └── Document Fields:
    │   │       ├── _id (ObjectId)
    │   │       ├── name (string)
    │   │       ├── description (string)
    │   │       ├── price (number)
    │   │       ├── category (string)
    │   │       ├── isVeg (boolean)
    │   │       ├── image (string)
    │   │       ├── restaurantId (ObjectId)
    │   │       ├── isAvailable (boolean)
    │   │       ├── createdAt (Date)
    │   │       └── updatedAt (Date)
    │   │
    │   ├── cartitems
    │   │   └── Document Fields:
    │   │       ├── _id (ObjectId)
    │   │       ├── menuItemId (ObjectId)
    │   │       ├── quantity (number)
    │   │       ├── createdAt (Date)
    │   │       └── updatedAt (Date)
    │   │
    │   └── users
    │       └── Document Fields:
    │           ├── _id (ObjectId)
    │           ├── username (string)
    │           ├── password (string - hashed)
    │           ├── createdAt (Date)
    │           └── updatedAt (Date)
    │
    └── POS Software Collections (DO NOT MODIFY)
        └── orders (and other POS collections)
```

## Key Features

### ✅ Complete Data Isolation
- Digital menu orders are stored in `digital_menu_customer_orders`
- POS software orders remain in their own collection
- **Zero interference** between the two systems

### ✅ Comprehensive Order Data
Each order includes:
- **Customer Information**: Name, phone number, customer ID
- **Order Items**: Full details including name, quantity, price, spice level, and notes
- **Financial Data**: Subtotal, tax, total amount
- **Status Tracking**: Order status and payment status
- **Location Data**: Table number and floor name
- **Timestamps**: Order date, creation time, last update time (all in IST)

### ✅ Item-Level Notes
Each item in an order can have:
- **Spice Level**: Customer preference for spiciness
- **Notes**: Special instructions (e.g., "Extra sauce", "No onions", etc.)

### ✅ IST Timezone Support
All timestamps (orderDate, createdAt, updatedAt) are:
- Stored as UTC in the database
- Displayed in Indian Standard Time (IST) to users
- Format: DD/MM/YYYY HH:MM

## Implementation Details

**File:** `server/storage.ts`
- Collection constant: `DIGITAL_MENU_ORDERS_COLLECTION = "digital_menu_customer_orders"`
- Line 379: Constant definition
- Line 444: Collection initialization

**File:** `shared/schema.ts`
- Complete Order interface with all fields
- Validation schemas using Zod

## Safety Notes

⚠️ **Important**: The MongoDB database is shared with another POS software system. This digital menu application uses **completely separate collections** to ensure:
1. No data conflicts
2. No accidental modifications to POS data
3. Independent operation of both systems
4. Safe parallel usage

## Migration Notes

If you have existing orders in the old `orders` collection from digital menu:
1. They will NOT be automatically migrated
2. New orders will go to `digital_menu_customer_orders`
3. Old orders remain in `orders` collection
4. Manual migration can be performed if needed
