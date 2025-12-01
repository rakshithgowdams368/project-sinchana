/*
  # Create Storage Buckets for Vendor Documents

  1. Storage Buckets
    - `vendor-images` - For profile images
    - `vendor-documents` - For Aadhar, PAN, GST documents

  2. Security
    - Enable RLS on storage buckets
    - Vendors can upload their own files
    - Vendors can view their own files
    - Admins can view all files
*/

-- Create vendor-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-images', 'vendor-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create vendor-documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-documents', 'vendor-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for vendor-images bucket
CREATE POLICY "Vendors can upload their own images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vendor-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view vendor images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'vendor-images');

CREATE POLICY "Vendors can update their own images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'vendor-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Vendors can delete their own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'vendor-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policies for vendor-documents bucket
CREATE POLICY "Vendors can upload their own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vendor-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Vendors can view their own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'vendor-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can view all documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'vendor-documents' AND
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update their own documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'vendor-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Vendors can delete their own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'vendor-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );