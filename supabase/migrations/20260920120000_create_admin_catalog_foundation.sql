/*
  Fabrika catalog and admin foundation.

  This migration is additive and intentionally contains no business seed data.
  Existing orders and their historical snapshots are preserved unchanged.
  updated_at is maintained by the application until a shared trigger is justified.

  RLS is enabled on every new table without client-facing policies. The current
  server uses the Supabase service-role key, which bypasses RLS; future customer
  and admin APIs remain the authorization boundary.
*/

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fabrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  additional_price numeric(10, 2) NOT NULL CHECK (additional_price >= 0),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  image_url text,
  design_type text NOT NULL DEFAULT 'predefined'
    CHECK (design_type = 'predefined'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.store_settings (
  id smallint PRIMARY KEY CHECK (id = 1),
  delivery_price numeric(10, 2) NOT NULL CHECK (delivery_price >= 0),
  manufacturing_days integer NOT NULL CHECK (manufacturing_days > 0),
  currency text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

CREATE TABLE public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id bigint UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'manager')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_design_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  asset_type text NOT NULL
    CHECK (asset_type IN ('uploaded', 'ai_generated', 'ai_reference')),
  storage_path text NOT NULL,
  public_url text,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders
  ADD COLUMN product_catalog_id uuid
    REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN fabric_catalog_id uuid
    REFERENCES public.fabrics(id) ON DELETE SET NULL,
  ADD COLUMN design_catalog_id uuid
    REFERENCES public.designs(id) ON DELETE SET NULL;

CREATE INDEX products_is_active_idx ON public.products (is_active);
CREATE INDEX products_created_at_idx ON public.products (created_at DESC);
CREATE INDEX fabrics_is_active_idx ON public.fabrics (is_active);
CREATE INDEX fabrics_created_at_idx ON public.fabrics (created_at DESC);
CREATE INDEX designs_is_active_idx ON public.designs (is_active);
CREATE INDEX designs_created_at_idx ON public.designs (created_at DESC);
CREATE INDEX admins_is_active_idx ON public.admins (is_active);
CREATE INDEX audit_logs_admin_id_idx ON public.audit_logs (admin_id);
CREATE INDEX audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX order_design_assets_order_id_idx ON public.order_design_assets (order_id);
CREATE INDEX orders_product_catalog_id_idx ON public.orders (product_catalog_id);
CREATE INDEX orders_fabric_catalog_id_idx ON public.orders (fabric_catalog_id);
CREATE INDEX orders_design_catalog_id_idx ON public.orders (design_catalog_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_design_assets ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies are created intentionally. Server-side APIs
-- use the service-role key and must enforce authentication and authorization.
