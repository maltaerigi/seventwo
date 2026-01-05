-- ============================================
-- Storage Bucket for Event Cover Photos
-- ============================================
-- Run this in your Supabase SQL Editor to create 
-- the storage bucket for cover photos.
-- ============================================

-- Create the covers bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  true,  -- Public bucket (images can be viewed by anyone with the URL)
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies
-- ============================================

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload cover photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own uploads
CREATE POLICY "Users can update their own cover photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'covers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'covers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own cover photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'covers' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view cover photos (public bucket)
CREATE POLICY "Anyone can view cover photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'covers');

