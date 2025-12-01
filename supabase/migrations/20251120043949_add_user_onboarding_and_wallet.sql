/*
  # Add User Onboarding Fields and Wallet System

  1. Changes to user_profiles table
    - Add profile_image_url field
    - Add address, pin_code fields
    - Add aadhar_card_url, pan_card_url, signature_url fields
    - Add bank_name, bank_account_number, bank_ifsc_code, bank_account_holder_name fields
    - Add upi_id field
    - Add wallet_balance (numeric, default 0)
    - Add onboarding_step (integer, default 1)
    - Add onboarding_completed (boolean, default false)

  2. New Tables
    - `wallet_transactions` table for tracking wallet recharges and transactions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `transaction_type` (text: recharge, debit, refund)
      - `amount` (numeric)
      - `balance_after` (numeric)
      - `description` (text)
      - `payment_method` (text)
      - `transaction_id` (text)
      - `status` (text: pending, completed, failed)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on wallet_transactions table
    - Users can view their own transactions
    - Users can insert their own transactions
*/

-- Add new columns to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'profile_image_url') THEN
    ALTER TABLE user_profiles ADD COLUMN profile_image_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'address') THEN
    ALTER TABLE user_profiles ADD COLUMN address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'pin_code') THEN
    ALTER TABLE user_profiles ADD COLUMN pin_code text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'aadhar_card_url') THEN
    ALTER TABLE user_profiles ADD COLUMN aadhar_card_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'pan_card_url') THEN
    ALTER TABLE user_profiles ADD COLUMN pan_card_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'signature_url') THEN
    ALTER TABLE user_profiles ADD COLUMN signature_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'bank_name') THEN
    ALTER TABLE user_profiles ADD COLUMN bank_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'bank_account_number') THEN
    ALTER TABLE user_profiles ADD COLUMN bank_account_number text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'bank_ifsc_code') THEN
    ALTER TABLE user_profiles ADD COLUMN bank_ifsc_code text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'bank_account_holder_name') THEN
    ALTER TABLE user_profiles ADD COLUMN bank_account_holder_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'upi_id') THEN
    ALTER TABLE user_profiles ADD COLUMN upi_id text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'wallet_balance') THEN
    ALTER TABLE user_profiles ADD COLUMN wallet_balance numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'onboarding_step') THEN
    ALTER TABLE user_profiles ADD COLUMN onboarding_step integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'onboarding_completed') THEN
    ALTER TABLE user_profiles ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;
END $$;

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL,
  amount numeric NOT NULL,
  balance_after numeric NOT NULL,
  description text,
  payment_method text,
  transaction_id text,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON wallet_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON wallet_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);