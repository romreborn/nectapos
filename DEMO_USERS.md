# Demo User Credentials

This file contains the login credentials for all demo users in the Necta POS system.

## Demo Users

All demo users use the password: **`demo123`**

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Superadmin** | `superadmin@demo.com` | `demo123` | Full system access, manage all shops |
| **Owner** | `owner@demo.com` | `demo123` | Shop management, reports, settings |
| **Manager** | `manager@demo.com` | `demo123` | Inventory, staff, reports |
| **Cashier** | `cashier@demo.com` | `demo123` | POS transactions only |

## Demo Shop

- **Shop Name**: Demo Coffee Shop
- **Shop ID**: `550e8400-e29b-41d4-a716-446655440000`
- **Sync Enabled**: Yes
- **Subscription**: Active

## Demo Products

The system includes 14 sample products:
- **Coffee**: Espresso, Cappuccino, Latte, Americano, Mocha
- **Pastries**: Croissant, Muffin, Cookie
- **Cold Drinks**: Iced Coffee, Cold Brew, Iced Latte
- **Specialty**: Caramel Macchiato, Vanilla Latte
- **Custom**: Custom Order (variable pricing)

## How to Load Demo Data

### Option 1: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/seed_demo_data.sql`
4. Run the SQL script

### Option 2: Via Supabase CLI
```bash
supabase db reset --db-url "your-connection-string"
```

### Option 3: Manual User Creation
If the SQL script doesn't work for auth.users (requires service role), create users manually:
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Use the emails and password from the table above
4. After creation, the profiles will be auto-created via triggers

## Testing Scenarios

### As Cashier (`cashier@demo.com`)
- Access POS interface
- Create transactions
- View product list
- Cannot access inventory management
- Cannot access reports

### As Manager (`manager@demo.com`)
- All cashier permissions
- Manage inventory (add/edit/delete products)
- View reports
- Cannot manage shop settings

### As Owner (`owner@demo.com`)
- All manager permissions
- Manage shop settings
- View all reports
- Manage staff (future feature)

### As Superadmin (`superadmin@demo.com`)
- Access all shops
- System-wide settings
- Manage subscriptions
- Kill switch control (future feature)

## Notes

⚠️ **Important**: The encrypted password in the SQL file is a placeholder. For actual demo data:
1. Create users via Supabase Auth UI, OR
2. Use Supabase's `auth.users` API with proper password hashing, OR
3. Update the `encrypted_password` field with a properly hashed password

The current SQL includes a bcrypt hash for "demo123" but you may need to regenerate it based on your Supabase instance's salt configuration.
