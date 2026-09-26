/*
  Add explicit display ordering to the Phase 1 catalog tables.

  This migration is schema-only: it adds no catalog or business data and does
  not modify existing order snapshots or catalog references.
*/

ALTER TABLE public.products
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0
    CHECK (sort_order >= 0);

ALTER TABLE public.fabrics
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0
    CHECK (sort_order >= 0);

ALTER TABLE public.designs
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0
    CHECK (sort_order >= 0);

CREATE INDEX products_active_sort_order_idx
  ON public.products (is_active, sort_order);

CREATE INDEX fabrics_active_sort_order_idx
  ON public.fabrics (is_active, sort_order);

CREATE INDEX designs_active_sort_order_idx
  ON public.designs (is_active, sort_order);
