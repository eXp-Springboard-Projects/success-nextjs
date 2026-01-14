-- Enhance store_products table with detailed product information
ALTER TABLE "store_products"
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "long_description" TEXT,
ADD COLUMN IF NOT EXISTS "features" TEXT[],
ADD COLUMN IF NOT EXISTS "author" TEXT,
ADD COLUMN IF NOT EXISTS "isbn" TEXT,
ADD COLUMN IF NOT EXISTS "format" TEXT, -- e.g., "Hardcover", "Paperback", "Digital", "Video Course"
ADD COLUMN IF NOT EXISTS "duration" TEXT, -- For courses: "6 hours", "12 weeks", etc.
ADD COLUMN IF NOT EXISTS "skill_level" TEXT, -- "Beginner", "Intermediate", "Advanced"
ADD COLUMN IF NOT EXISTS "includes" TEXT[], -- What's included: "Certificate", "Downloadable resources", etc.
ADD COLUMN IF NOT EXISTS "rating" NUMERIC(2,1) DEFAULT 0, -- Average rating 0-5
ADD COLUMN IF NOT EXISTS "review_count" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "inventory_count" INTEGER,
ADD COLUMN IF NOT EXISTS "digital" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "product_type" TEXT, -- "physical", "digital", "course", "subscription"
ADD COLUMN IF NOT EXISTS "gallery_images" TEXT[], -- Additional product images
ADD COLUMN IF NOT EXISTS "video_url" TEXT, -- Product demo/preview video
ADD COLUMN IF NOT EXISTS "instructor" TEXT, -- For courses
ADD COLUMN IF NOT EXISTS "certification" BOOLEAN DEFAULT false, -- Offers certification
ADD COLUMN IF NOT EXISTS "badge" TEXT; -- "Bestseller", "New", "Featured", "Limited Edition"

-- Create table for product reviews
CREATE TABLE IF NOT EXISTS "product_reviews" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "user_id" TEXT,
  "user_name" TEXT NOT NULL,
  "rating" INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  "title" TEXT,
  "review" TEXT NOT NULL,
  "verified_purchase" BOOLEAN DEFAULT false,
  "helpful_count" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id")
    REFERENCES "store_products"("id") ON DELETE CASCADE
);

-- Create indexes for product reviews
CREATE INDEX IF NOT EXISTS "product_reviews_product_id_idx" ON "product_reviews"("product_id");
CREATE INDEX IF NOT EXISTS "product_reviews_rating_idx" ON "product_reviews"("rating");

-- Enable RLS on product_reviews
ALTER TABLE "product_reviews" ENABLE ROW LEVEL SECURITY;

-- Allow public to read reviews
CREATE POLICY "Allow public read access to reviews"
  ON "product_reviews" FOR SELECT
  USING (true);

-- Allow authenticated users to create reviews
CREATE POLICY "Allow authenticated users to create reviews"
  ON "product_reviews" FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to update product rating when review is added
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE store_products
  SET
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM product_reviews
      WHERE product_id = NEW.product_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM product_reviews
      WHERE product_id = NEW.product_id
    )
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update ratings
DROP TRIGGER IF EXISTS update_product_rating_trigger ON "product_reviews";
CREATE TRIGGER update_product_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "product_reviews"
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- Add comment
COMMENT ON TABLE "store_products" IS 'Enhanced store products with full e-commerce features';
COMMENT ON TABLE "product_reviews" IS 'Customer reviews and ratings for products';
