-- Apolena - Schema de Base de Datos para Supabase (PostgreSQL)
-- Tabla de trabajos de generación y almacenamiento

-- 1. Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tipo Enum para el estado de las tareas
DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('pending', 'processing', 'inpainting', 'upscaling', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Tabla principal generation_jobs
CREATE TABLE IF NOT EXISTS public.generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  template_id VARCHAR(100) NOT NULL,
  pet_name VARCHAR(100) DEFAULT 'Mi Mascota',
  species VARCHAR(20) DEFAULT 'dog' CHECK (species IN ('dog', 'cat', 'other')),
  pet_image_url TEXT NOT NULL,
  status job_status DEFAULT 'pending' NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step VARCHAR(150) DEFAULT 'Inicializando tarea...',
  output_image_url TEXT,
  hd_output_image_url TEXT,
  fal_request_id VARCHAR(255),
  fal_upscale_request_id VARCHAR(255),
  error_message TEXT,
  settings JSONB DEFAULT jsonb_build_object(
    'strength', 0.91,
    'guidance_scale', 3.5,
    'upscale_factor', 2
  ),
  execution_seconds NUMERIC(6, 2),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_id ON public.generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON public.generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_created_at ON public.generation_jobs(created_at DESC);

-- 5. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generation_jobs_updated_at ON public.generation_jobs;
CREATE TRIGGER trigger_generation_jobs_updated_at
  BEFORE UPDATE ON public.generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Políticas de Seguridad (RLS)
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;

-- Permitir lectura anónima por ID (para ver el progreso de su job con el link)
CREATE POLICY "Permitir lectura publica por ID de job" 
  ON public.generation_jobs FOR SELECT 
  USING (true);

-- Permitir inserción de nuevos jobs
CREATE POLICY "Permitir creacion publica de jobs" 
  ON public.generation_jobs FOR INSERT 
  WITH CHECK (true);

-- Permitir actualización por service_role o dueño
CREATE POLICY "Permitir actualizacion por service role" 
  ON public.generation_jobs FOR UPDATE 
  USING (true);

-- 7. Configuración de Buckets de Almacenamiento (Supabase Storage)
-- Insertar buckets si no existen
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('pet-uploads', 'pet-uploads', true),
  ('templates', 'templates', true),
  ('portraits-hd', 'portraits-hd', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
CREATE POLICY "Lectura publica de pet-uploads" ON storage.objects FOR SELECT USING (bucket_id = 'pet-uploads');
CREATE POLICY "Subida publica a pet-uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pet-uploads');
CREATE POLICY "Lectura publica de templates" ON storage.objects FOR SELECT USING (bucket_id = 'templates');
CREATE POLICY "Lectura publica de portraits-hd" ON storage.objects FOR SELECT USING (bucket_id = 'portraits-hd');
