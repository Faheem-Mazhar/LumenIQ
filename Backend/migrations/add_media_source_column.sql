-- Migration: Add source column to business_media
-- This adds a media_source enum type with 'user' and 'ai' values,
-- then adds a 'source' column to the business_media table.
-- It also backfills existing rows based on the file_url pattern.

-- 1. Create the enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_source') THEN
    CREATE TYPE public.media_source AS ENUM ('user', 'ai');
  END IF;
END
$$;

-- 2. Add the column (defaults to 'user' so existing inserts don't break)
ALTER TABLE public.business_media
  ADD COLUMN IF NOT EXISTS source public.media_source NOT NULL DEFAULT 'user';

-- 3. Backfill: Supabase storage URLs are user-uploaded, everything else is AI-generated
UPDATE public.business_media
SET source = 'ai'
WHERE file_url NOT LIKE '%supabase.co/storage/%';

-- 4. Create an index for filtering by source
CREATE INDEX IF NOT EXISTS idx_business_media_source
  ON public.business_media (source);
