/*
  # Forest Change Detection Schema

  1. New Tables
    - `forest_analyses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `geometry` (jsonb) - GeoJSON polygon
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `results` (jsonb) - Analysis results including:
        - Forest area at start/end
        - Change statistics
        - Raster visualization URLs
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on forest_analyses table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS forest_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  geometry jsonb NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE forest_analyses ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own analyses
CREATE POLICY "Users can read own forest analyses"
  ON forest_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to create new analyses
CREATE POLICY "Users can create forest analyses"
  ON forest_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);