// SQL Migration for store_products table
// Run this SQL directly in Supabase SQL Editor

export const storeProductsMigration = `
-- Create store_products table
CREATE TABLE IF NOT EXISTS public.store_products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  sale_price NUMERIC(10,2),
  image TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  link TEXT NOT NULL,
  featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_store_products_category ON public.store_products(category);
CREATE INDEX IF NOT EXISTS idx_store_products_featured ON public.store_products(featured);
CREATE INDEX IF NOT EXISTS idx_store_products_active ON public.store_products(is_active);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_store_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_store_products_updated_at ON public.store_products;
CREATE TRIGGER update_store_products_updated_at
  BEFORE UPDATE ON public.store_products
  FOR EACH ROW
  EXECUTE FUNCTION update_store_products_updated_at();

-- Enable RLS
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

-- Allow public to read active products
DROP POLICY IF EXISTS "Allow public read access to active products" ON public.store_products;
CREATE POLICY "Allow public read access to active products"
  ON public.store_products FOR SELECT
  USING (is_active = true);

-- Allow admins full access
DROP POLICY IF EXISTS "Allow admin full access" ON public.store_products;
CREATE POLICY "Allow admin full access"
  ON public.store_products FOR ALL
  TO authenticated
  USING (true);
`;

console.log('Copy and paste this SQL into your Supabase SQL Editor:');
console.log('\n' + storeProductsMigration);
