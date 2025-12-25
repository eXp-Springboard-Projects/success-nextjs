-- Import SUCCESS+ Members from CSV files
-- Run this in Supabase SQL Editor

-- First, create a temporary table to hold CSV data
CREATE TEMP TABLE temp_csv_import (
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  create_date TIMESTAMP,
  tier TEXT
);

-- You'll need to manually copy the CSV data into this temp table
-- Or use Supabase's CSV import feature to import into temp_csv_import

-- Then run this to insert into members table:
INSERT INTO members (
  id,
  "firstName",
  "lastName",
  email,
  phone,
  "membershipTier",
  "membershipStatus",
  "joinDate",
  "totalSpent",
  "lifetimeValue",
  "engagementScore",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  COALESCE(first_name, 'Unknown'),
  COALESCE(last_name, ''),
  LOWER(TRIM(email)),
  NULLIF(REGEXP_REPLACE(phone, '\s+', '', 'g'), ''),
  'INSIDER',
  'ACTIVE',
  COALESCE(create_date, NOW()),
  0,
  0,
  0,
  COALESCE(create_date, NOW()),
  NOW()
FROM temp_csv_import
WHERE email IS NOT NULL
  AND email != ''
  AND NOT EXISTS (
    SELECT 1 FROM members WHERE members.email = LOWER(TRIM(temp_csv_import.email))
  )
ON CONFLICT (email) DO NOTHING;

-- Check how many members were imported
SELECT COUNT(*) as total_members FROM members;
SELECT COUNT(*) as insider_members FROM members WHERE "membershipTier" = 'INSIDER';
