# Setup SMS Subscribers Database

## Quick Setup Instructions

To set up the `sms_subscribers` table in Supabase:

1. Go to Supabase SQL Editor: https://app.supabase.com/project/aczlassjkbtwenzsohwm/editor/sql

2. Copy and paste the SQL below and click "Run"

3. Verify the table was created successfully

## SQL Migration

```sql
-- Create SMS Subscribers table for daily inspirational quotes
CREATE TABLE IF NOT EXISTS sms_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  resubscribed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique indexes for phone and email
CREATE UNIQUE INDEX IF NOT EXISTS idx_sms_subscribers_phone ON sms_subscribers(phone);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sms_subscribers_email ON sms_subscribers(email);

-- Create index for active subscribers (for efficient querying)
CREATE INDEX IF NOT EXISTS idx_sms_subscribers_active ON sms_subscribers(active) WHERE active = true;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_sms_subscribers_updated_at ON sms_subscribers;
CREATE TRIGGER update_sms_subscribers_updated_at
  BEFORE UPDATE ON sms_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE sms_subscribers IS 'Stores subscribers for daily inspirational SMS quotes';

-- Enable Row Level Security (RLS)
ALTER TABLE sms_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role has full access to sms_subscribers"
  ON sms_subscribers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy to allow authenticated admin users to read
CREATE POLICY "Admins can read sms_subscribers"
  ON sms_subscribers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );
```

## Verify Setup

After running the SQL, you can verify it worked by running:

```sql
SELECT * FROM sms_subscribers LIMIT 1;
```

You should see column headers but no data (empty table).

## Table Structure

The `sms_subscribers` table has these columns:

- `id` (UUID) - Primary key, auto-generated
- `first_name` (VARCHAR) - Subscriber's first name
- `last_name` (VARCHAR) - Subscriber's last name
- `phone` (VARCHAR) - Phone number (unique)
- `email` (VARCHAR) - Email address (unique)
- `active` (BOOLEAN) - Whether subscription is active (default: true)
- `subscribed_at` (TIMESTAMPTZ) - When they first subscribed
- `resubscribed_at` (TIMESTAMPTZ) - If they reactivated after unsubscribing
- `unsubscribed_at` (TIMESTAMPTZ) - When they unsubscribed (if applicable)
- `created_at` (TIMESTAMPTZ) - Record creation time
- `updated_at` (TIMESTAMPTZ) - Last update time (auto-updated)

## Testing the API

Once the table is created, you can test the signup form at:

http://localhost:3000/daily-sms

Or in production at:

https://www.success.com/daily-sms
