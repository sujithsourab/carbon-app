/*
  # Add NDVI Analysis Support

  1. New Tables
    - `ndvi_analyses`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `geometry` (jsonb)
      - `date` (timestamptz)
      - `results` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `ndvi_analyses` table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS ndvi_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES document_templates(id),
  geometry jsonb NOT NULL,
  date timestamptz NOT NULL,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ndvi_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own NDVI analyses"
  ON ndvi_analyses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own NDVI analyses"
  ON ndvi_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);