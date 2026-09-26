/*
  Seed the business-approved Fabrika catalog and singleton settings.

  This migration is deterministic by stable slugs/settings ID and safe against
  accidental replay. It intentionally seeds no predefined, AI-generated, or
  uploaded designs, admins, audit logs, or order data.
*/

BEGIN;

INSERT INTO public.products (
  slug,
  name,
  description,
  price,
  is_active,
  sort_order
)
VALUES
  ('tee', 'Футболка', 'Свободная посадка на каждый день', 25, true, 0),
  ('women-tee', 'Женская футболка', 'Актуальный силуэт с комфортной посадкой', 25, true, 1),
  ('kids-tee', 'Детская футболка', 'Мягкая и удобная для активных дней', 25, true, 2),
  ('set', 'Комплект — футболка и шорты', 'Готовый комплект для движения', 35, true, 3),
  ('tracksuit', 'Спортивный костюм', 'Полный образ для спорта и отдыха', 50, true, 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.fabrics (
  slug,
  name,
  description,
  additional_price,
  is_active,
  sort_order
)
VALUES
  ('cotton', 'Хлопок', 'Дышащий и мягкий материал', 25, true, 0),
  ('sport', 'Спортивная ткань', 'Лёгкая, эластичная, быстро сохнет', 30, true, 1)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.store_settings (
  id,
  delivery_price,
  manufacturing_days,
  currency
)
VALUES (1, 10, 7, 'usd')
ON CONFLICT (id) DO NOTHING;

COMMIT;
