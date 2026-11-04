-- Apolena — Migración Escalable de Base de Datos (PostgreSQL / Prisma / Supabase)
-- Tablas: profiles, products, product_images, generation_jobs, orders, order_shippings,
-- order_invoices, order_packages, order_items, payment_transactions, reviews, platform_settings, email_queue

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  address TEXT,
  department TEXT,
  province TEXT,
  district TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. PRODUCTS (Extensible con customization_config JSONB para marcos, medidas, acabados y futuros productos)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'wall_art',
  base_price NUMERIC(10, 2) NOT NULL DEFAULT 120.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  stock INTEGER NOT NULL DEFAULT 999,
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  customization_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- 3. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- 4. ORDERS (3 Pasos: manufacturing -> in_transit -> delivered -> completed + Esquema 50% / 50%)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT UNIQUE NOT NULL,
  tracking_id TEXT UNIQUE NOT NULL,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'manufacturing' CHECK (status IN ('manufacturing', 'in_transit', 'delivered', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'partial_pending' CHECK (payment_status IN ('partial_pending', 'partial_paid', 'paid_full', 'refunded')),
  payment_method TEXT NOT NULL DEFAULT 'yape' CHECK (payment_method IN ('yape', 'plin', 'bank_transfer')),
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  advance_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  manufacturing_started_at TIMESTAMPTZ DEFAULT now(),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_id ON public.orders(tracking_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- 5. ORDER SHIPPINGS (1:1 con orders)
CREATE TABLE IF NOT EXISTS public.order_shippings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  department TEXT,
  province TEXT,
  district TEXT,
  reference TEXT,
  document_type TEXT DEFAULT 'DNI',
  document_number TEXT
);

-- 6. ORDER INVOICES (1:1 con orders)
CREATE TABLE IF NOT EXISTS public.order_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'boleta' CHECK (type IN ('boleta', 'factura')),
  doc_type TEXT DEFAULT 'DNI',
  number TEXT,
  legal_name TEXT,
  tax_address TEXT,
  sunat_status TEXT DEFAULT 'pending',
  sunat_pdf_url TEXT
);

-- 7. ORDER PACKAGES
CREATE TABLE IF NOT EXISTS public.order_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  package_number INTEGER NOT NULL DEFAULT 1,
  total_packages INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'manufacturing',
  courier TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  carrier_phone TEXT,
  estimated_delivery TIMESTAMPTZ,
  destination_address TEXT,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_packages_order_id ON public.order_packages(order_id);

-- 8. ORDER ITEMS (Con customizations JSONB para guardar tamaño, acabado, marco, etc.)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.order_packages(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  generation_job_id UUID REFERENCES public.generation_jobs(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'manufacturing',
  pet_photo_url TEXT,
  generated_art_url TEXT,
  customizations JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_items_package_id ON public.order_items(package_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- 9. PAYMENT TRANSACTIONS (advance_50 y final_50 con yape, plin, bank_transfer)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_stage TEXT NOT NULL DEFAULT 'advance_50' CHECK (payment_stage IN ('advance_50', 'final_50')),
  payment_method TEXT NOT NULL DEFAULT 'yape' CHECK (payment_method IN ('yape', 'plin', 'bank_transfer')),
  status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'rejected')),
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PEN',
  operation_number TEXT,
  proof_image_url TEXT,
  payer_name TEXT,
  payer_phone TEXT,
  notes TEXT,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  raw_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stage ON public.payment_transactions(payment_stage);

-- 10. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(buyer_id, order_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_buyer_id ON public.reviews(buyer_id);

-- 11. PLATFORM SETTINGS
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. EMAIL QUEUE
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  data JSONB NOT NULL,
  cc TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON public.email_queue(created_at DESC);
