/*
  # Add Onboarding Status to User Settings

  ## Summary
  Extends the user_settings table to track onboarding completion status.

  ## Changes
  - Add `onboarding_completed` column to track if user has seen onboarding
  - Add `onboarding_completed_at` to track when they completed it
  - Set default value to false for new users

  ## Notes
  - This allows us to show onboarding only to first-time users
  - Existing users will have onboarding_completed set to NULL initially
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'onboarding_completed_at'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN onboarding_completed_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_settings_onboarding ON user_settings(onboarding_completed);
