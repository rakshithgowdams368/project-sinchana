/*
  # Create Vendor Services, Pricing, and Bookings System

  1. Changes to vendor_profiles table
    - Add `rating` (numeric - average rating)
    - Add `jobs_completed` (integer - total jobs done)
    - Add `is_approved` (boolean - admin approval status)

  2. New Tables
    - `vendor_services` - Services offered by vendors with pricing
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, references vendor_profiles)
      - `service_type` (text - type of service)
      - `service_name` (text)
      - `description` (text)
      - `base_price` (numeric)
      - `price_unit` (text - per hour, per job, etc)
      - `location` (text)
      - `pin_code` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `bookings` - User bookings for services
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `vendor_id` (uuid, references vendor_profiles)
      - `service_id` (uuid, references vendor_services)
      - `booking_date` (date)
      - `booking_time` (text)
      - `status` (text - pending, confirmed, completed, cancelled)
      - `total_amount` (numeric)
      - `payment_status` (text - pending, paid, refunded)
      - `user_address` (text)
      - `user_pin_code` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `service_reviews` - Reviews and ratings for completed services
      - `id` (uuid, primary key)
      - `booking_id` (uuid, references bookings)
      - `user_id` (uuid, references user_profiles)
      - `vendor_id` (uuid, references vendor_profiles)
      - `rating` (integer - 1 to 5)
      - `review_text` (text)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on all new tables
    - Appropriate policies for users and vendors
*/

-- Add rating and jobs_completed to vendor_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'rating') THEN
    ALTER TABLE vendor_profiles ADD COLUMN rating numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'jobs_completed') THEN
    ALTER TABLE vendor_profiles ADD COLUMN jobs_completed integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendor_profiles' AND column_name = 'is_approved') THEN
    ALTER TABLE vendor_profiles ADD COLUMN is_approved boolean DEFAULT false;
  END IF;
END $$;

-- Create vendor_services table
CREATE TABLE IF NOT EXISTS vendor_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  service_type text NOT NULL,
  service_name text NOT NULL,
  description text,
  base_price numeric NOT NULL DEFAULT 0,
  price_unit text DEFAULT 'per job',
  location text,
  pin_code text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vendor_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active vendor services"
  ON vendor_services FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Vendors can insert own services"
  ON vendor_services FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update own services"
  ON vendor_services FOR UPDATE
  TO authenticated
  USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can delete own services"
  ON vendor_services FOR DELETE
  TO authenticated
  USING (auth.uid() = vendor_id);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES vendor_services(id) ON DELETE CASCADE NOT NULL,
  booking_date date NOT NULL,
  booking_time text NOT NULL,
  status text DEFAULT 'pending',
  total_amount numeric NOT NULL,
  payment_status text DEFAULT 'pending',
  user_address text,
  user_pin_code text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = vendor_id);

CREATE POLICY "Users can insert own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and vendors can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = vendor_id);

-- Create service_reviews table
CREATE TABLE IF NOT EXISTS service_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON service_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert reviews for own bookings"
  ON service_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vendor_services_vendor_id ON vendor_services(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_services_service_type ON vendor_services(service_type);
CREATE INDEX IF NOT EXISTS idx_vendor_services_pin_code ON vendor_services(pin_code);
CREATE INDEX IF NOT EXISTS idx_vendor_services_price ON vendor_services(base_price);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor_id ON bookings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_service_reviews_vendor_id ON service_reviews(vendor_id);

-- Function to update vendor rating after review
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendor_profiles
  SET rating = (
    SELECT AVG(rating)::numeric(3,2)
    FROM service_reviews
    WHERE vendor_id = NEW.vendor_id
  )
  WHERE id = NEW.vendor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vendor rating when review is added
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_vendor_rating') THEN
    CREATE TRIGGER trigger_update_vendor_rating
    AFTER INSERT ON service_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_rating();
  END IF;
END $$;

-- Function to update jobs_completed when booking is completed
CREATE OR REPLACE FUNCTION update_jobs_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE vendor_profiles
    SET jobs_completed = jobs_completed + 1
    WHERE id = NEW.vendor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update jobs_completed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_jobs_completed') THEN
    CREATE TRIGGER trigger_update_jobs_completed
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_jobs_completed();
  END IF;
END $$;