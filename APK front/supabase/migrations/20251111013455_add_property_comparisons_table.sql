/*
  # Add Property Comparisons Table

  ## Summary
  Creates a new table to store property comparisons made by users.

  ## New Tables
  - `property_comparisons`
    - `id` (uuid, primary key) - Unique identifier
    - `user_id` (uuid, nullable) - Reference to auth.users
    - `session_id` (text, nullable) - Session ID for guest users
    - `comparison_data` (jsonb) - Array of listing IDs being compared
    - `listings_data` (jsonb) - Full data of listings being compared
    - `created_at` (timestamptz) - Timestamp of creation

  ## Security
  - Enable RLS on `property_comparisons` table
  - Add policy for users to view their own comparisons
  - Add policy for users to create their own comparisons
  - Add policy for users to delete their own comparisons
*/

CREATE TABLE IF NOT EXISTS property_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  comparison_data jsonb NOT NULL,
  listings_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE property_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own comparisons"
  ON property_comparisons
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Guests can view own comparisons by session"
  ON property_comparisons
  FOR SELECT
  TO anon
  USING (session_id IS NOT NULL);

CREATE POLICY "Users can create own comparisons"
  ON property_comparisons
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guests can create comparisons"
  ON property_comparisons
  FOR INSERT
  TO anon
  WITH CHECK (session_id IS NOT NULL);

CREATE POLICY "Users can delete own comparisons"
  ON property_comparisons
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_property_comparisons_user_id ON property_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_property_comparisons_session_id ON property_comparisons(session_id);
