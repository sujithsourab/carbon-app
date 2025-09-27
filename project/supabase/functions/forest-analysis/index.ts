import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { format } from 'npm:date-fns@3.3.1';
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

const ForestAnalysisSchema = z.object({
  geometry: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.array(z.number()))),
  }),
  startDate: z.string(),
  endDate: z.string(),
  userId: z.string().optional(),
});

// Mock raster URLs with visible gradients for forest visualization
const mockRasterUrls = {
  start: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAA50lEQVR4nO3cwQ2CQBQFUYzpf2nYAQ2YqLAz74xJ/nkVcE+ylwUAAAAAAAAAAADgbY7jOO77vt+fz+f3OI7v6p1f1QO/6jiO7+u6/t77fp7nz+qtn3+Q+76/K3b+VQ/8spmHzKge+GVmFAAAAAAAAAAAALBh5ld15QzYzK/qyhmwHjKjhwAAAAAAAAAAAABbZn5VV86AzfyqrpwB6yEzegiwZeZXdeUM2Myv6soZsB4yo4cAAAAAAAAAAAAAW2Z+VVfOgM38qq6cAeshM3oIsGXmV3XlDNjMr+rKGbAeMqOHAAAAAAAAAAAAAMATN0NhvKs7Iu3WAAAAAElFTkSuQmCC',
  end: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAA50lEQVR4nO3cwQ2CQBQFUYzpf2nYAQ2YqLAz74xJ/nkVcE+ylwUAAAAAAAAAAADgbY7jOO77vt+fz+f3OI7v6p1f1QO/6jiO7+u6/t77fp7nz+qtn3+Q+76/K3b+VQ/8spmHzKge+GVmFAAAAAAAAAAAALBh5ld15QzYzK/qyhmwHjKjhwAAAAAAAAAAAABbZn5VV86AzfyqrpwB6yEzegiwZeZXdeUM2Myv6soZsB4yo4cAAAAAAAAAAAAAW2Z+VVfOgM38qq6cAeshM3oIsGXmV3XlDNjMr+rKGbAeMqOHAAAAAAAAAAAAAMATN0NhvKs7Iu3WAAAAAElFTkSuQmCC',
  change: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAA50lEQVR4nO3cwQ2CQBQFUYzpf2nYAQ2YqLAz74xJ/nkVcE+ylwUAAAAAAAAAAADgbY7jOO77vt+fz+f3OI7v6p1f1QO/6jiO7+u6/t77fp7nz+qtn3+Q+76/K3b+VQ/8spmHzKge+GVmFAAAAAAAAAAAALBh5ld15QzYzK/qyhmwHjKjhwAAAAAAAAAAAABbZn5VV86AzfyqrpwB6yEzegiwZeZXdeUM2Myv6soZsB4yo4cAAAAAAAAAAAAAW2Z+VVfOgM38qq6cAeshM3oIsGXmV3XlDNjMr+rKGbAeMqOHAAAAAAAAAAAAAMATN0NhvKs7Iu3WAAAAAElFTkSuQmCC'
};

const handler = async (req: Request) => {
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
  const result = ForestAnalysisSchema.safeParse(body);

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

  const { geometry, startDate, endDate, userId } = result.data;

  try {
    // Generate mock analysis results
    // In a real implementation, this would call Sentinel Hub or similar service
    const startArea = Math.random() * 1000 + 500; // Random area between 500-1500 ha
    const endArea = startArea * (Math.random() * 0.4 + 0.8); // Random change between -20% and +20%
    const change = endArea - startArea;
    const changePercent = (change / startArea) * 100;

    const results = {
      startDate: format(new Date(startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(endDate), 'yyyy-MM-dd'),
      startArea,
      endArea,
      change,
      changePercent,
      startRaster: mockRasterUrls.start,
      endRaster: mockRasterUrls.end,
      changeRaster: mockRasterUrls.change
    };

    // Store results if userId is provided
    if (userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase
        .from('forest_analyses')
        .insert({
          user_id: userId,
          geometry,
          start_date: startDate,
          end_date: endDate,
          results
        });
    }

    return new Response(
      JSON.stringify(results),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error processing forest analysis request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
};

Deno.serve(wrapHandler(handler));