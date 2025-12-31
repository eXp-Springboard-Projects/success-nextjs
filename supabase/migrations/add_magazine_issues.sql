-- Add SUCCESS Magazine issues to database
-- These are flipbook magazines for SUCCESS+ members

INSERT INTO magazines (
  id,
  title,
  slug,
  "publishedText",
  description,
  "coverImageUrl",
  "flipbookUrl",
  "fileSize",
  "totalPages",
  status,
  "createdAt",
  "updatedAt"
) VALUES
(
  'mag_dec_2025',
  'SUCCESS Magazine - December 2025',
  'december-2025',
  '2025-12-01T00:00:00.000Z',
  'The December 2025 issue of SUCCESS Magazine featuring inspiring stories, expert advice, and actionable strategies for personal and professional growth.',
  'https://read.mysuccessplus.com/success/20251202/cover.jpg',
  'https://read.mysuccessplus.com/success/20251202/index.html',
  0,
  100,
  'PUBLISHED',
  NOW(),
  NOW()
),
(
  'mag_nov_2025',
  'SUCCESS Magazine - November 2025',
  'november-2025',
  '2025-11-01T00:00:00.000Z',
  'The November 2025 issue of SUCCESS Magazine with exclusive interviews, business insights, and strategies for achieving your goals.',
  'https://read.mysuccessplus.com/success/20251104/cover.jpg',
  'https://read.mysuccessplus.com/success/20251104/index.html',
  0,
  100,
  'PUBLISHED',
  NOW(),
  NOW()
),
(
  'mag_oct_2025',
  'SUCCESS Magazine - October 2025',
  'october-2025',
  '2025-10-01T00:00:00.000Z',
  'The October 2025 issue of SUCCESS Magazine featuring cutting-edge content on leadership, entrepreneurship, and personal development.',
  'https://read.mysuccessplus.com/success/20251007/cover.jpg',
  'https://read.mysuccessplus.com/success/20251007/index.html',
  0,
  100,
  'PUBLISHED',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  "flipbookUrl" = EXCLUDED."flipbookUrl",
  "updatedAt" = NOW();
