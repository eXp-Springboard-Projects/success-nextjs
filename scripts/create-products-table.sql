-- Create products table for SUCCESS+ shop
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  salePrice NUMERIC(10, 2),
  category TEXT NOT NULL,
  subcategory TEXT,
  sku TEXT UNIQUE,
  stock INTEGER DEFAULT 0,
  thumbnail TEXT,
  images TEXT[], -- Array of image URLs
  externalUrl TEXT, -- Link to mysuccessplus.com product
  isFeatured BOOLEAN DEFAULT FALSE,
  isPublished BOOLEAN DEFAULT FALSE,
  salesCount INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- Additional product data
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Create index on published status
CREATE INDEX IF NOT EXISTS idx_products_published ON products(isPublished);

-- Create orders table for purchase tracking
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, shipped, completed, cancelled
  subtotal NUMERIC(10, 2) NOT NULL,
  tax NUMERIC(10, 2) DEFAULT 0,
  shipping NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  stripePaymentIntentId TEXT,
  shippingAddress JSONB,
  billingAddress JSONB,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table for line items
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  orderId TEXT REFERENCES orders(id) ON DELETE CASCADE,
  productId TEXT REFERENCES products(id) ON DELETE SET NULL,
  productSnapshot JSONB NOT NULL, -- Store product details at time of purchase
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on orderId for fast order item lookups
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(orderId);

-- Create shopping_carts table
CREATE TABLE IF NOT EXISTS shopping_carts (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES users(id) ON DELETE CASCADE,
  sessionId TEXT, -- For guest carts
  items JSONB NOT NULL DEFAULT '[]',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(userId),
  UNIQUE(sessionId)
);

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id TEXT PRIMARY KEY,
  productId TEXT REFERENCES products(id) ON DELETE CASCADE,
  userId TEXT REFERENCES users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  isVerifiedPurchase BOOLEAN DEFAULT FALSE,
  isPublished BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on productId for reviews
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(productId);

COMMENT ON TABLE products IS 'SUCCESS+ shop products catalog';
COMMENT ON TABLE orders IS 'Customer orders for products';
COMMENT ON TABLE order_items IS 'Line items for each order';
COMMENT ON TABLE shopping_carts IS 'User shopping carts';
COMMENT ON TABLE product_reviews IS 'Product reviews and ratings';
