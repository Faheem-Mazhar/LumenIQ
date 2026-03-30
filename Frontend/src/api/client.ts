import { store } from '../auth/store';
import { logout, setTokens } from '../auth/store/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Module-level promise guard — prevents concurrent 401s from each firing
// their own refresh request. All callers await the same single promise.
let refreshPromise: Promise<void> | null = null;

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
  /** Internal flag — set on the retry after a successful token refresh. */
  _isRetry?: boolean;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
    this.name = 'ApiError';
  }
}

/**
 * Calls POST /auth/refresh with the stored refresh token.
 * Dispatches setTokens() on success so both Redux and localStorage
 * are updated before any retry fires.
 *
 * Exported so that callers that bypass `api.*` (e.g. multipart file uploads
 * using raw fetch) can still benefit from the same refresh-then-retry flow.
 */
export async function refreshAuth(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  await refreshPromise;
}

async function doRefresh(): Promise<void> {
  const refreshToken = store.getState().auth.refreshToken;
  if (!refreshToken) throw new Error('No refresh token available');

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) throw new Error('Token refresh failed');

  const data = await response.json();
  store.dispatch(
    setTokens({ token: data.access_token, refreshToken: data.refresh_token }),
  );
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth = false, _isRetry = false, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  };

  if (!skipAuth) {
    const token = store.getState().auth.token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = { ...rest, headers };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // On 401: attempt a silent token refresh then retry the original request once.
  // skipAuth requests and retries bypass this to prevent infinite loops.
  if (response.status === 401 && !skipAuth && !_isRetry) {
    try {
      if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;
      // Retry with the fresh token that doRefresh stored in Redux + localStorage
      return request<T>(endpoint, { ...options, _isRetry: true });
    } catch {
      // Refresh failed — clear everything and send the user to login
      store.dispatch(logout());
      throw new ApiError(401, 'Session expired. Please sign in again.');
    }
  }

  if (response.status === 401) {
    store.dispatch(logout());
    throw new ApiError(401, 'Session expired. Please sign in again.');
  }

  if (!response.ok) {
    let detail = 'An unexpected error occurred';
    try {
      const errorBody = await response.json();
      detail = errorBody.detail || detail;
    } catch {
      // response body wasn't JSON
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export { ApiError };
