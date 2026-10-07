-- FIREHELP — schema and storage setup for the independent Supabase project.
-- Run this once in Supabase Dashboard > SQL Editor.
-- This script does not contain any service-role secret.

-- Core schema
\i ../drizzle/migrations/0000_firehelp_schema.sql
\i ../drizzle/migrations/0002_community_messages_gestores.sql

-- Private bucket for report photos
insert into storage.buckets (id, name, public)
values ('fire-images', 'fire-images', false)
on conflict (id) do update set public = excluded.public;

-- Storage RLS policies
\i ../drizzle/migrations/0001_fire_images_storage_policies.sql
