-- Fix rachel.nead@success.com login
-- This updates the password to a properly bcrypt-hashed version of "Success2025!"
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/aczlassjkbtwenzsohwm/sql/new

-- First, check if the user exists
SELECT id, email, name, role, "hasChangedDefaultPassword", "createdAt"
FROM users
WHERE email = 'rachel.nead@success.com';

-- If user exists, update with bcrypt hash:
UPDATE users
SET
  password = '$2b$10$7amp1t1I6T4C3VNldZhFQuC8orpTTfkUH3I/Xb/6Aar2MFRu.ecya',
  role = 'SUPER_ADMIN',
  "hasChangedDefaultPassword" = true,
  "updatedAt" = NOW()
WHERE email = 'rachel.nead@success.com';

-- If user doesn't exist, create it:
INSERT INTO users (
  id,
  email,
  name,
  password,
  role,
  "hasChangedDefaultPassword",
  "createdAt",
  "updatedAt",
  "isActive",
  "emailVerified"
)
VALUES (
  gen_random_uuid(),
  'rachel.nead@success.com',
  'Rachel Nead',
  '$2b$10$7amp1t1I6T4C3VNldZhFQuC8orpTTfkUH3I/Xb/6Aar2MFRu.ecya',
  'SUPER_ADMIN',
  true,
  NOW(),
  NOW(),
  true,
  true
)
ON CONFLICT (email) DO UPDATE
SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  "hasChangedDefaultPassword" = EXCLUDED."hasChangedDefaultPassword",
  "updatedAt" = NOW();

-- Verify the update:
SELECT id, email, name, role, "hasChangedDefaultPassword", "isActive", "emailVerified"
FROM users
WHERE email = 'rachel.nead@success.com';
