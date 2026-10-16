import axios from 'axios';
import {
  User,
  Developer,
  Repository,
  Comparison,
  ComparisonResult,
  Pin,
  RateLimitInfo,
} from '../types';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('stackpulse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for friendly error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

// Auth Endpoints
export const authApi = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (email: string, password: string, name?: string): Promise<{ user: User; token: string }> => {
    const res = await apiClient.post('/auth/register', { email, password, name });
    return res.data;
  },
  demoLogin: async (): Promise<{ user: User; token: string }> => {
    const res = await apiClient.post('/auth/demo');
    return res.data;
  },
  getMe: async (): Promise<{ user: User }> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

// Developer Endpoints
export const developerApi = {
  getProfile: async (
    username: string,
    force: boolean = false
  ): Promise<{ developer: Developer; repos: Repository[]; is_cached: boolean }> => {
    const res = await apiClient.get(`/developers/${encodeURIComponent(username)}`, {
      params: { force: force ? 'true' : 'false' },
    });
    return res.data;
  },
  refreshProfile: async (
    username: string
  ): Promise<{ developer: Developer; repos: Repository[]; is_cached: boolean }> => {
    const res = await apiClient.post(`/developers/${encodeURIComponent(username)}/refresh`);
    return res.data;
  },
  getRecent: async (limit: number = 8): Promise<{ developers: Developer[] }> => {
    const res = await apiClient.get('/developers/recent', { params: { limit } });
    return res.data;
  },
  search: async (q: string): Promise<{ results: any[] }> => {
    const res = await apiClient.get('/developers/search', { params: { q } });
    return res.data;
  },
  getRateLimit: async (): Promise<{ rateLimit: RateLimitInfo; isPostgres: boolean }> => {
    const res = await apiClient.get('/developers/rate-limit');
    return res.data;
  },
};

// Compare Endpoints
export const compareApi = {
  compare: async (usernames: string[]): Promise<ComparisonResult> => {
    const res = await apiClient.post('/compare', { usernames });
    return res.data;
  },
  getSaved: async (): Promise<{ comparisons: Comparison[] }> => {
    const res = await apiClient.get('/compare/saved');
    return res.data;
  },
  save: async (name: string, usernames: string[], description?: string): Promise<{ comparison: Comparison }> => {
    const res = await apiClient.post('/compare/saved', { name, usernames, description });
    return res.data;
  },
  getById: async (id: number): Promise<{ comparison: Comparison }> => {
    const res = await apiClient.get(`/compare/saved/${id}`);
    return res.data;
  },
  update: async (id: number, name: string, usernames?: string[], description?: string): Promise<{ comparison: Comparison }> => {
    const res = await apiClient.put(`/compare/saved/${id}`, { name, usernames, description });
    return res.data;
  },
  delete: async (id: number): Promise<{ success: boolean }> => {
    const res = await apiClient.delete(`/compare/saved/${id}`);
    return res.data;
  },
};

// Pin & Annotation Endpoints
export const pinApi = {
  getPins: async (tag?: string): Promise<{ pins: Pin[] }> => {
    const res = await apiClient.get('/pins', { params: { tag } });
    return res.data;
  },
  pinRepo: async (repoId: number, note?: string, tags?: string[]): Promise<{ pin: Pin }> => {
    const res = await apiClient.post('/pins', { repoId, note, tags });
    return res.data;
  },
  updatePin: async (pinId: number, note?: string, tags?: string[]): Promise<{ pin: Pin }> => {
    const res = await apiClient.put(`/pins/${pinId}`, { note, tags });
    return res.data;
  },
  unpin: async (pinId: number): Promise<{ success: boolean }> => {
    const res = await apiClient.delete(`/pins/${pinId}`);
    return res.data;
  },
  unpinByRepo: async (repoId: number): Promise<{ success: boolean }> => {
    const res = await apiClient.delete(`/pins/repo/${repoId}`);
    return res.data;
  },
};
