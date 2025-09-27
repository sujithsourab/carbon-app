import { supabase } from './supabase';

export async function uploadTiles(files: FileList): Promise<string> {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  
  // Upload each tile file to Supabase Storage
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = file.webkitRelativePath || file.name;
    
    const { error } = await supabase.storage
      .from('tiles')
      .upload(filePath, file, {
        cacheControl: '31536000', // Cache for 1 year
        upsert: true
      });

    if (error) {
      console.error(`Error uploading ${filePath}:`, error);
      throw error;
    }
  }

  // Return the base URL for the tiles
  return `${SUPABASE_URL}/storage/v1/object/public/tiles/{z}/{x}/{y}.png`;
}

export function getTileUrl(bucketName: string = 'tiles'): string {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/{z}/{x}/{y}.png`;
}