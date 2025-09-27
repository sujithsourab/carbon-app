import { supabase } from './supabase';

export interface ExtractedDocument {
  name: string;
  text: string;
  error?: string;
}

export async function uploadAndExtractDocument(file: File): Promise<ExtractedDocument> {
  try {
    // Generate unique filename
    const fileName = `${crypto.randomUUID()}-${file.name}`;
    
    // Upload file to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('supporting-docs')
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    // Extract text content using edge function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-supporting-docs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: fileName })
    });

    if (!response.ok) {
      throw new Error('Failed to extract document content');
    }

    const { text } = await response.json();

    return {
      name: file.name,
      text
    };

  } catch (error) {
    console.error('Error processing document:', error);
    return {
      name: file.name,
      text: '',
      error: error instanceof Error ? error.message : 'Unknown error processing document'
    };
  }
}

export async function processDocuments(files: File[]): Promise<ExtractedDocument[]> {
  const results = await Promise.all(
    files.map(file => uploadAndExtractDocument(file))
  );
  
  return results;
}