-- Copy and paste this entire file into Supabase SQL Editor
-- https://app.supabase.com/project/aczlassjkbtwenzsohwm/sql/new

-- Import SUCCESS+ Members
-- This will skip any that already exist

INSERT INTO members (id, "firstName", "lastName", email, phone, "membershipTier", "membershipStatus", "joinDate", "totalSpent", "lifetimeValue", "engagementScore", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  "firstName",
  "lastName",
  email,
  phone,
  'SUCCESSPlus',
  'ACTIVE',
  COALESCE("joinDate", NOW()),
  0,
  0,
  0,
  COALESCE("joinDate", NOW()),
  NOW()
FROM (VALUES
  ('Ambrish R', 'Kochikar', 'ambrish.kochikar@exprealty.net', '+13125453080', '2024-09-18'::timestamp),
  ('James', 'Stanton', 'jjs0501@hotmail.com', '+13039405713', '2021-02-08'::timestamp),
  ('Jason', 'Hall', 'jason.b.hall@exprealty.com', '+19195247424', '2023-10-11'::timestamp),
  ('Rochelle', 'Herring Peniston', 'rochelleherring00@gmail.com', '9739644307', '2025-01-12'::timestamp),
  ('Thomas', 'White', 'thomasmwhite7@gmail.com', '7578790236', '2025-01-07'::timestamp),
  ('DHARSHAKA', 'DIAS', 'dharshaka.dias@outlook.com', '+15735873341', '2024-12-01'::timestamp),
  ('Jennifer', 'Jones', 'jenn@jj.team', '+12898797213', '2022-08-23'::timestamp),
  ('Judson', 'Maillie', 'judson@maillie.net', NULL, '2021-02-04'::timestamp),
  ('Errol', 'Boreland', 'eboreland@jhbrokersagency.com', '+18453750516', '2024-09-10'::timestamp),
  ('Anna', 'Wenner', 'annamwenner@gmail.com', '+17852159773', '2025-01-29'::timestamp),
  ('Sara', 'Bird', 'sjmurphy79@gmail.com', '+61401905605', '2021-02-02'::timestamp),
  ('Cynthia', 'Hageman', 'cindyhageman@yahoo.com', '+14697748843', '2021-02-08'::timestamp),
  ('Tristan', 'Holmes', 't.patriot96@gmail.com', '+12564100511', '2021-02-02'::timestamp),
  ('Martin', 'Gaedke', 'martin@gaedke.com', '+491716440661', '2021-06-24'::timestamp),
  ('Mark', 'Whitridge', 'markwhitridge@gmail.com', '+13035146127', '2021-02-02'::timestamp),
  ('Gwendolyn', 'Myers', 'sgmyers22@gmail.com', '+19124322927', '2021-09-21'::timestamp),
  ('Raed', 'Almubarak', 'raed.almubarak@gmail.com', NULL, '2021-02-03'::timestamp),
  ('Joao', 'Gavazzi', 'joao.gavazzi@gmail.com', '+642102227875', '2024-11-12'::timestamp),
  ('Bob', 'Seaton', 'bseaton@monogramhomes.net', '7404042984', '2025-01-01'::timestamp),
  ('Susan', 'Free', 'susan.m.free@gmail.com', '7173189937', '2024-10-29'::timestamp)
  -- Add more rows here if needed
) AS t("firstName", "lastName", email, phone, "joinDate")
WHERE NOT EXISTS (
  SELECT 1 FROM members WHERE members.email = t.email
);

-- Check how many were imported
SELECT COUNT(*) as total_members FROM members;
SELECT COUNT(*) as success_plus_members FROM members WHERE "membershipTier" = 'SUCCESSPlus';
