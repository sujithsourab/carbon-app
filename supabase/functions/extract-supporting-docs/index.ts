import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import * as pdfParse from 'npm:pdf-parse@1.1.1';
import mammoth from 'npm:mammoth@1.6.0';
import { z } from 'npm:zod@3.22.4';
import { initSentry, wrapHandler } from '../_shared/sentry.ts';

// Initialize Sentry
initSentry();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

const ExtractRequestSchema = z.object({
  path: z.string(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  if (req.method !== 'POST') {
    throw new Error('Method not allowed');
  }

  const body = await req.json();
  const result = ExtractRequestSchema.safeParse(body);

  if (!result.success) {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request data',
        details: result.error.format()
      }),
      { 
        status: 400,
        headers: corsHeaders
      }
    );
  }

  try {
    const { path } = result.data;

    // Download file from storage
    const { data: fileObj, error: downloadError } = await supabase
      .storage
      .from('supporting-docs')
      .download(path);

    if (downloadError || !fileObj) {
      throw new Error(downloadError?.message || 'File not found');
    }

    const buffer = await fileObj.arrayBuffer();
    const ext = path.split('.').pop()?.toLowerCase();

    let text = '';
    if (ext === 'pdf') {
      // Use pdfParse.default instead of pdf directly
      const data = await pdfParse.default(new Uint8Array(buffer));
      text = data.text;
    } else if (ext === 'docx') {
      const { value } = await mammoth.extractRawText({ buffer });
      text = value;
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    // Trim to a reasonable length (e.g., first 10k characters)
    if (text.length > 10000) {
      text = text.slice(0, 10000) + '...';
    }

    return new Response(
      JSON.stringify({ text }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error extracting document:', error);
    const errorMessage = error instanceof Error 
      ? `${error.message}${error.stack ? `\nStack: ${error.stack}` : ''}`
      : 'Unknown error';
      
    return new Response(
      JSON.stringify({ 
        error: 'Failed to extract document content',
        details: errorMessage
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

Deno.serve(wrapHandler(handler));