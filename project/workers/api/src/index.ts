import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { verify } from 'hono/jwt';

const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://monumental-pasca-53afe5.netlify.app'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  JWT_SECRET: string;
  OPENAI_API_KEY: string;
}

// Auth middleware
const authMiddleware = async (c: any, next: any) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return c.json({ error: 'No token provided' }, 401);
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

// Project routes
app.get('/projects', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const projects = await c.env.DB.prepare(
      'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(user.id).all();

    return c.json(projects.results);
  } catch (error) {
    console.error('Get projects error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/projects', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const projectData = await c.req.json();
    
    const projectId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO projects (
        id, user_id, name, location, start_date, end_date, 
        methodology, project_type, project_stage, description, 
        standard, extracted_text, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      projectId, user.id, projectData.name, projectData.location,
      projectData.startDate, projectData.endDate, projectData.methodology,
      projectData.projectType, projectData.projectStage, projectData.description,
      projectData.standard, projectData.extractedText || '', now, now
    ).run();

    // Store documents if provided
    if (projectData.documents) {
      for (const doc of projectData.documents) {
        await c.env.DB.prepare(`
          INSERT INTO project_documents (id, project_id, name, content, type, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(), projectId, doc.name, doc.text, 'supporting', now
        ).run();
      }
    }

    return c.json({ id: projectId, ...projectData });
  } catch (error) {
    console.error('Create project error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// File upload routes
app.post('/upload', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const fileId = crypto.randomUUID();
    const fileName = `${user.id}/${fileId}-${file.name}`;
    
    // Store file in R2
    await c.env.STORAGE.put(fileName, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Store file metadata in database
    await c.env.DB.prepare(`
      INSERT INTO uploaded_files (id, user_id, filename, file_path, mime_type, file_size, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      fileId, user.id, file.name, fileName, file.type, file.size, new Date().toISOString()
    ).run();

    return c.json({ 
      id: fileId, 
      filename: file.name, 
      path: fileName 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Document extraction
app.post('/extract-document', authMiddleware, async (c) => {
  try {
    const { path } = await c.req.json();
    
    // Get file from R2
    const file = await c.env.STORAGE.get(path);
    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    // For now, return mock extracted text
    // In production, you'd implement actual document parsing
    const mockText = `Extracted content from ${path}. This would contain the actual document text in a real implementation.`;
    
    return c.json({ text: mockText });
  } catch (error) {
    console.error('Extract document error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// NDVI Analysis
app.post('/ndvi-analysis', authMiddleware, async (c) => {
  try {
    const { geometry, startDate, endDate, projectId } = await c.req.json();
    
    // Mock NDVI analysis - replace with actual satellite data processing
    const mockResults = {
      statistics: {
        date: startDate,
        mean: Math.random() * 0.8 + 0.2,
        vegetatedArea: Math.random() * 80 + 20
      },
      raster: 'data:image/png;base64,mock-raster-data'
    };

    // Store results if projectId provided
    if (projectId) {
      await c.env.DB.prepare(`
        INSERT INTO ndvi_analyses (id, project_id, geometry, date, results, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), projectId, JSON.stringify(geometry), 
        startDate, JSON.stringify(mockResults), new Date().toISOString()
      ).run();
    }

    return c.json([mockResults]);
  } catch (error) {
    console.error('NDVI analysis error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Forest Analysis
app.post('/forest-analysis', authMiddleware, async (c) => {
  try {
    const { geometry, startDate, endDate, userId } = await c.req.json();
    
    // Mock forest analysis
    const startArea = Math.random() * 1000 + 500;
    const endArea = startArea * (Math.random() * 0.4 + 0.8);
    const change = endArea - startArea;
    const changePercent = (change / startArea) * 100;

    const results = {
      startDate,
      endDate,
      startArea,
      endArea,
      change,
      changePercent,
      startRaster: 'data:image/png;base64,mock-start-raster',
      endRaster: 'data:image/png;base64,mock-end-raster',
      changeRaster: 'data:image/png;base64,mock-change-raster'
    };

    // Store results
    if (userId) {
      await c.env.DB.prepare(`
        INSERT INTO forest_analyses (id, user_id, geometry, start_date, end_date, results, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), userId, JSON.stringify(geometry),
        startDate, endDate, JSON.stringify(results), new Date().toISOString()
      ).run();
    }

    return c.json(results);
  } catch (error) {
    console.error('Forest analysis error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Project Areas
app.get('/project-areas', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const areas = await c.env.DB.prepare(
      'SELECT * FROM project_areas WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(user.id).all();

    return c.json(areas.results);
  } catch (error) {
    console.error('Get project areas error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/project-areas', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { name, description, geometry, area, metadata } = await c.req.json();
    
    const areaId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO project_areas (id, user_id, name, description, geometry, area, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      areaId, user.id, name, description, JSON.stringify(geometry), 
      area, JSON.stringify(metadata || {}), now, now
    ).run();

    return c.json({
      id: areaId,
      user_id: user.id,
      name,
      description,
      geometry,
      area,
      metadata: metadata || {},
      created_at: now,
      updated_at: now
    });
  } catch (error) {
    console.error('Create project area error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.delete('/project-areas/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const areaId = c.req.param('id');

    await c.env.DB.prepare(
      'DELETE FROM project_areas WHERE id = ? AND user_id = ?'
    ).bind(areaId, user.id).run();

    return c.json({ message: 'Project area deleted successfully' });
  } catch (error) {
    console.error('Delete project area error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;