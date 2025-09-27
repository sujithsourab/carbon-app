// Cloudflare Workers API client
const API_BASE_URL = import.meta.env.VITE_CLOUDFLARE_API_URL || 'https://carbon-api-worker.your-subdomain.workers.dev';
const AUTH_BASE_URL = import.meta.env.VITE_CLOUDFLARE_AUTH_URL || 'https://carbon-auth-worker.your-subdomain.workers.dev';

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
    try {
      await this.request(`${AUTH_BASE_URL}/logout`, { method: 'POST' });
    } finally {
      this.token = null;
      localStorage.removeItem('auth_token');
    }
  }

  async getCurrentUser() {
    return this.request(`${AUTH_BASE_URL}/me`);
  }

  // Project methods
  async getProjects() {
    return this.request(`${API_BASE_URL}/projects`);
  }

  async createProject(projectData: any) {
    return this.request(`${API_BASE_URL}/projects`, {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  // File upload methods
  async uploadFile(file: File) {
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
    return this.request(`${API_BASE_URL}/extract-document`, {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  }

  // Analysis methods
  async analyzeNDVI(geometry: any, startDate: string, endDate: string, projectId?: string) {
    return this.request(`${API_BASE_URL}/ndvi-analysis`, {
      method: 'POST',
      body: JSON.stringify({ geometry, startDate, endDate, projectId }),
    });
  }

  async analyzeForest(geometry: any, startDate: string, endDate: string, userId?: string) {
    return this.request(`${API_BASE_URL}/forest-analysis`, {
      method: 'POST',
      body: JSON.stringify({ geometry, startDate, endDate, userId }),
    });
  }

  // Project areas methods
  async getProjectAreas() {
    return this.request(`${API_BASE_URL}/project-areas`);
  }

  async createProjectArea(areaData: any) {
    return this.request(`${API_BASE_URL}/project-areas`, {
      method: 'POST',
      body: JSON.stringify(areaData),
    });
  }

  async deleteProjectArea(id: string) {
    return this.request(`${API_BASE_URL}/project-areas/${id}`, {
      method: 'DELETE',
    });
  }
}

export const cloudflareClient = new CloudflareClient();