/*
# Create CreateFit orders table

1. New Tables
- `orders` stores every customer order created by the CreateFit Mini App.
- `id` is a human-readable unique order number.
- Customer columns store Telegram identity and contact details.
- Product, fabric, design, and size columns store the selected configuration as JSON/text snapshots so historical orders remain accurate if catalog prices change.
- Payment columns store the selected method and confirmed provider status.
- Delivery columns store the destination and server-calculated delivery price.
- `subtotal`, `delivery_price`, and `total_price` store the server-verified USD amounts.
- `manufacturing_days` stores the fixed seven-day business rule.
- `created_at` is set by the database when not supplied.

2. Security
- Row level security is enabled.
- This app has no customer sign-in, so the browser may create an order and receive no order listing. Admin/server operations use the service role and are not exposed to the browser.
- The insert policy allows the public Mini App to create order records; select, update, and delete remain unavailable to the public role.

3. Important Notes
- Prices are recalculated and verified by the server before insertion.
- Payment status starts as `pending` and cannot be treated as paid without provider confirmation.
*/

CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY,
  telegram_id bigint NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  username text,
  phone text NOT NULL,
  product jsonb NOT NULL,
  fabric jsonb NOT NULL,
  design jsonb NOT NULL,
  size text,
  custom_measurements jsonb,
  payment_method text NOT NULL CHECK (payment_method IN ('click', 'payme', 'uzum', 'visa')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
  subtotal numeric(10, 2) NOT NULL CHECK (subtotal >= 0),
  delivery_price numeric(10, 2) NOT NULL CHECK (delivery_price >= 0),
  total_price numeric(10, 2) NOT NULL CHECK (total_price >= 0),
  city text NOT NULL,
  address text NOT NULL,
  comment text NOT NULL DEFAULT '',
  manufacturing_days integer NOT NULL DEFAULT 7 CHECK (manufacturing_days = 7),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
CREATE POLICY "Public can create orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (payment_status = 'pending' AND manufacturing_days = 7);

DROP POLICY IF EXISTS "No public order reads" ON public.orders;
CREATE POLICY "No public order reads" ON public.orders FOR SELECT TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "No public order updates" ON public.orders;
CREATE POLICY "No public order updates" ON public.orders FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "No public order deletes" ON public.orders;
CREATE POLICY "No public order deletes" ON public.orders FOR DELETE TO anon, authenticated USING (false);
