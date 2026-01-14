# SUCCESS.com Store Setup Guide

## Overview

The SUCCESS.com store has been completely rebuilt to be native to success.com with:
- ✅ Supabase database for product management
- ✅ Stripe integration for payments
- ✅ Comprehensive admin dashboard
- ✅ 1,232 products ready to import from mysuccessplus.com

## Current Status

All code is complete and committed. Two manual steps remain:

1. **Apply database migration** (via Supabase dashboard)
2. **Import products** (run import script)

---

## Step 1: Apply Database Migration

**Why:** The enhanced product schema exists in the migration file but hasn't been applied to your live Supabase database yet. Without this, the import will fail.

**How to apply:**

### Option A: Via Supabase Dashboard (Recommended)

1. **Navigate to Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/aczlassjkbtwenzsohwm
   - Click **SQL Editor** in the left sidebar

2. **Open the migration file:**
   - In your local project: `supabase/migrations/enhance_store_products_table.sql`
   - Copy the entire contents

3. **Execute the migration:**
   - Paste the SQL into the SQL Editor
   - Click **Run** (or Ctrl+Enter)
   - Wait for "Success. No rows returned" message

4. **Verify the migration:**
   - Click **Table Editor** in sidebar
   - Select `store_products` table
   - Verify new columns exist:
     - description, long_description
     - features, includes
     - author, isbn, format
     - instructor, duration, skill_level
     - gallery_images, video_url
     - badge, product_type, digital, certification
     - rating, review_count, inventory_count
   - Verify `product_reviews` table exists

### Option B: Via Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref aczlassjkbtwenzsohwm

# Push the migration
npx supabase db push
```

### Verify Migration Applied

Run the checker script:

```bash
npx dotenv -e .env.supabase -- npx tsx scripts/run-store-migration.ts
```

Expected output:
```
✅ Enhanced columns already exist! Schema is up to date.
✅ product_reviews table exists!
```

---

## Step 2: Import Products from CSV

**Prerequisites:**
- ✅ Database migration must be applied first
- ✅ CSV file must exist at: `C:\Users\RachelNead\Downloads\wc-product-export-14-1-2026-1768415997684.csv`

**Run the import:**

```bash
npx dotenv -e .env.supabase -- npx tsx scripts/import-woocommerce-products.ts
```

**What this does:**
- Imports 1,232 products from mysuccessplus.com export
- Maps WooCommerce fields to Supabase schema
- Automatically categorizes products:
  - Books (Jim Rohn, Napoleon Hill, Zig Ziglar, etc.)
  - Courses (audio/video training programs)
  - Merchandise (apparel, journals, planners)
  - Magazines (SUCCESS Magazine issues)
  - Bundles (product collections)
- Generates internal slugs: `/store/product-name-{id}`
- Cleans HTML from descriptions
- Processes in batches of 50 for performance

**Expected output:**

```
📦 Importing WooCommerce products from CSV...
Found 1232 products in CSV

✅ Imported batch: 50/1232 products
✅ Imported batch: 100/1232 products
...
✅ Imported batch: 1232/1232 products

============================================================
✨ Import Summary:
============================================================
✅ Imported: 1128
⏭️  Skipped:  104  (missing required fields)
❌ Errors:   0
📦 Total:    1232
============================================================
```

**Troubleshooting:**

If you see errors like:
```
❌ Batch error: Could not find the 'description' column
```

This means the migration wasn't applied. Go back to Step 1.

---

## Step 3: Manage Products via Admin Dashboard

**Access:** Navigate to `/admin/store-products`

**Features:**
- ✏️ **Edit Products** - Full form with all enhanced fields
- ➕ **Add Products** - Create new products manually
- 🗑️ **Delete Products** - Remove unwanted items
- ⬆️⬇️ **Reorder** - Change display order
- ✅ **Toggle Status** - Activate/deactivate products
- ⭐ **Set Featured** - Highlight top products
- 🏷️ **Manage Categories** - Organize products
- 💰 **Set Pricing** - Regular and sale prices
- 📦 **Track Inventory** - Stock counts
- 🖼️ **Upload Images** - Main image + gallery
- 🎬 **Add Videos** - Product demos/previews

**Product Fields Available:**

**Basic Info:**
- Name, Price, Sale Price
- Category, Subcategory
- Product Type (physical, course, digital, book, membership)
- Badge (Bestseller, New, Featured, etc.)
- Inventory Count

**Descriptions:**
- Short Description (shown in cards)
- Long Description (shown on product page)
- Features (bullet list)
- Includes (what comes with it)

**Book Fields:**
- Author
- ISBN
- Format (Hardcover, Paperback, Ebook)

**Course Fields:**
- Instructor
- Duration (6 weeks, Self-paced, etc.)
- Skill Level (Beginner, Intermediate, Advanced, All Levels)
- Certification (Yes/No)

**Media:**
- Main Product Image
- Gallery Images (multiple)
- Video URL (YouTube, Vimeo, etc.)

**Settings:**
- Internal Link Route (must use `/store/product-id` format)
- Display Order
- Featured (show in top section)
- Digital Product (Yes/No)
- Active/Inactive

---

## Step 4: Test Stripe Checkout

**Access a product:**
1. Go to `/store`
2. Click on any product
3. Click "Buy Now"
4. Should redirect to Stripe Checkout
5. Test with Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

**Verify checkout flow:**
- ✅ Product details show correctly
- ✅ Price displays (with sale price if set)
- ✅ Clicking "Buy Now" redirects to Stripe
- ✅ After payment, redirects to `/store/checkout/success`
- ✅ If canceled, redirects to `/store/checkout/cancel`

---

## Architecture Overview

### Database (Supabase)

**Tables:**
- `store_products` - Main product catalog (1,200+ products)
- `product_reviews` - Customer reviews and ratings
- `orders` - Order records from Stripe
- `order_items` - Line items for each order

**Key Features:**
- Row Level Security (RLS) enabled
- Auto-updating ratings via triggers
- Foreign key relationships
- Indexed for performance

### Payment Processing (Stripe)

**API Endpoint:** `/api/stripe/create-product-checkout`

**Flow:**
1. User clicks "Buy Now" on product page
2. Frontend calls checkout API with product ID
3. API creates Stripe Checkout Session
4. User redirects to Stripe payment page
5. After payment:
   - Success → `/store/checkout/success?session_id={id}`
   - Cancel → `/store/checkout/cancel`
6. Order saved to database

**Stripe Configuration:**
- Uses Stripe Checkout (hosted payment page)
- Supports credit cards, Apple Pay, Google Pay
- Handles sales tax via Stripe Tax
- Includes shipping address collection
- Supports promotion codes/discounts

### Admin Dashboard

**Location:** `/admin/store-products`

**API Endpoints:**
- `GET /api/admin/store-products` - List all products
- `POST /api/admin/store-products` - Create product
- `PUT /api/admin/store-products` - Update product
- `DELETE /api/admin/store-products` - Delete product

**Access Control:**
- Requires admin authentication (NextAuth)
- Only staff/admin roles can access

---

## Product Data Flow

```
WooCommerce CSV Export
         ↓
Import Script (maps fields)
         ↓
Supabase store_products table
         ↓
Frontend /store page (lists products)
         ↓
Product Detail /store/[slug] (shows single product)
         ↓
Stripe Checkout (payment)
         ↓
Order saved to database
         ↓
Success page (confirmation)
```

---

## File Structure

```
success-next/
├── pages/
│   ├── store/
│   │   ├── index.tsx                    # Store listing page
│   │   ├── [slug].tsx                   # Product detail page
│   │   └── checkout/
│   │       ├── success.tsx              # Order confirmation
│   │       └── cancel.tsx               # Checkout canceled
│   ├── admin/
│   │   └── store-products.tsx           # Admin product management
│   └── api/
│       ├── admin/
│       │   └── store-products.ts        # Product CRUD API
│       └── stripe/
│           ├── create-product-checkout.ts  # Stripe checkout
│           └── verify-session.ts        # Verify payment
├── scripts/
│   ├── import-woocommerce-products.ts   # CSV import script
│   ├── run-store-migration.ts           # Migration checker
│   └── seed-store-products.ts           # Sample product seeder
├── supabase/
│   └── migrations/
│       └── enhance_store_products_table.sql  # Database migration
└── lib/
    └── supabase.ts                      # Supabase client
```

---

## Common Issues & Solutions

### Issue: Import fails with "column not found" errors

**Cause:** Database migration not applied yet.

**Solution:** Go to Step 1 and apply the migration via Supabase dashboard.

---

### Issue: "SUPABASE_SERVICE_ROLE_KEY is not set"

**Cause:** Missing environment variables.

**Solution:** Use `.env.supabase` file:
```bash
npx dotenv -e .env.supabase -- npx tsx scripts/import-woocommerce-products.ts
```

---

### Issue: Products not showing on /store page

**Cause:** Products might be inactive or database query failing.

**Solutions:**
1. Check product `is_active` flag in admin
2. Check browser console for errors
3. Verify products exist: Go to Supabase Dashboard → Table Editor → store_products

---

### Issue: Stripe checkout not working

**Causes:**
- Missing Stripe API keys
- Product doesn't have required fields
- Network/CORS issues

**Solutions:**
1. Verify Stripe keys in Vercel environment variables
2. Check product has valid price and name
3. Check browser console for errors
4. Test with Stripe test mode first

---

## Next Steps After Import

1. **Review imported products** - Check for any issues in admin dashboard
2. **Add enhanced details** - Edit products to add:
   - Better descriptions
   - Features and includes lists
   - Gallery images
   - Video previews
   - Author/instructor info
3. **Set featured products** - Mark top sellers as featured
4. **Test checkout flow** - Verify Stripe integration works
5. **Configure Stripe** - Set up tax settings, shipping rates
6. **Launch** - Make store live!

---

## Support

If you encounter issues:

1. Check this guide first
2. Review error messages in console/terminal
3. Verify environment variables are set
4. Check Supabase dashboard for database issues
5. Review Stripe dashboard for payment issues

---

## Success Criteria

✅ Migration applied (columns exist in database)
✅ Products imported (1,100+ products in store_products table)
✅ Store page loads (/store)
✅ Product details show (/store/product-name)
✅ Stripe checkout works (can make test purchase)
✅ Admin dashboard works (/admin/store-products)
✅ Orders saved to database

Once all criteria are met, the store is fully operational! 🎉
