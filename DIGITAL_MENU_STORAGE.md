# DIGITAL MENU ORDER STORAGE STRUCTURE
## Restaurant POS Digital Menu System

---

## OVERVIEW

All digital menu orders are stored in a **separate MongoDB collection** (`digital_menu_customer_orders`) to avoid conflicts with the existing POS software that shares the same MongoDB database (`restaurant_pos`).

---

## MONGODB DATABASE STRUCTURE

```
MongoDB Database: restaurant_pos
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

---

## DIGITAL MENU CUSTOMER ORDER COLLECTION

### Collection Name
`digital_menu_customer_orders`

### Document Structure

```javascript
{
  "_id": ObjectId,
  "customerId": ObjectId,              // Reference to customers collection
  "customerName": String,
  "customerPhone": String,             // 10 digits
  "items": [
    {
      "menuItemId": String,
      "menuItemName": String,
      "quantity": Number,
      "price": Number,
      "total": Number,
      "spiceLevel": String,            // 'no-spicy' | 'less-spicy' | 'regular' | 'more-spicy'
      "notes": String                  // Optional - special instructions
    }
  ],
  "subtotal": Number,
  "tax": Number,
  "total": Number,
  "status": String,                    // 'pending' | 'confirmed' | 'preparing' | 'completed' | 'cancelled'
  "paymentStatus": String,             // 'pending' | 'paid' | 'failed'
  "paymentMethod": String,             // Optional
  "tableNumber": String,               // Optional - Table number where customer is seated
  "floorNumber": String,               // Optional - Floor name/number
  "orderDate": Date,                   // IST timezone - when order was placed
  "createdAt": Date,                   // IST timezone - when record was created
  "updatedAt": Date                    // IST timezone - when record was last updated
}
```

### Example Order Document

```javascript
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

---

## COMPLETE STORAGE TREE FORMAT

```
MongoDB Database Structure
└── restaurant_pos (Database)
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
    │   │       ├── loginStatus (string: 'loggedin' | 'loggedout') 🔐 NEW
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

---

## KEY FEATURES

### ✅ COMPLETE DATA ISOLATION
- Digital menu orders are stored in `digital_menu_customer_orders`
- POS software orders remain in their own collection
- **Zero interference** between the two systems

### ✅ COMPREHENSIVE ORDER DATA
Each order includes:
- **Customer Information**: Name, phone number, customer ID
- **Order Items**: Full details including name, quantity, price, spice level, and notes
- **Financial Data**: Subtotal, tax, total amount
- **Status Tracking**: Order status and payment status
- **Location Data**: Table number and floor name
- **Timestamps**: Order date, creation time, last update time (all in IST)

### ✅ ITEM-LEVEL NOTES
Each item in an order can have:
- **Spice Level**: Customer preference for spiciness
- **Notes**: Special instructions (e.g., "Extra sauce", "No onions", etc.)

### ✅ IST TIMEZONE SUPPORT
All timestamps (orderDate, createdAt, updatedAt) are:
- Stored as UTC in the database
- Displayed in Indian Standard Time (IST) to users
- Format: DD/MM/YYYY HH:MM

### ✅ LOGIN STATUS TRACKING (NEW)
Each customer now has a login status field to track their current session state.

---

## LOGIN STATUS FIELD DOCUMENTATION

### 📍 Location in MongoDB

```
MongoDB Database: restaurant_pos
└── Collection: customers
    └── Document: { phoneNumber: "9876543210" }
        └── Field: loginStatus: "loggedin" | "loggedout"
```

### Field Details

| Property | Value |
|----------|-------|
| **Field Name** | loginStatus |
| **Type** | String (enumerated type) |
| **Allowed Values** | `"loggedin"` - Customer is logged in<br>`"loggedout"` - Customer has logged out |
| **Default Value** | `"loggedin"` (set when customer first registers) |
| **Required** | Yes (added to all customer documents) |
| **Location** | `restaurant_pos.customers[].loginStatus` |

### Purpose

The loginStatus field tracks whether a customer is currently logged into the digital menu system. This enables:

1. Session management and tracking
2. Enforcing single-device login policies
3. Analytics on concurrent active users
4. Security auditing
5. Quick status checks without session tables

### State Transitions

| Event | Login Status |
|-------|--------------|
| Customer Registration | → `"loggedin"` |
| Customer Login | → `"loggedin"` |
| Customer Logout | → `"loggedout"` |
| Session Timeout | → Remains unchanged (manual update required) |

### Database Operations

#### Create Customer (initial login status)

```javascript
db.customers.insertOne({
  name: "Rajesh Kumar",
  phoneNumber: "9876543210",
  visitCount: 1,
  favorites: [],
  firstVisit: ISODate("2025-11-14T12:00:00Z"),
  lastVisit: ISODate("2025-11-14T12:00:00Z"),
  loginStatus: "loggedin",  // ← Automatically set on registration
  createdAt: ISODate("2025-11-14T12:00:00Z"),
  updatedAt: ISODate("2025-11-14T12:00:00Z")
})
```

#### Update Login Status

```javascript
db.customers.updateOne(
  { phoneNumber: "9876543210" },
  { 
    $set: { 
      loginStatus: "loggedin",  // or "loggedout"
      updatedAt: ISODate("2025-11-14T12:30:00Z")
    }
  }
)
```

#### Query Logged-In Customers

```javascript
db.customers.find({ loginStatus: "loggedin" })
```

#### Query Logged-Out Customers

```javascript
db.customers.find({ loginStatus: "loggedout" })
```

### API Methods

The following storage methods interact with loginStatus:

#### 1. `createCustomer(customer)`
- Creates new customer with `loginStatus = "loggedin"`
- Location: `server/storage.ts`, line ~655

#### 2. `updateLoginStatus(phoneNumber, loginStatus)`
- Updates customer's login status to `"loggedin"` or `"loggedout"`
- **Parameters:**
  - `phoneNumber`: string (customer's phone number)
  - `loginStatus`: `"loggedin"` | `"loggedout"`
- **Returns:** Updated Customer object or undefined
- Location: `server/storage.ts`, line ~714

#### 3. `getCustomerByPhone(phoneNumber)`
- Retrieves customer including their current loginStatus
- Location: `server/storage.ts`, line ~633

### Example Customer Document

```javascript
{
  "_id": "507f191e810c19729de860ea",
  "name": "Rajesh Kumar",
  "phoneNumber": "9876543210",
  "visitCount": 5,
  "favorites": ["item123", "item456"],
  "firstVisit": "2025-01-15T10:30:00.000Z",
  "lastVisit": "2025-11-14T12:00:00.000Z",
  "loginStatus": "loggedin",  // ← Current login status
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-11-14T12:00:00.000Z"
}
```

### Tree Location Visualization

```
restaurant_pos (Database)
│
├── customers (Collection)
│   ├── Document 1 (phoneNumber: "9876543210")
│   │   ├── _id: ObjectId("507f191e810c19729de860ea")
│   │   ├── name: "Rajesh Kumar"
│   │   ├── phoneNumber: "9876543210"
│   │   ├── visitCount: 5
│   │   ├── favorites: ["item123", "item456"]
│   │   ├── firstVisit: Date(...)
│   │   ├── lastVisit: Date(...)
│   │   ├── loginStatus: "loggedin" 🔐 ← HERE
│   │   ├── createdAt: Date(...)
│   │   └── updatedAt: Date(...)
│   │
│   └── Document 2 (phoneNumber: "9123456789")
│       ├── _id: ObjectId("...")
│       ├── name: "Priya Sharma"
│       ├── phoneNumber: "9123456789"
│       ├── loginStatus: "loggedout" 🔐 ← HERE
│       └── ...
│
└── digital_menu_customer_orders (Collection)
    └── ...
```

### Change Log Entry

| Date | Collection | Change | Description |
|------|------------|--------|-------------|
| 2025-11-14 | customers | Added loginStatus | Track customer login/logout state<br>- Type: String enum (`'loggedin'` \| `'loggedout'`)<br>- Default: `'loggedin'` on customer creation<br>- Updated via `updateLoginStatus()` method |

---

## IMPLEMENTATION DETAILS

### File: `server/storage.ts`
- Collection constant: `DIGITAL_MENU_ORDERS_COLLECTION = "digital_menu_customer_orders"`
- Line 381: Constant definition
- Line 446: Collection initialization

### File: `shared/schema.ts`
- Complete Order interface with all fields
- Validation schemas using Zod

---

## SAFETY NOTES

> ⚠️ **IMPORTANT:** The MongoDB database is shared with another POS software system. This digital menu application uses **completely separate collections** to ensure:
> 1. No data conflicts
> 2. No accidental modifications to POS data
> 3. Independent operation of both systems
> 4. Safe parallel usage

---

## MIGRATION NOTES

If you have existing orders in the old `orders` collection from digital menu:

1. They will NOT be automatically migrated
2. New orders will go to `digital_menu_customer_orders`
3. Old orders remain in `orders` collection
4. Manual migration can be performed if needed

---

**Last Updated:** 2025-11-14
