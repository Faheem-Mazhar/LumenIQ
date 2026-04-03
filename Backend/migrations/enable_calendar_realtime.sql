-- Migration: Enable Supabase Realtime for calendar_posts
-- This allows the frontend to subscribe to INSERT/UPDATE/DELETE events.

-- 1. Set REPLICA IDENTITY FULL so DELETE payloads include the old row
--    (needed for the frontend to know which post was removed).
ALTER TABLE public.calendar_posts REPLICA IDENTITY FULL;

-- 2. Add the table to the supabase_realtime publication.
--    (Supabase projects use this publication for its Realtime service.)
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_posts;
