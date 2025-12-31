-- Run this in Supabase SQL Editor to create Rachel's account
-- https://app.supabase.com/project/aczlassjkbtwenzsohwm/sql

-- First check if account exists
SELECT id, email, role, email_verified
FROM users
WHERE email = 'rachel.nead@exprealty.net';

-- If no results above, run this to create the account:
-- Password will be: TempPassword123! (CHANGE AFTER LOGIN)

INSERT INTO users (
  id,
  email,
  password,
  first_name,
  last_name,
  role,
  primary_department,
  email_verified,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid()::text,
  'rachel.nead@exprealty.net',
  '$2b$10$M2Qz6Crp/Dt6PpmaFimAyumfTVh.XzyCsNsqtMSfv4GOcc3uwz5MO',  -- TempPassword123!
  'Rachel',
  'Nead',
  'SUPER_ADMIN',
  'SUPER_ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING
RETURNING id, email, role;
