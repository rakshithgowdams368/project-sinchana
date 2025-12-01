/*
  # Add business_pin_code column to vendor_profiles

  1. Changes
    - Add `business_pin_code` column to `vendor_profiles` table
      - Type: text
      - Nullable: true (allows existing vendors to have null values)
      - Description: Stores the pin code for the vendor's business address
  
  2. Notes
    - Column is nullable to support existing vendor records
    - Vendors can update this field through their profile settings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_profiles' AND column_name = 'business_pin_code'
  ) THEN
    ALTER TABLE vendor_profiles ADD COLUMN business_pin_code text;
  END IF;
END $$;
