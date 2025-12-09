/*
  # Add shared properties functionality

  1. New Tables
    - `shared_properties`
      - `id` (uuid, primary key)
      - `property_id` (text) - ID of the property being shared
      - `property_data` (jsonb) - Complete property information
      - `share_token` (text, unique) - Unique token for the shareable URL
      - `shared_by` (uuid) - User who shared the property (nullable for guests)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz) - Optional expiration date
      - `view_count` (integer) - Number of times the link was accessed

  2. Security
    - Enable RLS on `shared_properties` table
    - Anyone can read shared properties via token (public access)
    - Only authenticated users can create shared links
*/

CREATE TABLE IF NOT EXISTS shared_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id text NOT NULL,
  property_data jsonb NOT NULL,
  share_token text UNIQUE NOT NULL,
  shared_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  view_count integer DEFAULT 0
);

ALTER TABLE shared_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shared properties via token"
  ON shared_properties
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create shared links"
  ON shared_properties
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own shared links"
  ON shared_properties
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = shared_by)
  WITH CHECK (auth.uid() = shared_by);

CREATE INDEX IF NOT EXISTS idx_shared_properties_token ON shared_properties(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_properties_property_id ON shared_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_shared_properties_shared_by ON shared_properties(shared_by);
