/*
  # Add voice settings columns to user_settings table

  1. Changes
    - Add `voice_rate` column (numeric) for speech rate
    - Add `voice_pitch` column (numeric) for speech pitch  
    - Add `voice_volume` column (numeric) for speech volume
  
  2. Details
    - All columns are nullable with sensible defaults
    - voice_rate: default 0.88 (range 0.5-2.0)
    - voice_pitch: default 1.05 (range 0.5-2.0)
    - voice_volume: default 0.95 (range 0.0-1.0)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'voice_rate'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN voice_rate numeric DEFAULT 0.88;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'voice_pitch'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN voice_pitch numeric DEFAULT 1.05;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'voice_volume'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN voice_volume numeric DEFAULT 0.95;
  END IF;
END $$;