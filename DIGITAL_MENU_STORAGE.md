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
    │   │       ├── _id (ObjectId - unique identifier)
    │   │       ├── name (string - customer name)
    │   │       ├── phoneNumber (string - 10 digits, unique)
    │   │       ├── visitCount (number - total visits to restaurant)
    │   │       ├── favorites (array of strings - menu item IDs)
    │   │       ├── firstVisit (Date - timestamp of first registration)
    │   │       ├── lastVisit (Date - timestamp of most recent visit)
    │   │       ├── loginStatus (string: 'loggedin' | 'loggedout') 🔐
    │   │       ├── tableNumber (string - "NA" when logged out) 📍
    │   │       ├── floorNumber (string - "NA" when logged out) 🏢
    │   │       ├── tableStatus (string: 'free' | 'occupied' | 'preparing' | 'ready' | 'served') 🍽️
    │   │       ├── currentOrder (OrderEntry object or null - active order) 📋
    │   │       ├── orderHistory (array of OrderEntry - past orders) 📜
    │   │       ├── createdAt (Date - document creation timestamp)
    │   │       └── updatedAt (Date - last modification timestamp)
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

### ✅ LOGIN STATUS TRACKING
Each customer now has a login status field to track their current session state.

### ✅ TABLE AND FLOOR TRACKING (NEW)
Each customer now has table and floor number fields that track their current location while logged in.

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

## TABLE AND FLOOR NUMBER FIELDS DOCUMENTATION

### 📍 Location in MongoDB

```
MongoDB Database: restaurant_pos
└── Collection: customers
    └── Document: { phoneNumber: "9876543210" }
        ├── Field: tableNumber: string
        └── Field: floorNumber: string
```

### Field Details

| Property | tableNumber | floorNumber |
|----------|-------------|-------------|
| **Type** | String | String |
| **Default Value** | `"NA"` (not assigned) | `"NA"` (not assigned) |
| **Required** | Yes | Yes |
| **Location** | `restaurant_pos.customers[].tableNumber` | `restaurant_pos.customers[].floorNumber` |

### Purpose

The tableNumber and floorNumber fields track the customer's current dining location while they are logged in. These fields:

1. **Track Current Location**: Know where each logged-in customer is seated
2. **Order Delivery**: Help staff deliver orders to the correct table/floor
3. **Session-Based**: Automatically reset to "NA" when customer logs out
4. **Real-Time Updates**: Can be updated as customer changes tables
5. **Historical Data**: Each order preserves table/floor info separately

### Behavior Rules

| Login Status | Table/Floor Values | When Set |
|--------------|-------------------|----------|
| **Logged In** | Can be any value (e.g., "T-12", "Ground Floor") | Set by customer or staff |
| **Logged Out** | Automatically set to `"NA"` | On logout |
| **First Registration** | Initially `"NA"` | On customer creation |

### State Transitions

```
Customer Registration
  ↓
tableNumber = "NA", floorNumber = "NA"
  ↓
Customer Assigns Table/Floor (while logged in)
  ↓
tableNumber = "T-12", floorNumber = "Ground Floor"
  ↓
Customer Logs Out
  ↓
tableNumber = "NA", floorNumber = "NA" (automatically reset)
```

### Database Operations

#### Create Customer (initial values)

```javascript
db.customers.insertOne({
  name: "Rajesh Kumar",
  phoneNumber: "9876543210",
  visitCount: 1,
  favorites: [],
  firstVisit: ISODate("2025-11-14T12:00:00Z"),
  lastVisit: ISODate("2025-11-14T12:00:00Z"),
  loginStatus: "loggedin",
  tableNumber: "NA",       // ← Initially "NA"
  floorNumber: "NA",       // ← Initially "NA"
  createdAt: ISODate("2025-11-14T12:00:00Z"),
  updatedAt: ISODate("2025-11-14T12:00:00Z")
})
```

#### Update Table and Floor Info (while logged in)

```javascript
db.customers.updateOne(
  { phoneNumber: "9876543210" },
  { 
    $set: { 
      tableNumber: "T-12",
      floorNumber: "Ground Floor",
      updatedAt: ISODate("2025-11-14T13:00:00Z")
    }
  }
)
```

#### Automatic Reset on Logout

```javascript
// When customer logs out, tableNumber and floorNumber are automatically set to "NA"
db.customers.updateOne(
  { phoneNumber: "9876543210" },
  { 
    $set: { 
      loginStatus: "loggedout",
      tableNumber: "NA",      // ← Automatically reset
      floorNumber: "NA",      // ← Automatically reset
      updatedAt: ISODate("2025-11-14T15:00:00Z")
    }
  }
)
```

#### Query Customers by Table

```javascript
// Find all customers at a specific table
db.customers.find({ 
  tableNumber: "T-12",
  loginStatus: "loggedin"  // Only logged-in customers
})
```

#### Query Customers by Floor

```javascript
// Find all customers on a specific floor
db.customers.find({ 
  floorNumber: "Ground Floor",
  loginStatus: "loggedin"
})
```

### API Methods

The following storage methods interact with tableNumber and floorNumber:

#### 1. `createCustomer(customer)`
- Creates new customer with `tableNumber = "NA"` and `floorNumber = "NA"`
- Location: `server/storage.ts`, line ~657-658

#### 2. `updateLoginStatus(phoneNumber, loginStatus)`
- When `loginStatus = "loggedout"`: automatically sets `tableNumber = "NA"` and `floorNumber = "NA"`
- When `loginStatus = "loggedin"`: table/floor values remain unchanged
- **Parameters:**
  - `phoneNumber`: string (customer's phone number)
  - `loginStatus`: `"loggedin"` | `"loggedout"`
- **Auto-Reset Behavior:** If logging out, table and floor are automatically reset to "NA"
- Location: `server/storage.ts`, line ~720-743

#### 3. `updateCustomerTableInfo(phoneNumber, tableNumber, floorNumber)` (NEW)
- Updates customer's table and floor information
- **Parameters:**
  - `phoneNumber`: string (customer's phone number)
  - `tableNumber`: string (table identifier, e.g., "T-12", "Table 5")
  - `floorNumber`: string (floor identifier, e.g., "Ground Floor", "1st Floor")
- **Returns:** Updated Customer object or undefined
- **Usage:** Call this when customer selects/changes their table location
- Location: `server/storage.ts`, line ~746-765

#### 4. `getCustomerByPhone(phoneNumber)`
- Retrieves customer including their current tableNumber and floorNumber
- Location: `server/storage.ts`, line ~633

### Example Customer Documents

#### Logged In Customer with Table Assignment

```javascript
{
  "_id": "507f191e810c19729de860ea",
  "name": "Rajesh Kumar",
  "phoneNumber": "9876543210",
  "visitCount": 5,
  "favorites": ["item123", "item456"],
  "firstVisit": "2025-01-15T10:30:00.000Z",
  "lastVisit": "2025-11-14T12:00:00.000Z",
  "loginStatus": "loggedin",      // ← Logged in
  "tableNumber": "T-12",           // ← Current table
  "floorNumber": "Ground Floor",   // ← Current floor
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-11-14T13:00:00.000Z"
}
```

#### Logged Out Customer (Table/Floor Reset)

```javascript
{
  "_id": "507f1f77bcf86cd799439022",
  "name": "Priya Sharma",
  "phoneNumber": "9123456789",
  "visitCount": 3,
  "favorites": [],
  "firstVisit": "2025-02-01T09:00:00.000Z",
  "lastVisit": "2025-11-14T14:00:00.000Z",
  "loginStatus": "loggedout",   // ← Logged out
  "tableNumber": "NA",          // ← Reset to NA
  "floorNumber": "NA",          // ← Reset to NA
  "createdAt": "2025-02-01T09:00:00.000Z",
  "updatedAt": "2025-11-14T15:00:00.000Z"
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
│   │   ├── loginStatus: "loggedin" 🔐
│   │   ├── tableNumber: "T-12" 📍 ← HERE
│   │   ├── floorNumber: "Ground Floor" 🏢 ← HERE
│   │   └── ...
│   │
│   └── Document 2 (phoneNumber: "9123456789")
│       ├── _id: ObjectId("...")
│       ├── name: "Priya Sharma"
│       ├── phoneNumber: "9123456789"
│       ├── loginStatus: "loggedout" 🔐
│       ├── tableNumber: "NA" 📍 ← Reset on logout
│       ├── floorNumber: "NA" 🏢 ← Reset on logout
│       └── ...
│
└── digital_menu_customer_orders (Collection)
    └── (Each order also stores table/floor independently)
```

### Important Notes

#### Difference Between Customer and Order Table/Floor Fields

| Location | Persistence | Purpose |
|----------|-------------|---------|
| **Customer Document** | Session-based (resets on logout) | Track current location of logged-in customer |
| **Order Document** | Permanent (historical record) | Preserve where order was placed |

**Example Flow:**
1. Customer logs in → tableNumber = "NA", floorNumber = "NA"
2. Customer selects table → tableNumber = "T-12", floorNumber = "Ground Floor"
3. Customer places order → Order saves: tableNumber = "T-12", floorNumber = "Ground Floor"
4. Customer moves to different table → updateCustomerTableInfo("T-15", "1st Floor")
5. Customer logs out → tableNumber = "NA", floorNumber = "NA"
6. Order still preserves → tableNumber = "T-12", floorNumber = "Ground Floor"

### Change Log Entry

| Date | Collection | Change | Description |
|------|------------|--------|-------------|
| 2025-11-14 | customers | Added tableNumber | Track customer's current table location<br>- Type: String<br>- Default: `"NA"` on creation<br>- Auto-reset to `"NA"` on logout<br>- Updated via `updateCustomerTableInfo()` method |
| 2025-11-14 | customers | Added floorNumber | Track customer's current floor location<br>- Type: String<br>- Default: `"NA"` on creation<br>- Auto-reset to `"NA"` on logout<br>- Updated via `updateCustomerTableInfo()` method |
| 2025-11-14 | customers | Added tableStatus | Track table/order status workflow<br>- Type: String enum<br>- Default: `"free"` on creation<br>- Values: free, occupied, preparing, ready, served |
| 2025-11-14 | customers | Added favorites | Store customer's favorite menu items<br>- Type: Array of strings<br>- Default: `[]` on creation |
| 2025-11-14 | customers | Added currentOrder | Store active order reference<br>- Type: OrderEntry object or null<br>- Default: `null` on creation |
| 2025-11-14 | customers | Added orderHistory | Store past orders<br>- Type: Array of OrderEntry objects<br>- Default: `[]` on creation |

---

## COMPLETE FIELD DOCUMENTATION

### Customer Fields Explained

#### 1. Basic Information Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `_id` | ObjectId | Unique MongoDB identifier for the customer | `"507f191e810c19729de860ea"` |
| `name` | string | Customer's full name | `"Rajesh Kumar"` |
| `phoneNumber` | string | 10-digit phone number (unique identifier) | `"9876543210"` |
| `createdAt` | Date | Timestamp when customer first registered | `"2025-01-15T10:30:00.000Z"` |
| `updatedAt` | Date | Timestamp of last update to customer record | `"2025-11-14T15:00:00.000Z"` |

#### 2. Visit Tracking Fields

| Field | Type | Description | Default | Example |
|-------|------|-------------|---------|---------|
| `visitCount` | number | Total number of restaurant visits | `1` | `5` |
| `firstVisit` | Date | Timestamp of first visit/registration | current timestamp | `"2025-01-15T10:30:00.000Z"` |
| `lastVisit` | Date | Timestamp of most recent visit | current timestamp | `"2025-11-14T12:00:00.000Z"` |

#### 3. Session & Location Fields

| Field | Type | Allowed Values | Default | Description |
|-------|------|----------------|---------|-------------|
| `loginStatus` | string enum | `"loggedin"` \| `"loggedout"` | `"loggedin"` | Current login session status |
| `tableNumber` | string | Any string | `"NA"` | Current table assignment (e.g., "T-12", "Table 5") |
| `floorNumber` | string | Any string | `"NA"` | Current floor location (e.g., "Ground Floor", "1st Floor") |

**Login Status Behavior:**
- **`"loggedin"`**: Customer has an active session
- **`"loggedout"`**: Customer has logged out (tableNumber and floorNumber auto-reset to "NA")

#### 4. Table Status Field 🍽️

| Field | Type | Allowed Values | Default | Description |
|-------|------|----------------|---------|-------------|
| `tableStatus` | string enum | See below | `"free"` | Current status of customer's table/order workflow |

**Table Status Values:**

| Status | Meaning | When to Use | Visual Indicator |
|--------|---------|-------------|------------------|
| `"free"` | Table is available, no active order | Default state, after order completion | 🟢 Green |
| `"occupied"` | Customer seated, browsing menu | After customer login, before order placement | 🟡 Yellow |
| `"preparing"` | Order placed, kitchen is preparing | After order confirmation | 🟠 Orange |
| `"ready"` | Order ready for serving | Kitchen completed preparation | 🔵 Blue |
| `"served"` | Food delivered to table | After waiter serves the order | 🟣 Purple |

**Table Status Workflow:**
```
free → occupied (customer logs in)
      ↓
occupied → preparing (order placed and confirmed)
      ↓
preparing → ready (kitchen completes order)
      ↓
ready → served (waiter delivers food)
      ↓
served → free (customer logs out or payment completed)
```

#### 5. Favorites & Preferences

| Field | Type | Description | Default | Example |
|-------|------|-------------|---------|---------|
| `favorites` | array of strings | Menu item IDs that customer has favorited | `[]` | `["item123", "item456", "item789"]` |

**Usage:**
- Stores menu item IDs (not _id, but the custom `id` field from menuItems)
- Allows quick access to customer's preferred dishes
- Can be used for personalized recommendations

#### 6. Order Fields

| Field | Type | Description | Default | Example |
|-------|------|-------------|---------|---------|
| `currentOrder` | OrderEntry \| null | Active order in progress | `null` | See OrderEntry structure below |
| `orderHistory` | array of OrderEntry | All past completed orders | `[]` | Array of OrderEntry objects |

---

### Order Fields Explained (digital_menu_customer_orders collection)

#### Order Document Structure

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `_id` | ObjectId | Yes | Unique order identifier | `"507f1f77bcf86cd799439011"` |
| `customerId` | ObjectId | Yes | Reference to customers._id | `"507f191e810c19729de860ea"` |
| `customerName` | string | Yes | Customer name (denormalized) | `"Rajesh Kumar"` |
| `customerPhone` | string | Yes | Customer phone (denormalized) | `"9876543210"` |
| `items` | array | Yes | Array of OrderItem objects | See OrderItem below |
| `subtotal` | number | Yes | Sum of all item totals (before tax) | `880` |
| `tax` | number | Yes | Tax amount (10% of subtotal) | `88` |
| `total` | number | Yes | Final amount (subtotal + tax) | `968` |
| `status` | string enum | Yes | Order processing status | `"pending"` |
| `paymentStatus` | string enum | Yes | Payment status | `"pending"` |
| `paymentMethod` | string | Optional | Payment method used | `"Cash"`, `"UPI"` |
| `tableNumber` | string | Optional | Table where order was placed | `"T-12"` |
| `floorNumber` | string | Optional | Floor where table is located | `"Ground Floor"` |
| `orderDate` | Date | Yes | When order was placed (IST) | `"2025-11-14T11:30:00.000Z"` |
| `createdAt` | Date | Yes | Document creation timestamp | `"2025-11-14T11:30:00.000Z"` |
| `updatedAt` | Date | Yes | Last update timestamp | `"2025-11-14T11:30:00.000Z"` |

#### OrderItem Structure (items array)

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `menuItemId` | string | Yes | Menu item ID reference | `"item123"` |
| `menuItemName` | string | Yes | Menu item name (denormalized) | `"Japanese Katsu Curry Chicken"` |
| `quantity` | number | Yes | Number of servings | `2` |
| `price` | number | Yes | Price per item | `300` |
| `total` | number | Yes | quantity × price | `600` |
| `spiceLevel` | string enum | Optional | Customer's spice preference | `"regular"` |
| `notes` | string | Optional | Special instructions | `"Extra sauce on the side"` |

#### Order Status Values

| Status | Meaning | When to Use | Typical Duration |
|--------|---------|-------------|------------------|
| `"pending"` | Order placed, awaiting confirmation | Default when order created | 1-2 minutes |
| `"confirmed"` | Order confirmed by restaurant | After staff review | N/A |
| `"preparing"` | Kitchen is cooking the order | During food preparation | 15-30 minutes |
| `"completed"` | Order fulfilled and delivered | After customer receives food | Final state |
| `"cancelled"` | Order was cancelled | By customer or staff | Final state |

**Order Status Workflow:**
```
pending → confirmed → preparing → completed
   ↓                                   ↑
   └──────────> cancelled ─────────────┘
```

#### Payment Status Values

| Status | Meaning | When to Use |
|--------|---------|-------------|
| `"pending"` | Payment not yet received | Default state, awaiting payment |
| `"paid"` | Payment successfully completed | After payment confirmation |
| `"failed"` | Payment attempt failed | If payment processing fails |

#### Spice Level Values

| Level | Meaning | Description |
|-------|---------|-------------|
| `"no-spicy"` | No spice at all | For customers who cannot handle spice |
| `"less-spicy"` | Mild spice | Light amount of spices |
| `"regular"` | Normal spice level | Standard restaurant preparation |
| `"more-spicy"` | Extra spicy | For customers who prefer very spicy food |

---

### Complete Customer Document Example

```javascript
{
  "_id": "507f191e810c19729de860ea",
  "name": "Rajesh Kumar",
  "phoneNumber": "9876543210",
  "visitCount": 5,
  "favorites": ["item123", "item456"],
  "firstVisit": "2025-01-15T10:30:00.000Z",
  "lastVisit": "2025-11-14T12:00:00.000Z",
  "loginStatus": "loggedin",
  "tableNumber": "T-12",
  "floorNumber": "Ground Floor",
  "tableStatus": "preparing",
  "currentOrder": {
    "_id": "507f1f77bcf86cd799439011",
    "items": [
      {
        "menuItemId": "item123",
        "menuItemName": "Japanese Katsu Curry Chicken",
        "quantity": 2,
        "price": 300,
        "total": 600,
        "spiceLevel": "regular",
        "notes": "Extra sauce on the side"
      }
    ],
    "subtotal": 600,
    "tax": 60,
    "total": 660,
    "status": "preparing",
    "paymentStatus": "pending",
    "orderDate": "2025-11-14T11:30:00.000Z",
    "createdAt": "2025-11-14T11:30:00.000Z",
    "updatedAt": "2025-11-14T11:35:00.000Z"
  },
  "orderHistory": [
    {
      "_id": "507f1f77bcf86cd799439022",
      "items": [...],
      "subtotal": 450,
      "tax": 45,
      "total": 495,
      "status": "completed",
      "paymentStatus": "paid",
      "orderDate": "2025-11-10T14:00:00.000Z",
      "createdAt": "2025-11-10T14:00:00.000Z",
      "updatedAt": "2025-11-10T14:45:00.000Z"
    }
  ],
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-11-14T12:00:00.000Z"
}
```

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
