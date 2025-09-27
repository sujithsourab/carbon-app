/*
  # Storage Setup for Supporting Documents

  1. Create storage bucket
  2. Set up RLS policies for bucket access
  3. Create supporting_documents table
  4. Set up RLS policies for table access
  5. Create updated_at trigger
*/

-- Create supporting_documents table
CREATE TABLE IF NOT EXISTS supporting_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  file_path text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE supporting_documents ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_supporting_documents_updated_at ON supporting_documents;
CREATE TRIGGER update_supporting_documents_updated_at
  BEFORE UPDATE ON supporting_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own documents" ON supporting_documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON supporting_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON supporting_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON supporting_documents;

-- Create RLS Policies
CREATE POLICY "Users can view their own documents"
  ON supporting_documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON supporting_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON supporting_documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON supporting_documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);