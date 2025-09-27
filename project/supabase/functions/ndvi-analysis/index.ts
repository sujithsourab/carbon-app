import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { format, eachDayOfInterval } from 'npm:date-fns@3.3.1';
import { SentinelHub } from 'npm:@sentinel-hub/sentinelhub-js@latest';
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

const NDVIRequestSchema = z.object({
  geometry: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.array(z.number()))),
  }),
  startDate: z.string(),
  endDate: z.string(),
  projectId: z.string().optional(),
});

// Validate environment variables
const SENTINEL_HUB_CLIENT_ID = Deno.env.get('SENTINEL_HUB_CLIENT_ID');
const SENTINEL_HUB_CLIENT_SECRET = Deno.env.get('SENTINEL_HUB_CLIENT_SECRET');

if (!SENTINEL_HUB_CLIENT_ID || !SENTINEL_HUB_CLIENT_SECRET) {
  throw new Error('Missing required Sentinel Hub credentials');
}

// Initialize Sentinel Hub client
const sentinelHub = new SentinelHub({
  clientId: SENTINEL_HUB_CLIENT_ID,
  clientSecret: SENTINEL_HUB_CLIENT_SECRET
});

interface NDVIRequest {
  geometry: GeoJSON.Polygon;
  startDate: string;
  endDate: string;
  projectId?: string;
}

interface NDVIData {
  statistics: {
    date: string;
    mean: number;
    vegetatedArea: number;
  };
  raster: string;
}

async function calculateNDVI(geometry: GeoJSON.Polygon, date: Date): Promise<NDVIData> {
  try {
    // Define NDVI evaluation script
    const evalScript = `
      //VERSION=3
      function setup() {
        return {
          input: ["B04", "B08"],
          output: { bands: 1 }
        };
      }

      function evaluatePixel(sample) {
        let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
        return [ndvi];
      }
    `;

    // Request data from Sentinel Hub
    const request = {
      input: {
        bounds: {
          geometry,
        },
        data: [{
          dataFilter: {
            timeRange: {
              from: format(date, 'yyyy-MM-dd'),
              to: format(date, 'yyyy-MM-dd')
            },
            maxCloudCoverage: 20
          },
          type: 'S2L2A' // Sentinel-2 Level 2A data
        }]
      },
      output: {
        width: 512,
        height: 512,
        responses: [{
          identifier: 'default',
          format: { type: 'image/png' }
        }]
      },
      evalscript: evalScript
    };

    const response = await sentinelHub.process(request);
    if (!response) {
      throw new Error('No response from Sentinel Hub');
    }

    const rasterData = await response.blob();
    if (!rasterData) {
      throw new Error('Failed to get raster data from Sentinel Hub');
    }

    const rasterUrl = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(await rasterData.arrayBuffer())))}`;

    // Calculate statistics from the NDVI values
    const stats = await sentinelHub.getStatistics(request);
    if (!stats) {
      throw new Error('Failed to get statistics from Sentinel Hub');
    }

    const mean = stats.mean;
    const vegetatedArea = stats.histogram.filter(value => value > 0.3).length / stats.histogram.length * 100;

    return {
      statistics: {
        date: format(date, 'yyyy-MM-dd'),
        mean,
        vegetatedArea
      },
      raster: rasterUrl
    };
  } catch (error) {
    console.error('Error in calculateNDVI:', error);
    throw new Error(
      `Sentinel Hub error: ${error instanceof Error ? error.message : 'Unknown error processing satellite data'}`
    );
  }
}

async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const requestData = await req.json();
    const result = NDVIRequestSchema.safeParse(requestData);

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

    const { geometry, startDate, endDate, projectId } = result.data;

    // Calculate NDVI for each date in range
    const dateRange = eachDayOfInterval({
      start: new Date(startDate),
      end: new Date(endDate)
    });

    const ndviDataSeries = await Promise.all(
      dateRange.map(date => calculateNDVI(geometry, date))
    );

    // Store results if projectId is provided
    if (projectId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { error: insertError } = await supabase
        .from('ndvi_analyses')
        .insert(
          ndviDataSeries.map(data => ({
            project_id: projectId,
            geometry,
            date: data.statistics.date,
            results: data
          }))
        );

      if (insertError) {
        console.error('Error storing NDVI results:', insertError);
        throw new Error(`Failed to store NDVI results: ${insertError.message}`);
      }
    }

    return new Response(
      JSON.stringify(ndviDataSeries),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error processing NDVI request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'NDVI analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

Deno.serve(wrapHandler(handler));