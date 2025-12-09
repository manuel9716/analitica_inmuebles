/*
  # Fix Search History Table for Anonymous Users

  ## Summary
  Updates the search_history table to support both authenticated and anonymous users.

  ## Changes
  1. Add session_id column to track anonymous user sessions
  2. Make user_id nullable to allow anonymous users
  3. Update RLS policies to allow anonymous users to manage their search history by session

  ## Security
  - Anonymous users can only access searches with their session_id
  - Authenticated users can only access searches with their user_id
  - Each user type is isolated from the other
*/

-- Add session_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_history' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE search_history ADD COLUMN session_id text;
  END IF;
END $$;

-- Make user_id nullable if it isn't already
DO $$
BEGIN
  ALTER TABLE search_history ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own search history" ON search_history;
DROP POLICY IF EXISTS "Users can create own search history" ON search_history;
DROP POLICY IF EXISTS "Users can delete own search history" ON search_history;

-- Create new policies for authenticated users
CREATE POLICY "Authenticated users can view own search history"
  ON search_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create own search history"
  ON search_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own search history"
  ON search_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for anonymous users
CREATE POLICY "Anonymous users can view own search history by session"
  ON search_history
  FOR SELECT
  TO anon
  USING (user_id IS NULL AND session_id IS NOT NULL);

CREATE POLICY "Anonymous users can create own search history by session"
  ON search_history
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

CREATE POLICY "Anonymous users can delete own search history by session"
  ON search_history
  FOR DELETE
  TO anon
  USING (user_id IS NULL AND session_id IS NOT NULL);

-- Add index for session_id lookups
CREATE INDEX IF NOT EXISTS idx_search_history_session_id ON search_history(session_id) WHERE session_id IS NOT NULL;
