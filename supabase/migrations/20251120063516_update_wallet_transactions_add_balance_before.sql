/*
  # Update wallet_transactions table

  1. Changes
    - Add `balance_before` column to track wallet balance before transaction
    - This helps with reconciliation and audit trails

  2. Notes
    - Uses IF NOT EXISTS pattern to prevent errors if column already exists
    - For existing records, balance_before will be calculated as balance_after - amount
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallet_transactions' AND column_name = 'balance_before'
  ) THEN
    ALTER TABLE wallet_transactions ADD COLUMN balance_before numeric NOT NULL DEFAULT 0;
  END IF;
END $$;
