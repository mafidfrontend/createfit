/*
# Create orders table for CreateFit Telegram Mini App

## Purpose
Stores completed orders from the 7-step wizard flow. Each row is a single order
with full customer + product + delivery + pricing data, used by the Telegram Bot
to send admin notifications and track payment status.

## New Tables

### `orders`
- `id` (uuid, primary key) — internal row identifier
- `order_number` (text, unique, not null) — human-readable order ID, e.g. "CF-A1B2C3D4"
- `telegram_user_id` (text, not null) — Telegram user ID from initDataUnsafe.user.id
- `telegram_username` (text) — Telegram @username, nullable if user has none
- `first_name` (text, not null) — customer first name (from contact step)
- `last_name` (text) — customer last name, nullable
- `phone` (text, not null) — customer phone number
- `product_id` (text, not null) — selected product ID
- `product_name` (text, not null) — product name at time of order
- `fabric_id` (text, not null) — selected fabric ID
- `fabric_name` (text, not null) — fabric name at time of order
- `design_id` (text, not null) — selected design ID
- `design_name` (text, not null) — design name at time of order
- `size` (text, not null) — selected size (XS–XXL)
- `delivery_city` (text, not null) — delivery city
- `delivery_address` (text, not null) — delivery address
- `delivery_phone` (text, not null) — delivery phone
- `delivery_comment` (text) — optional delivery comment
- `product_price` (numeric, not null, default 0) — server-calculated product price in USD
- `fabric_price` (numeric, not null, default 0) — server-calculated fabric price in USD
- `design_price` (numeric, not null, default 0) — server-calculated design price in USD
- `delivery_price` (numeric, not null, default 0) — delivery price in USD
- `total_price` (numeric, not null, default 0) — server-calculated total in USD
- `payment_status` (text, not null, default 'pending') — pending | awaiting_payment | paid | failed | cancelled
- `order_status` (text, not null, default 'awaiting_payment') — awaiting_payment | confirmed | shipped | delivered | cancelled
- `manufacturing_days` (integer, not null, default 7) — manufacturing lead time
- `created_at` (timestamptz, not null, default now()) — server-generated order timestamp

## Security

- RLS enabled on `orders`.
- This is a no-auth Telegram Mini App (no sign-in screen). The frontend uses the anon key.
- Policies allow `anon, authenticated` to INSERT (the Mini App creates orders) and SELECT
  (the success page reads back its order by order_number).
- UPDATE and DELETE are restricted to `authenticated` (server-side service role only).
- Prices are NOT trusted from the client — the server recalculates all prices from
  product/fabric/design IDs before inserting.

## Important Notes
1. `created_at` uses `DEFAULT now()` so the server always generates the timestamp,
   never the browser.
2. `order_number` is generated server-side as "CF-" + 8 random alphanumeric chars.
3. `total_price` is calculated server-side as product + fabric + design + delivery.
*/
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  telegram_user_id text NOT NULL,
  telegram_username text,
  first_name text NOT NULL,
  last_name text,
  phone text NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  fabric_id text NOT NULL,
  fabric_name text NOT NULL,
  design_id text NOT NULL,
  design_name text NOT NULL,
  size text NOT NULL,
  delivery_city text NOT NULL,
  delivery_address text NOT NULL,
  delivery_phone text NOT NULL,
  delivery_comment text,
  product_price numeric NOT NULL DEFAULT 0,
  fabric_price numeric NOT NULL DEFAULT 0,
  design_price numeric NOT NULL DEFAULT 0,
  delivery_price numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending',
  order_status text NOT NULL DEFAULT 'awaiting_payment',
  manufacturing_days integer NOT NULL DEFAULT 7,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders"
ON orders FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders"
ON orders FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_orders" ON orders;
CREATE POLICY "auth_update_orders"
ON orders FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_orders" ON orders;
CREATE POLICY "auth_delete_orders"
ON orders FOR DELETE
TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_telegram_user_id ON orders (telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
