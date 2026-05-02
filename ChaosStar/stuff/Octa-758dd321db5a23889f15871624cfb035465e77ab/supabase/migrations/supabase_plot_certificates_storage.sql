-- Plot Certificates Storage: bucket for PDF certificates
-- Run this SQL in Supabase SQL Editor (Dashboard → SQL Editor) to create the bucket and policies.
-- This fixes "StorageApiError: Bucket not found" when generating plot certificates.

-- Create the bucket (public so certificate URLs work without signed auth)
INSERT INTO storage.buckets (id, name, public)
VALUES ('plot-certificates', 'plot-certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload PDFs to this bucket
CREATE POLICY "Allow authenticated uploads to plot-certificates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'plot-certificates');

-- Allow upsert (overwrite): SELECT + UPDATE so .upload(..., { upsert: true }) works
CREATE POLICY "Allow authenticated update plot-certificates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'plot-certificates')
WITH CHECK (bucket_id = 'plot-certificates');

CREATE POLICY "Allow authenticated select plot-certificates"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'plot-certificates');

-- Public read (bucket is public so getPublicUrl works; this allows anon/read via API if needed)
CREATE POLICY "Public read plot-certificates"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'plot-certificates');
