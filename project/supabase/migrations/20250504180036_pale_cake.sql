/*
  # Project Areas Management Schema

  1. New Tables
    - `project_areas`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `description` (text)
      - `geometry` (jsonb)
      - `area` (numeric)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Create updated_at trigger
    
  3. Performance
    - Add indexes for common query patterns
*/

-- Create project_areas table
CREATE TABLE IF NOT EXISTS project_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  geometry jsonb NOT NULL,
  area numeric NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_areas ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_project_areas_updated_at ON project_areas;
CREATE TRIGGER update_project_areas_updated_at
  BEFORE UPDATE ON project_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create RLS Policies
CREATE POLICY "Users can view their own project areas"
  ON project_areas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create project areas"
  ON project_areas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project areas"
  ON project_areas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project areas"
  ON project_areas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_areas_user_id ON project_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_project_areas_created_at ON project_areas(created_at);
CREATE INDEX IF NOT EXISTS idx_project_areas_metadata ON project_areas USING gin(metadata);