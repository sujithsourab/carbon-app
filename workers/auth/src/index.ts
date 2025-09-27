import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';

const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://monumental-pasca-53afe5.netlify.app'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Types
interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
}

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// Helper functions
const generateId = () => crypto.randomUUID();
const hashPassword = async (password: string) => bcrypt.hash(password, 10);
const verifyPassword = async (password: string, hash: string) => bcrypt.compare(password, hash);

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

// Routes
app.post('/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Check if user exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400);
    }

    // Create user
    const userId = generateId();
    const passwordHash = await hashPassword(password);
    
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, email, name, passwordHash, new Date().toISOString()).run();

    // Generate JWT
    const token = await sign(
      { 
        id: userId, 
        email, 
        name,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
      },
      c.env.JWT_SECRET
    );

    return c.json({
      user: { id: userId, email, name },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Missing email or password' }, 400);
    }

    // Find user
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first() as User;

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate JWT
    const token = await sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
      },
      c.env.JWT_SECRET
    );

    return c.json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');
  return c.json({ user });
});

app.post('/logout', authMiddleware, async (c) => {
  // With JWT, logout is handled client-side by removing the token
  return c.json({ message: 'Logged out successfully' });
});

export default app;