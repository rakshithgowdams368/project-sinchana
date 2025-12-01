/*
  # Add service_area column to vendor_profiles

  1. Changes
    - Add `service_area` column to `vendor_profiles` table
      - Type: text
      - Nullable: true (allows existing vendors to have null values)
      - Description: Stores the service area or coverage area for vendors
  
  2. Notes
    - Column is nullable to support existing vendor records
    - Vendors can update this field through their profile settings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_profiles' AND column_name = 'service_area'
  ) THEN
    ALTER TABLE vendor_profiles ADD COLUMN service_area text;
  END IF;
END $$;
