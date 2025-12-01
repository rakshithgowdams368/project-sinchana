/*
  # Add Vendor Onboarding Fields and Approval System

  1. Changes to vendor_profiles table
    - Add first_name, last_name fields
    - Add location, pin_code fields
    - Add service_id (references services table)
    - Add profile_image_url field
    - Add aadhar_card_url, pan_card_url, gst_certificate_url fields
    - Add service_location, service_pin_code fields
    - Add bank_account_number, bank_ifsc_code, bank_account_holder_name fields
    - Add is_approved (boolean, default false)
    - Add approval_status (text: pending, approved, rejected)
    - Add onboarding_step (integer, default 1)
    - Remove old fields if they conflict

  2. New Tables
    - `services` table for available services
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on services table
    - Allow all authenticated users to read services
    - Update vendor_profiles policies
*/

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view services"
  ON services FOR SELECT
  TO authenticated
  USING (true);

-- Insert default services
INSERT INTO services (name, description) VALUES
  ('Plumbing', 'Pipe repairs, installations, and maintenance'),
  ('Electrical', 'Electrical repairs, wiring, and installations'),
  ('HVAC', 'Heating, ventilation, and air conditioning services'),
  ('Carpentry', 'Woodwork, furniture repairs, and installations'),
  ('Painting', 'Interior and exterior painting services'),
  ('Cleaning', 'Home and office cleaning services'),
  ('Gardening', 'Lawn care, landscaping, and garden maintenance'),
  ('Pest Control', 'Pest inspection and elimination services')
ON CONFLICT DO NOTHING;

-- Add new columns to vendor_profiles
DO $$
BEGIN
  -- Personal Information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'first_name') THEN
    ALTER TABLE vendor_profiles ADD COLUMN first_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'last_name') THEN
    ALTER TABLE vendor_profiles ADD COLUMN last_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'location') THEN
    ALTER TABLE vendor_profiles ADD COLUMN location text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'pin_code') THEN
    ALTER TABLE vendor_profiles ADD COLUMN pin_code text;
  END IF;
  
  -- Service and Image
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'service_id') THEN
    ALTER TABLE vendor_profiles ADD COLUMN service_id uuid REFERENCES services(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'profile_image_url') THEN
    ALTER TABLE vendor_profiles ADD COLUMN profile_image_url text;
  END IF;
  
  -- Documents
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'aadhar_card_url') THEN
    ALTER TABLE vendor_profiles ADD COLUMN aadhar_card_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'pan_card_url') THEN
    ALTER TABLE vendor_profiles ADD COLUMN pan_card_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'gst_certificate_url') THEN
    ALTER TABLE vendor_profiles ADD COLUMN gst_certificate_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'service_location') THEN
    ALTER TABLE vendor_profiles ADD COLUMN service_location text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'service_pin_code') THEN
    ALTER TABLE vendor_profiles ADD COLUMN service_pin_code text;
  END IF;
  
  -- Banking Details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'bank_account_number') THEN
    ALTER TABLE vendor_profiles ADD COLUMN bank_account_number text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'bank_ifsc_code') THEN
    ALTER TABLE vendor_profiles ADD COLUMN bank_ifsc_code text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'bank_account_holder_name') THEN
    ALTER TABLE vendor_profiles ADD COLUMN bank_account_holder_name text;
  END IF;
  
  -- Approval System
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'is_approved') THEN
    ALTER TABLE vendor_profiles ADD COLUMN is_approved boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'approval_status') THEN
    ALTER TABLE vendor_profiles ADD COLUMN approval_status text DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'onboarding_step') THEN
    ALTER TABLE vendor_profiles ADD COLUMN onboarding_step integer DEFAULT 1;
  END IF;
END $$;

-- Add policy for admins to update vendor approval status
CREATE POLICY "Admins can update vendor approval status"
  ON vendor_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
    )
  );

-- Add policy for admins to view all vendor profiles
CREATE POLICY "Admins can view all vendor profiles"
  ON vendor_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
    )
  );