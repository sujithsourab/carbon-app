/*
  # Document Templates and Training Data Schema

  1. New Tables
    - `document_templates`
      - `id` (uuid, primary key)
      - `name` (text)
      - `content` (jsonb) - Structured template content
      - `metadata` (jsonb) - Additional template metadata
      - `created_at` (timestamptz)
      
    - `training_documents`
      - `id` (uuid, primary key)
      - `template_id` (uuid, foreign key)
      - `content` (jsonb) - Document content with embeddings
      - `metadata` (jsonb) - Project metadata
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create document_templates table
CREATE TABLE IF NOT EXISTS document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content jsonb NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create training_documents table
CREATE TABLE IF NOT EXISTS training_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES document_templates(id),
  content jsonb NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access to templates"
  ON document_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to training documents"
  ON training_documents
  FOR SELECT
  TO authenticated
  USING (true);