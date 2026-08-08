import type { ApiSuccessResponse, ApiErrorResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>[];

  constructor(statusCode: number, code: string, message: string, details?: Record<string, unknown>[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiSuccessResponse<T>> {
  const { params, headers: customHeaders, ...restOptions } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const token = localStorage.getItem('nexora_jwt_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...restOptions,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('nexora_jwt_token');
      localStorage.removeItem('nexora_user');
      window.dispatchEvent(new Event('nexora_unauthorized'));
    }

    const errData = data as ApiErrorResponse | null;
    const errorCode = errData?.error?.code || 'UNKNOWN_ERROR';
    const errorMessage = errData?.error?.message || `HTTP ${response.status} Request failed`;
    const details = errData?.error?.details as Record<string, unknown>[] | undefined;

    throw new ApiError(response.status, errorCode, errorMessage, details);
  }

  return data as ApiSuccessResponse<T>;
}
