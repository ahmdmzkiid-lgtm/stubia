-- Update premium plan duration from 365 to 180 days
UPDATE plans
SET duration_days = 180
WHERE name = 'premium';

-- Insert or update premium_um plan
INSERT INTO plans (name, display_name, description, price, duration_days, features, is_popular, sort_order)
VALUES (
  'premium_um',
  'Premium Ujian Mandiri',
  'Fokus persiapan Ujian Mandiri (SIMAK UI, UTUL UGM, dll)',
  15000,
  60,
  '["Akses semua latihan mandiri", "Akses semua tryout mandiri", "Pembahasan lengkap & analisis"]',
  false,
  4
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration_days = EXCLUDED.duration_days,
  features = EXCLUDED.features,
  is_popular = EXCLUDED.is_popular,
  sort_order = EXCLUDED.sort_order;
