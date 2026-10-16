import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config.js';
import { RateLimitInfo } from '../types/index.js';

class GitHubService {
  private client: AxiosInstance;
  private currentRateLimit: RateLimitInfo = {
    limit: 60,
    remaining: 60,
    reset: Math.floor(Date.now() / 1000) + 3600,
    used: 0,
  };

  constructor() {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'StackPulse-Developer-Analytics/1.0',
    };

    if (config.githubToken) {
      headers.Authorization = `Bearer ${config.githubToken}`;
      this.currentRateLimit.limit = 5000;
      this.currentRateLimit.remaining = 5000;
    }

    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers,
      timeout: 10000,
    });

    // Interceptor to record rate limit response headers
    this.client.interceptors.response.use(
      (response) => {
        this.updateRateLimitFromHeaders(response);
        return response;
      },
      (error) => {
        if (error.response) {
          this.updateRateLimitFromHeaders(error.response);
        }
        return Promise.reject(error);
      }
    );
  }

  private updateRateLimitFromHeaders(response: AxiosResponse) {
    const limit = response.headers['x-ratelimit-limit'];
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];
    const used = response.headers['x-ratelimit-used'];

    if (limit) this.currentRateLimit.limit = parseInt(limit, 10);
    if (remaining) this.currentRateLimit.remaining = parseInt(remaining, 10);
    if (reset) this.currentRateLimit.reset = parseInt(reset, 10);
    if (used) this.currentRateLimit.used = parseInt(used, 10);
  }

  public getRateLimitInfo(): RateLimitInfo {
    return { ...this.currentRateLimit };
  }

  /**
   * Fetch developer user profile from GitHub
   */
  public async fetchUserProfile(username: string): Promise<any> {
    try {
      const response = await this.client.get(`/users/${encodeURIComponent(username)}`);
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        throw new Error(`GitHub user '${username}' not found.`);
      }
      if (err.response?.status === 403 && this.currentRateLimit.remaining === 0) {
        const resetMinutes = Math.max(1, Math.ceil((this.currentRateLimit.reset - Date.now() / 1000) / 60));
        throw new Error(`GitHub API rate limit exceeded. Resets in ${resetMinutes} minute(s). Provide a GITHUB_TOKEN in .env for 5,000 requests/hr.`);
      }
      throw new Error(`Failed to fetch GitHub profile for '${username}': ${err.message}`);
    }
  }

  /**
   * Fetch repositories for a user (up to 100 most recently updated)
   */
  public async fetchUserRepos(username: string, perPage: number = 100): Promise<any[]> {
    try {
      const response = await this.client.get(`/users/${encodeURIComponent(username)}/repos`, {
        params: {
          per_page: perPage,
          sort: 'updated',
          direction: 'desc',
        },
      });
      return response.data;
    } catch (err: any) {
      console.warn(`[GitHubService] Repos fetch warning for ${username}:`, err.message);
      return [];
    }
  }

  /**
   * Fetch language breakdown for a specific repository
   */
  public async fetchRepoLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    // If rate limit is running low (< 10 requests left), skip individual deep calls
    if (this.currentRateLimit.remaining < 10) {
      return {};
    }
    try {
      const response = await this.client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`);
      return response.data || {};
    } catch (err: any) {
      return {};
    }
  }

  /**
   * Fetch recent commit events or commit activity for a user
   */
  public async fetchUserCommitEvents(username: string): Promise<any[]> {
    if (this.currentRateLimit.remaining < 5) {
      return [];
    }
    try {
      const response = await this.client.get(`/users/${encodeURIComponent(username)}/events/public`, {
        params: { per_page: 50 },
      });
      // Filter for PushEvent where user commits
      return (response.data || []).filter((e: any) => e.type === 'PushEvent');
    } catch (err: any) {
      return [];
    }
  }

  /**
   * Fetch commit activity for a specific top repository
   */
  public async fetchRepoCommits(owner: string, repo: string, perPage: number = 20): Promise<any[]> {
    if (this.currentRateLimit.remaining < 10) {
      return [];
    }
    try {
      const response = await this.client.get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits`, {
        params: { per_page: perPage },
      });
      return response.data || [];
    } catch (err: any) {
      return [];
    }
  }
}

export const githubService = new GitHubService();
