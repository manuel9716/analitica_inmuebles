/*
  # Add Search History Table

  ## Summary
  Creates a table to store user's search history with results.

  ## New Tables
  - `search_history`
    - `id` (uuid, primary key) - Unique identifier
    - `user_id` (uuid) - Reference to auth.users
    - `query` (text) - Original search query
    - `filters` (jsonb) - Complete filters object
    - `results` (jsonb) - Array of property listings found
    - `results_count` (integer) - Number of results found
    - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Enable RLS on `search_history` table
  - Add policy for users to view their own search history
  - Add policy for users to create their own search history
  - Add policy for users to delete their own search history
*/

CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query text NOT NULL,
  filters jsonb DEFAULT '{}'::jsonb,
  results jsonb DEFAULT '[]'::jsonb,
  results_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON search_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own search history"
  ON search_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history"
  ON search_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);
