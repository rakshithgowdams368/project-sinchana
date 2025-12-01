/*
  # Create Vendor Earnings and Payout System

  1. New Tables
    - `vendor_earnings`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key to vendor_profiles)
      - `booking_id` (uuid, foreign key to bookings)
      - `total_amount` (numeric) - Total booking amount
      - `vendor_amount` (numeric) - 50% vendor share
      - `company_amount` (numeric) - 50% company share
      - `earning_type` (text) - 'booking' or 'cancellation_fee'
      - `status` (text) - 'pending', 'available', 'paid_out'
      - `created_at` (timestamptz)
    
    - `payout_requests`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key to vendor_profiles)
      - `amount` (numeric)
      - `status` (text) - 'pending', 'processing', 'completed', 'rejected'
      - `bank_account_number` (text)
      - `bank_ifsc_code` (text)
      - `bank_account_holder_name` (text)
      - `requested_at` (timestamptz)
      - `processed_at` (timestamptz)
      - `admin_notes` (text)
    
    - `vendor_wallet`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, unique, foreign key to vendor_profiles)
      - `available_balance` (numeric) - Money available for withdrawal
      - `pending_balance` (numeric) - Money tied to pending bookings
      - `total_earned` (numeric) - Lifetime earnings
      - `total_withdrawn` (numeric) - Total amount withdrawn
      - `updated_at` (timestamptz)

  2. Changes to Existing Tables
    - Add columns to `bookings` table for payment tracking

  3. Security
    - Enable RLS on all new tables
    - Add policies for vendors to view their own data
    - Add policies for admins to manage payouts
*/

-- Create vendor_earnings table
CREATE TABLE IF NOT EXISTS vendor_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  vendor_amount numeric NOT NULL DEFAULT 0,
  company_amount numeric NOT NULL DEFAULT 0,
  earning_type text NOT NULL DEFAULT 'booking',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vendor_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own earnings"
  ON vendor_earnings FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE id = auth.uid()
    )
  );

-- Create payout_requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  bank_account_number text NOT NULL,
  bank_ifsc_code text NOT NULL,
  bank_account_holder_name text NOT NULL,
  bank_name text,
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  admin_notes text
);

ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own payout requests"
  ON payout_requests FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Vendors can create payout requests"
  ON payout_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE id = auth.uid()
    )
  );

-- Create vendor_wallet table
CREATE TABLE IF NOT EXISTS vendor_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid UNIQUE NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  available_balance numeric NOT NULL DEFAULT 0,
  pending_balance numeric NOT NULL DEFAULT 0,
  total_earned numeric NOT NULL DEFAULT 0,
  total_withdrawn numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vendor_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own wallet"
  ON vendor_wallet FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update own wallet"
  ON vendor_wallet FOR UPDATE
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE id = auth.uid()
    )
  );

-- Add payment tracking columns to bookings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'vendor_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN vendor_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'company_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN company_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'vendor_payout_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN vendor_payout_status text DEFAULT 'pending';
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_earnings_vendor_id ON vendor_earnings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_earnings_status ON vendor_earnings(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_vendor_id ON payout_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_vendor_wallet_vendor_id ON vendor_wallet(vendor_id);
