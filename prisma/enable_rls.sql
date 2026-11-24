-- ══════════════════════════════════════════════════════════════════════════════════
-- APOLENA ATELIER — Row Level Security (RLS) & Access Control Migration
-- Supabase Public Schema Protection
-- ══════════════════════════════════════════════════════════════════════════════════

-- 1. ENABLE ROW LEVEL SECURITY (RLS) ON ALL 15 TABLES
ALTER TABLE public.character_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_shippings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════════════════════════
-- 2. SERVICE ROLE FULL ACCESS POLICIES (Backend API / Next.js Serverless)
-- ══════════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'character_templates', 'email_queue', 'generation_jobs', 'newsletter_subscribers',
    'order_invoices', 'order_items', 'order_packages', 'order_shippings', 'orders',
    'payment_transactions', 'platform_settings', 'product_images', 'products',
    'profiles', 'reviews'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_full_access" ON public.%I;', tbl);
    EXECUTE format(
      'CREATE POLICY "service_role_full_access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);',
      tbl
    );
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════════════════════════════
-- 3. PUBLIC CATALOG POLICIES (Read-only for all visitors: anon & authenticated)
-- ══════════════════════════════════════════════════════════════════════════════════

-- Products
DROP POLICY IF EXISTS "public_read_products" ON public.products;
CREATE POLICY "public_read_products" ON public.products
  FOR SELECT TO public
  USING (true);

-- Product Images
DROP POLICY IF EXISTS "public_read_product_images" ON public.product_images;
CREATE POLICY "public_read_product_images" ON public.product_images
  FOR SELECT TO public
  USING (true);

-- Character Templates (Themes)
DROP POLICY IF EXISTS "public_read_character_templates" ON public.character_templates;
CREATE POLICY "public_read_character_templates" ON public.character_templates
  FOR SELECT TO public
  USING (true);

-- Approved Reviews
DROP POLICY IF EXISTS "public_read_reviews" ON public.reviews;
CREATE POLICY "public_read_reviews" ON public.reviews
  FOR SELECT TO public
  USING (true);

-- Platform Settings (General shop config)
DROP POLICY IF EXISTS "public_read_platform_settings" ON public.platform_settings;
CREATE POLICY "public_read_platform_settings" ON public.platform_settings
  FOR SELECT TO public
  USING (true);

-- Newsletter Subscription (Anyone can subscribe)
DROP POLICY IF EXISTS "public_insert_newsletter" ON public.newsletter_subscribers;
CREATE POLICY "public_insert_newsletter" ON public.newsletter_subscribers
  FOR INSERT TO public
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════════
-- 4. USER AUTHENTICATED ACCESS POLICIES (Scoped strictly to row ownership)
-- ══════════════════════════════════════════════════════════════════════════════════

-- Profiles: Users can only read and update their own profile row
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
CREATE POLICY "users_read_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Orders: Users can only read their own orders
DROP POLICY IF EXISTS "users_read_own_orders" ON public.orders;
CREATE POLICY "users_read_own_orders" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id);

-- Order Packages: Scoped to buyer of the order
DROP POLICY IF EXISTS "users_read_own_order_packages" ON public.order_packages;
CREATE POLICY "users_read_own_order_packages" ON public.order_packages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_packages.order_id AND o.buyer_id = auth.uid()
    )
  );

-- Order Items: Scoped to buyer of the package's order
DROP POLICY IF EXISTS "users_read_own_order_items" ON public.order_items;
CREATE POLICY "users_read_own_order_items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.order_packages p
      JOIN public.orders o ON o.id = p.order_id
      WHERE p.id = order_items.package_id AND o.buyer_id = auth.uid()
    )
  );

-- Order Shippings: Scoped to buyer
DROP POLICY IF EXISTS "users_read_own_order_shippings" ON public.order_shippings;
CREATE POLICY "users_read_own_order_shippings" ON public.order_shippings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_shippings.order_id AND o.buyer_id = auth.uid()
    )
  );

-- Order Invoices: Scoped to buyer
DROP POLICY IF EXISTS "users_read_own_order_invoices" ON public.order_invoices;
CREATE POLICY "users_read_own_order_invoices" ON public.order_invoices
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_invoices.order_id AND o.buyer_id = auth.uid()
    )
  );

-- Payment Transactions: Scoped to buyer
DROP POLICY IF EXISTS "users_read_own_payment_transactions" ON public.payment_transactions;
CREATE POLICY "users_read_own_payment_transactions" ON public.payment_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payment_transactions.order_id AND o.buyer_id = auth.uid()
    )
  );

-- Generation Jobs: Scoped to user who requested the job
DROP POLICY IF EXISTS "users_read_own_generation_jobs" ON public.generation_jobs;
CREATE POLICY "users_read_own_generation_jobs" ON public.generation_jobs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════════════════════
-- 5. CONFIDENTIAL LOGS & QUEUES (email_queue)
-- ══════════════════════════════════════════════════════════════════════════════════
-- No public or authenticated policies are created for public.email_queue.
-- Access is restricted exclusively to service_role and postgres superuser.
