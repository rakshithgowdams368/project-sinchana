/*
  # Add Bank Name Field to Vendor Profiles

  1. Changes
    - Add `bank_name` field to vendor_profiles table
    - This field will store the name of the vendor's bank

  2. Details
    - Field type: text
    - This complements existing banking fields (account number, IFSC, holder name)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendor_profiles' AND column_name = 'bank_name'
  ) THEN
    ALTER TABLE vendor_profiles ADD COLUMN bank_name text;
  END IF;
END $$;