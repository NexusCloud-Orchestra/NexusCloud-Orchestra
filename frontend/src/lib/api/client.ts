import { ApiError, normalizeApiError } from './errors';

const DEFAULT_TIMEOUT_MS = 10000;

class ApiClient {
  private baseUrl: string;

  constructor() {
    // If VITE_API_BASE_URL is provided, use it. Otherwise use relative path for dev/prod server
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    this.baseUrl = envUrl ? envUrl.replace(/\/+$/, '') : '';
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new ApiError(0, 'Request timed out. Please try again.', true);
      }
      // Clean network failure: Never expose FetchError, ECONNREFUSED, or stack traces
      throw new ApiError(0, 'Unable to connect to NexusCloud. Please try again.', true);
    } finally {
      clearTimeout(id);
    }
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Ensures cookies are sent and received
    };

    let response: Response;
    try {
      response = await this.fetchWithTimeout(url, config);
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(0, 'Unable to connect to NexusCloud. Please try again.', true);
    }

    // Try parsing JSON response
    let data: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      try {
        const text = await response.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            data = { detail: text };
          }
        }
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const detail = data?.detail || data?.message;
      const normalizedMessage = normalizeApiError(response.status, detail);
      throw new ApiError(response.status, normalizedMessage);
    }

    return data as T;
  }

  public async get<T>(endpoint: string, token?: string | null): Promise<T> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  public async post<T>(endpoint: string, body: any, token?: string | null): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }

  /**
   * Post form data using application/x-www-form-urlencoded
   * Required by OAuth2 password flow contract:
   * grant_type=password&username=...&password=...
   */
  public async postForm<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    const formBody = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      formBody.append(key, value);
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    });
  }
}

export const apiClient = new ApiClient();
