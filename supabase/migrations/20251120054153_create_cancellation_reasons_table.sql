/*
  # Create Cancellation Reasons Table

  ## Overview
  This migration creates a table to track booking cancellations including
  the reason provided by users and the cancellation fee charged.

  ## New Tables
  
  1. **cancellation_reasons**
     - `id` (uuid, primary key) - Unique identifier
     - `booking_id` (uuid, foreign key) - Reference to cancelled booking
     - `user_id` (uuid, foreign key) - User who cancelled
     - `reason` (text) - Cancellation reason provided by user
     - `cancellation_fee` (decimal) - Amount charged as cancellation fee
     - `refund_amount` (decimal) - Amount refunded to user wallet
     - `created_at` (timestamptz) - When cancellation occurred
  
  ## Security
  - Enable RLS on cancellation_reasons table
  - Users can view their own cancellation records
  - Users can insert their own cancellation records
  - Admins and vendors can view related cancellations
*/

-- Create cancellation_reasons table
CREATE TABLE IF NOT EXISTS cancellation_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  cancellation_fee decimal(10, 2) NOT NULL DEFAULT 0,
  refund_amount decimal(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cancellation_reasons ENABLE ROW LEVEL SECURITY;

-- Users can view their own cancellation records
CREATE POLICY "Users can view own cancellations"
  ON cancellation_reasons
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own cancellation records
CREATE POLICY "Users can insert own cancellations"
  ON cancellation_reasons
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Vendors can view cancellations for their bookings
CREATE POLICY "Vendors can view related cancellations"
  ON cancellation_reasons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = cancellation_reasons.booking_id
      AND bookings.vendor_id = auth.uid()
    )
  );

-- Admins can view all cancellations
CREATE POLICY "Admins can view all cancellations"
  ON cancellation_reasons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cancellation_reasons_booking_id ON cancellation_reasons(booking_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_reasons_user_id ON cancellation_reasons(user_id);
