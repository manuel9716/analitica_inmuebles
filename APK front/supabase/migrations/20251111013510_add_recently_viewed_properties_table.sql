/*
  # Add Recently Viewed Properties Table

  ## Summary
  Creates a new table to track properties viewed by users.

  ## New Tables
  - `recently_viewed`
    - `id` (uuid, primary key) - Unique identifier
    - `user_id` (uuid, nullable) - Reference to auth.users
    - `session_id` (text, nullable) - Session ID for guest users
    - `listing_id` (text) - ID of the viewed listing
    - `listing_data` (jsonb) - Full data of the listing
    - `view_count` (integer) - Number of times viewed
    - `last_viewed_at` (timestamptz) - Last view timestamp
    - `created_at` (timestamptz) - First view timestamp

  ## Security
  - Enable RLS on `recently_viewed` table
  - Add policy for users to view their own history
  - Add policy for users to insert/update their own history
  - Add policy for guests with session_id
*/

CREATE TABLE IF NOT EXISTS recently_viewed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  listing_id text NOT NULL,
  listing_data jsonb,
  view_count integer DEFAULT 1,
  last_viewed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recently viewed"
  ON recently_viewed
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Guests can view own recently viewed by session"
  ON recently_viewed
  FOR SELECT
  TO anon
  USING (session_id IS NOT NULL);

CREATE POLICY "Users can insert own recently viewed"
  ON recently_viewed
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guests can insert recently viewed"
  ON recently_viewed
  FOR INSERT
  TO anon
  WITH CHECK (session_id IS NOT NULL);

CREATE POLICY "Users can update own recently viewed"
  ON recently_viewed
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id ON recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_session_id ON recently_viewed(session_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_listing_id ON recently_viewed(listing_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_last_viewed ON recently_viewed(last_viewed_at DESC);

-- Create unique constraint to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_recently_viewed_unique_user_listing 
  ON recently_viewed(user_id, listing_id) 
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_recently_viewed_unique_session_listing 
  ON recently_viewed(session_id, listing_id) 
  WHERE session_id IS NOT NULL AND user_id IS NULL;
