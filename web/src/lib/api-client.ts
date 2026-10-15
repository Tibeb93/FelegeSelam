import { ApiResponse } from '../types/api';

const BASE_API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// In-memory access token storage
let inMemoryAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export class ApiError extends Error {
  statusCode: number;
  errors?: any;
  rawResponse?: any;

  constructor(message: string, statusCode: number, errors?: any, raw?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.rawResponse = raw;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, any>;
  body?: any;
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

/**
 * Invokes the BFF refresh endpoint to exchange the httpOnly cookie for a fresh access token
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        return null;
      }

      const data = await response.json();
      const newToken = data.data?.accessToken || null;
      setAccessToken(newToken);
      return newToken;
    } catch {
      setAccessToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Core typed fetch wrapper
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    params,
    body,
    headers: customHeaders = {},
    skipAuth = false,
    skipRefresh = false,
    ...fetchOptions
  } = options;

  let url = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `${url.includes('?') ? '&' : '?'}${queryString}`;
    }
  }

  const headers: Record<string, string> = {
    ...((customHeaders as Record<string, string>) || {}),
  };

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth && inMemoryAccessToken) {
    headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  let finalBody: any = body;
  if (!isFormData && body !== undefined && typeof body !== 'string') {
    finalBody = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: finalBody,
    });
  } catch (error: any) {
    throw new ApiError(error.message || 'Network connection failed', 0);
  }

  // Handle 401 Unauthorized with token refresh and retry
  if (response.status === 401 && !skipRefresh) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry request once with the new access token
      return apiRequest<T>(endpoint, {
        ...options,
        skipRefresh: true, // Prevent infinite refresh loop
      });
    }
  }

  // Handle file stream responses (Blob)
  const contentType = response.headers.get('content-type') || '';
  if (
    contentType.includes('application/pdf') ||
    contentType.includes('application/vnd.openxmlformats-officedocument') ||
    contentType.includes('application/octet-stream')
  ) {
    if (!response.ok) {
      throw new ApiError('Failed to download file', response.status);
    }
    return (await response.blob()) as unknown as T;
  }

  let json: ApiResponse<T> | any;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const errorMessage =
      json?.message ||
      json?.error ||
      `Request failed with status code ${response.status}`;
    throw new ApiError(errorMessage, response.status, json?.errors, json);
  }

  // If response matches a paginated response with data array and meta, normalize to PaginatedResponse
  if (json && typeof json === 'object' && Array.isArray(json.data) && json.meta) {
    return {
      items: json.data,
      total: json.meta.total ?? json.data.length,
      page: json.meta.page ?? 1,
      limit: json.meta.limit ?? json.data.length,
      totalPages: json.meta.totalPages ?? 1,
      data: json.data,
      meta: json.meta,
    } as unknown as T;
  }

  // If response matches our NestJS ApiResponse envelope, unwrap data
  if (json && typeof json === 'object' && 'data' in json && 'success' in json) {
    return json.data as T;
  }

  return json as T;
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
