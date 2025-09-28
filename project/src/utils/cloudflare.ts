// Cloudflare Workers API client
const API_BASE_URL = import.meta.env.VITE_CLOUDFLARE_API_URL || '';
const AUTH_BASE_URL = import.meta.env.VITE_CLOUDFLARE_AUTH_URL || '';

// Mock authentication for development when Cloudflare Workers are not available
const USE_MOCK_AUTH = !AUTH_BASE_URL.trim() || !API_BASE_URL.trim();

if (USE_MOCK_AUTH) {
  console.warn('Using mock authentication - Cloudflare Workers not configured');
}

class CloudflareClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async login(email: string, password: string) {
    if (USE_MOCK_AUTH) {
      // Mock authentication for development
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      const mockToken = btoa(JSON.stringify({ id: user.id, email: user.email, name: user.name }));
      this.token = mockToken;
      localStorage.setItem('auth_token', mockToken);
      
      return {
        user: { id: user.id, email: user.email, name: user.name },
        token: mockToken
      };
    }

    const response = await fetch(`${AUTH_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    this.token = data.token;
    localStorage.setItem('auth_token', data.token);
    return data;
  }

  async signup(email: string, password: string, name: string) {
    if (USE_MOCK_AUTH) {
      // Mock signup for development
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      
      if (users.find((u: any) => u.email === email)) {
        throw new Error('User already exists');
      }
      
      const newUser = {
        id: crypto.randomUUID(),
        email,
        password,
        name,
        created_at: new Date().toISOString()
      };
      
      users.push(newUser);
      localStorage.setItem('mock_users', JSON.stringify(users));
      
      const mockToken = btoa(JSON.stringify({ id: newUser.id, email: newUser.email, name: newUser.name }));
      this.token = mockToken;
      localStorage.setItem('auth_token', mockToken);
      
      return {
        user: { id: newUser.id, email: newUser.email, name: newUser.name },
        token: mockToken
      };
    }

    const response = await fetch(`${AUTH_BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const data = await response.json();
    this.token = data.token;
    localStorage.setItem('auth_token', data.token);
    return data;
  }

  async logout() {
    if (USE_MOCK_AUTH) {
      this.token = null;
      localStorage.removeItem('auth_token');
      return;
    }

    try {
      await this.request(`${AUTH_BASE_URL}/logout`, { method: 'POST' });
    } finally {
      this.token = null;
      localStorage.removeItem('auth_token');
    }
  }

  async getCurrentUser() {
    if (USE_MOCK_AUTH) {
      if (!this.token) {
        throw new Error('No token provided');
      }
      
      try {
        const userData = JSON.parse(atob(this.token));
        return { user: userData };
      } catch {
        throw new Error('Invalid token');
      }
    }

    return this.request(`${AUTH_BASE_URL}/me`);
  }

  // Project methods
  async getProjects() {
    if (USE_MOCK_AUTH) {
      const projects = JSON.parse(localStorage.getItem('mock_projects') || '[]');
      return projects;
    }

    return this.request(`${API_BASE_URL}/projects`);
  }

  async createProject(projectData: any) {
    if (USE_MOCK_AUTH) {
      const projects = JSON.parse(localStorage.getItem('mock_projects') || '[]');
      const newProject = {
        ...projectData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      };
      projects.push(newProject);
      localStorage.setItem('mock_projects', JSON.stringify(projects));
      return newProject;
    }

    return this.request(`${API_BASE_URL}/projects`, {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  // File upload methods
  async uploadFile(file: File) {
    if (USE_MOCK_AUTH) {
      // Mock file upload
      return {
        id: crypto.randomUUID(),
        filename: file.name,
        path: `mock/${file.name}`
      };
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  async extractDocument(path: string) {
    if (USE_MOCK_AUTH) {
      // Mock document extraction
      return {
        text: `Mock extracted content from ${path}. This is a sample text extraction for development purposes.`
      };
    }

    return this.request(`${API_BASE_URL}/extract-document`, {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  }

  // Analysis methods
  async analyzeNDVI(geometry: any, startDate: string, endDate: string, projectId?: string) {
    if (USE_MOCK_AUTH) {
      // Mock NDVI analysis
      return [{
        statistics: {
          date: startDate,
          mean: Math.random() * 0.8 + 0.2,
          vegetatedArea: Math.random() * 80 + 20
        },
        raster: 'data:image/png;base64,mock-raster-data'
      }];
    }

    return this.request(`${API_BASE_URL}/ndvi-analysis`, {
      method: 'POST',
      body: JSON.stringify({ geometry, startDate, endDate, projectId }),
    });
  }

  async analyzeForest(geometry: any, startDate: string, endDate: string, userId?: string) {
    if (USE_MOCK_AUTH) {
      // Mock forest analysis
      const startArea = Math.random() * 1000 + 500;
      const endArea = startArea * (Math.random() * 0.4 + 0.8);
      const change = endArea - startArea;
      const changePercent = (change / startArea) * 100;

      return {
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
    }

    return this.request(`${API_BASE_URL}/forest-analysis`, {
      method: 'POST',
      body: JSON.stringify({ geometry, startDate, endDate, userId }),
    });
  }

  // Project areas methods
  async getProjectAreas() {
    if (USE_MOCK_AUTH) {
      const areas = JSON.parse(localStorage.getItem('mock_project_areas') || '[]');
      return areas;
    }

    return this.request(`${API_BASE_URL}/project-areas`);
  }

  async createProjectArea(areaData: any) {
    if (USE_MOCK_AUTH) {
      const areas = JSON.parse(localStorage.getItem('mock_project_areas') || '[]');
      const newArea = {
        ...areaData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      areas.push(newArea);
      localStorage.setItem('mock_project_areas', JSON.stringify(areas));
      return newArea;
    }

    return this.request(`${API_BASE_URL}/project-areas`, {
      method: 'POST',
      body: JSON.stringify(areaData),
    });
  }

  async deleteProjectArea(id: string) {
    if (USE_MOCK_AUTH) {
      const areas = JSON.parse(localStorage.getItem('mock_project_areas') || '[]');
      const filteredAreas = areas.filter((area: any) => area.id !== id);
      localStorage.setItem('mock_project_areas', JSON.stringify(filteredAreas));
      return { message: 'Project area deleted successfully' };
    }

    return this.request(`${API_BASE_URL}/project-areas/${id}`, {
      method: 'DELETE',
    });
  }
}

export const cloudflareClient = new CloudflareClient();