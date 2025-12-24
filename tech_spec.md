This is a comprehensive Technical Specification and Database Design for your multi-tenant, offline-first Point of Sale (POS) system.

### **1. Technology Stack Strategy**

Here are the specific recommendations based on your questions:

  * **Framework:** **Next.js 14+ (App Router)**. This provides the best routing, server actions, and API capabilities.
  * **UI Library:** **shadcn/ui** (built on Radix UI). This is perfect for accessibility, keyboard navigation (crucial for POS), and clean aesthetics.
  * **Database & Auth:** **Supabase**. It handles Identity, Database (PostgreSQL), and Realtime subscriptions.
  * **Offline/Sync Engine (The Critical Choice):**
      * **Do NOT use RabbitMQ.** It is overkill for this architecture. RabbitMQ is great for microservices, but here it adds massive DevOps complexity. You want "Database Replication," not just message queuing.
      * **Use RxDB (Recommended).** Do not use raw IndexedDB. Raw IndexedDB is low-level and painful to maintain.
      * **Why RxDB?** RxDB has a specific **Supabase Replication Plugin**. It automatically treats the local browser data as the "truth" when offline and synchronizes with Supabase when online. It handles conflict resolution and "delta" syncing (only syncing what changed) out of the box.

-----

### **2. Database Schema (PostgreSQL / Supabase)**

We will use a **Multi-tenant Architecture** where all shops live in one database, separated by a `shop_id`. **Row Level Security (RLS)** is mandatory here to ensure Shop A never accesses Shop B's data.

#### **Enums & Types**

```sql
CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'manager', 'cashier');
CREATE TYPE transaction_status AS ENUM ('completed', 'cancelled', 'pending_approval');
```

#### **Tables**

1.  **`shops`** (Managed by Superadmin)

      * `id` (UUID, PK)
      * `name` (Text)
      * `subscription_status` (Boolean) - *If false, sync is blocked.*
      * `is_online_sync_enabled` (Boolean) - *Superadmin toggle.*
      * `created_at` (Timestamp)

2.  **`profiles`** (Extends Supabase Auth)

      * `id` (UUID, PK, references auth.users)
      * `shop_id` (UUID, references shops) - *Null for Superadmin*
      * `role` (user\_role)
      * `full_name` (Text)
      * `is_active` (Boolean)

3.  **`products`**

      * `id` (UUID, PK)
      * `shop_id` (UUID, references shops)
      * `sku` (Text) - *Scannable Barcode*
      * `name` (Text)
      * `price` (Decimal)
      * `stock_qty` (Integer)
      * `is_custom` (Boolean) - *For "Jasa Angkut", etc.*
      * `low_stock_threshold` (Integer)
      * `updated_at` (Timestamp)

4.  **`customers`**

      * `id` (UUID, PK)
      * `shop_id` (UUID, references shops)
      * `name` (Text)
      * `phone` (Text)
      * `email` (Text)

5.  **`transactions`**

      * `id` (UUID, PK)
      * `shop_id` (UUID, references shops)
      * `cashier_id` (UUID, references profiles)
      * `customer_id` (UUID, nullable) - *Null for guest*
      * `total_amount` (Decimal)
      * `status` (transaction\_status)
      * `created_at` (Timestamp)
      * `cancelled_by` (UUID, references profiles)
      * `cancellation_reason` (Text)

***Note:** `transaction_items` table is no longer used. Transaction items are now stored as JSON in the `items` field of the `transactions` table.*
      * `qty` (Integer)
      * `price_at_sale` (Decimal) - *Allows price override*

7.  **`stock_movements`** (Audit Trail)

      * `id` (UUID, PK)
      * `shop_id` (UUID)
      * `product_id` (UUID)
      * `user_id` (UUID)
      * `type` (Enum: 'sale', 'restock', 'opname', 'cancel\_return')
      * `qty_change` (Integer) - *Positive or negative*

-----

### **3. Technical Specification & Feature Implementation**

#### **A. Authentication & Roles (Supabase Auth)**

  * **Middleware:** Use Next.js Middleware to protect routes.
      * `/admin`: Superadmin only.
      * `/dashboard`: Owner/Manager.
      * `/pos`: Cashier/Manager/Owner.
  * **Security:** Enable **Row Level Security (RLS)** in Supabase.
      * *Policy:* `Users can select rows where shop_id = auth.jwt().shop_id`.
      * *Superadmin Policy:* `Can select all rows`.

#### **B. Offline-First Sync Engine (RxDB)**

This is the core of your "running smoothly" requirement.

1.  **Local Database:** The app creates an RxDB instance in the browser.
2.  **Schema:** Define RxDB schemas that match the Supabase tables.
3.  **Replication:** Use `rxdb-supabase` plugin.
      * **Pull:** When online, the app pulls changes from Supabase (e.g., Manager updates stock in back office -\> syncs to Cashier's iPad).
      * **Push:** When a Cashier makes a sale offline, it saves to RxDB. When internet returns, RxDB pushes the transaction to Supabase.
4.  **Superadmin Toggle:** Before initializing replication, the app checks the `shops` table. If `is_online_sync_enabled` is false, the replication plugin is paused/stopped programmatically.

#### **C. POS Features (The "Cashier" View)**

1.  **Barcode Scanning:**
      * **Implementation:** Use a global `useEffect` listener for `keydown` events. Barcode scanners act as keyboards that type numbers very fast and hit "Enter".
      * **Logic:** If input buffer matches a SKU in the local RxDB, add to cart.
2.  **Price Modification:**
      * **UI:** Click the price in the cart -\> `<Dialog>` (shadcn/ui) opens.
      * **Restriction:** If role is Cashier, this might require a PIN (Manager Approval) depending on strictness, or just allow it as per your requirement.
3.  **Custom Items:**
      * **UI:** A "Add Custom Item" button.
      * **Logic:** Add an item to the cart with `is_custom: true` and user-defined name/price. On checkout, include this in the `items` JSON array of the transaction.
4.  **Checkout & Printing:**
      * **Flow:** Pay -\> Save Transaction (RxDB) -\> Trigger Print.
      * **Bluetooth Printing:** Use the **Web Bluetooth API** combined with an ESC/POS encoder library (like `esc-pos-encoder`).
      * *Note:* This works best on Chrome/Edge on Android/Windows. iOS has limitations with Web Bluetooth; you might need a wrapper app or a print server if iOS is a target.

#### **D. Stock Management (Manager/Owner)**

1.  **Bulk Upload:**
      * **UI:** File input for CSV.
      * **Process:** Parse CSV in browser (using `papaparse`).
      * **Logic:** Iterate through rows. Check if SKU exists in RxDB.
          * If yes: Update Qty.
          * If no: Create new Product.
      * **Sync:** RxDB handles pushing these mass changes to the cloud, which then propagates to other cashiers.

#### **E. Robustness & UI (shadcn/ui)**

1.  **Loading States:**
      * Use **React Suspense** and **Skeleton** components from shadcn/ui.
      * While RxDB is booting up, show a "Synchronizing Database..." overlay.
2.  **Confirmations:**
      * Wrap Delete/Cancel actions in `<AlertDialog>` from shadcn/ui.
3.  **Toasts:**
      * Use `sonner` (often bundled with shadcn) for success/error messages.
      * Example: "Transaction Saved (Offline)" vs "Transaction Synced".

-----

### **4. Project Structure (Next.js)**

```
/app
  /(auth)
    /login/page.tsx
  /(superadmin)
    /admin/shops/page.tsx      // Toggle offline/online here
  /(dashboard)                 // Protected: Owner/Manager
    /inventory/page.tsx        // Stock Opname, Upload CSV
    /reports/page.tsx          // Sales charts
  /(pos)                       // Protected: Cashier/Manager/Owner
    /sales/page.tsx            // The Main Point of Sale
  /api
    /cron/sync-check           // Optional server-side checks
/components
    /ui                        // shadcn components
    /providers
        /rxdb-provider.tsx     // Initializes DB and handles Sync logic
/lib
    /database
        /schema.ts             // RxDB Schema definitions
        /supabase.ts           // Supabase client
```

### **5. Special Logic: Cancellation Approval**

Since cashiers need approval to cancel:

1.  Cashier clicks "Cancel Transaction" or "Void Item".
2.  **UI:** A `<Dialog>` opens asking for "Manager PIN".
3.  **Logic:**
      * Cashier enters PIN.
      * System checks PIN against `profiles` where `role = manager/owner` and `shop_id` matches.
      * If valid, allow action.
      * Alternatively (Async Approval): Create a `cancellation_request` in DB. Manager sees notification on their device and approves. (PIN is usually better for fast POS flow).

### **6. Development Phase Plan**

1.  **Phase 1: Foundation.** Set up Supabase, Database Tables, and RLS Policies.
2.  **Phase 2: Local DB.** Implement RxDB and connect it to the Shadcn UI forms. Ensure data creates/reads locally.
3.  **Phase 3: The Sync.** Connect RxDB Replication to Supabase. Test offline mode (turn off WiFi, create sale, turn on WiFi, check Supabase).
4.  **Phase 4: POS Logic.** Barcode scanner listener, Cart logic, Price overrides.
5.  **Phase 5: Superadmin & Multi-tenancy.** ensure Shop A cannot see Shop B. Build the "Kill Switch" (toggle offline).

This architecture ensures your app is fast (local-first), robust (syncs automatically), and scalable (SaaS ready).