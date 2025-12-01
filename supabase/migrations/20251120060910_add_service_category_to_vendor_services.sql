/*
  # Add Service Category Reference to Vendor Services

  1. Changes
    - Add `service_category_id` column to `vendor_services` table
    - Create foreign key relationship to `services` table
    - Keep existing `service_type` column for backward compatibility
    - Migrate existing data to match service categories

  2. Purpose
    - Link vendor services to the main service categories
    - Enable proper filtering and categorization
    - Maintain data integrity with foreign key constraints

  3. Migration Strategy
    - Add new column with foreign key constraint
    - Migrate existing service_type data to service_category_id
    - Create index for better query performance
*/

-- Add service_category_id column to vendor_services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_services' AND column_name = 'service_category_id'
  ) THEN
    ALTER TABLE vendor_services ADD COLUMN service_category_id uuid;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vendor_services_service_category_id_fkey'
  ) THEN
    ALTER TABLE vendor_services
    ADD CONSTRAINT vendor_services_service_category_id_fkey
    FOREIGN KEY (service_category_id) REFERENCES services(id);
  END IF;
END $$;

-- Migrate existing data: match service_type to services.name
UPDATE vendor_services vs
SET service_category_id = s.id
FROM services s
WHERE vs.service_type = s.name
AND vs.service_category_id IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_services_category 
ON vendor_services(service_category_id);

-- Add helpful comment
COMMENT ON COLUMN vendor_services.service_category_id IS 
'Foreign key reference to services table for categorization';
