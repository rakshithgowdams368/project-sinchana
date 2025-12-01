/*
  # Add User Preferences and Payment Methods

  1. Changes to user_profiles table
    - Add notification preferences (JSON field)

  2. New Tables
    - `payment_methods` table for storing user payment methods
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `method_type` (text: card, upi, netbanking)
      - `display_name` (text)
      - `details` (jsonb - encrypted details)
      - `is_default` (boolean)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on payment_methods table
    - Users can only manage their own payment methods
*/

-- Add notification preferences to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'notification_preferences') THEN
    ALTER TABLE user_profiles ADD COLUMN notification_preferences jsonb DEFAULT '{
      "email_notifications": true,
      "sms_notifications": true,
      "push_notifications": true,
      "booking_updates": true,
      "promotional_offers": false,
      "service_reminders": true
    }'::jsonb;
  END IF;
END $$;

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  method_type text NOT NULL,
  display_name text NOT NULL,
  details jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods"
  ON payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods"
  ON payment_methods FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods"
  ON payment_methods FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);