/*
  Add request-level order idempotency without changing historical orders.

  Existing orders keep NULL values. New orders are uniquely scoped by the
  verified Telegram user and the client-provided Idempotency-Key.
*/

ALTER TABLE public.orders
  ADD COLUMN idempotency_key text,
  ADD COLUMN request_hash text;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_telegram_id_idempotency_key_key
  UNIQUE (telegram_user_id, idempotency_key);

CREATE INDEX orders_request_hash_idx
  ON public.orders (request_hash);
