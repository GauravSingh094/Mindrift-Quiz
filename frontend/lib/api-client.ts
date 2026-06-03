import { env } from '@/config/env';

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = env.NEXT_PUBLIC_API_URL;
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let authHeader = options.token;
  if (!authHeader && typeof window !== 'undefined') {
    // Client-side dynamic Clerk token resolution
    const clerk = (window as any).Clerk;
    if (clerk?.session) {
      try {
        authHeader = await clerk.session.getToken();
      } catch (err) {
        console.error('Failed to retrieve Clerk JWT token:', err);
      }
    }
  }

  if (authHeader) {
    headers.set('Authorization', `Bearer ${authHeader}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: 'Response parsing failed' };
      }

      throw {
        status: response.status,
        message: errorData.message || `HTTP error ${response.status}`,
        errors: errorData.errors,
        timestamp: new Date().toISOString(),
      };
    }

    // No content response handling
    if (response.status === 240 || response.status === 204) {
      return {} as T;
    }

    return await response.json() as T;
  } catch (error: any) {
    if (error.status) {
      throw error; // Rethrow parsed API error
    }
    throw {
      status: 500,
      message: error.message || 'Network connectivity failed',
      timestamp: new Date().toISOString(),
    };
  }
}

export default apiClient;
