/*
  # Fix Vendor Services RLS Policies

  ## Overview
  This migration fixes the RLS policies for vendor_services and vendor_profiles tables
  to allow users to view vendor information when browsing services.

  ## Changes
  
  1. **Vendor Profiles Access**
     - Add policy to allow authenticated users to view approved vendor profiles
     - This enables the service search to show vendor information
  
  2. **Vendor Services Access**
     - Update existing policy to allow public access to active services
     - Add policy for unauthenticated users to view active services
  
  ## Security Notes
  - Only approved vendors are visible to users
  - Only active services are visible
  - Users cannot modify vendor data
  - Vendors maintain full control of their own data
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view active vendor services" ON vendor_services;

-- Create new policies for vendor_services that allow both authenticated and anonymous users
CREATE POLICY "Public can view active vendor services"
  ON vendor_services
  FOR SELECT
  TO public
  USING (is_active = true);

-- Create policy to allow authenticated users to view approved vendor profiles
CREATE POLICY "Users can view approved vendor profiles"
  ON vendor_profiles
  FOR SELECT
  TO authenticated
  USING (is_approved = true AND approval_status = 'approved');

-- Create policy to allow anonymous users to view approved vendor profiles
CREATE POLICY "Public can view approved vendor profiles"
  ON vendor_profiles
  FOR SELECT
  TO anon
  USING (is_approved = true AND approval_status = 'approved');
