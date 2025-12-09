/*
  # Add Saved Searches Table

  ## Summary
  Creates a new table to store user's saved searches with filters.

  ## New Tables
  - `saved_searches`
    - `id` (uuid, primary key) - Unique identifier
    - `user_id` (uuid) - Reference to auth.users
    - `name` (text) - User-defined name for the search
    - `query` (text) - Original search query
    - `filters` (jsonb) - Complete filters object
    - `notify_new_listings` (boolean) - Enable notifications for new matches
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on `saved_searches` table
  - Add policy for users to view their own saved searches
  - Add policy for users to create their own saved searches
  - Add policy for users to update their own saved searches
  - Add policy for users to delete their own saved searches
*/

CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  query text NOT NULL,
  filters jsonb,
  notify_new_listings boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved searches"
  ON saved_searches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own saved searches"
  ON saved_searches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved searches"
  ON saved_searches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved searches"
  ON saved_searches
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON saved_searches(created_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_saved_searches_updated_at_trigger'
  ) THEN
    CREATE TRIGGER update_saved_searches_updated_at_trigger
      BEFORE UPDATE ON saved_searches
      FOR EACH ROW
      EXECUTE FUNCTION update_saved_searches_updated_at();
  END IF;
END $$;
