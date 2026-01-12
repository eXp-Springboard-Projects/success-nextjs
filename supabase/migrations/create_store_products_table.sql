-- Create store_products table for managing store inventory
CREATE TABLE IF NOT EXISTS "store_products" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price" NUMERIC(10,2) NOT NULL,
  "sale_price" NUMERIC(10,2),
  "image" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "subcategory" TEXT,
  "link" TEXT NOT NULL,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "store_products_pkey" PRIMARY KEY ("id")
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "store_products_category_idx" ON "store_products"("category");
CREATE INDEX IF NOT EXISTS "store_products_featured_idx" ON "store_products"("featured");
CREATE INDEX IF NOT EXISTS "store_products_active_idx" ON "store_products"("is_active");
CREATE INDEX IF NOT EXISTS "store_products_display_order_idx" ON "store_products"("display_order");

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_store_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_store_products_updated_at_trigger ON "store_products";
CREATE TRIGGER update_store_products_updated_at_trigger
  BEFORE UPDATE ON "store_products"
  FOR EACH ROW
  EXECUTE FUNCTION update_store_products_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE "store_products" ENABLE ROW LEVEL SECURITY;

-- Allow public to read active products
CREATE POLICY "Allow public read access to active products"
  ON "store_products" FOR SELECT
  USING ("is_active" = true);

-- Allow authenticated admins full access
CREATE POLICY "Allow admin full access to products"
  ON "store_products" FOR ALL
  TO authenticated
  USING (true);
