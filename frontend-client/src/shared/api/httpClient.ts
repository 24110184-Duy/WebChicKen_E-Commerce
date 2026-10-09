import type { ApiResponse, ApiError } from '../types/api'

function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL
  if (typeof window !== 'undefined') {
    const pathParts = window.location.pathname.split('/').filter(Boolean)
    if (pathParts.length > 0 && pathParts[0] === 'web1_war_exploded') {
      return `${window.location.origin}/web1_war_exploded/api/v1`
    }
    return `${window.location.origin}/api/v1`
  }
  return 'http://localhost:8080/api/v1'
}

const API_BASE_URL = getApiBaseUrl()

// Token getter & setter callback được đăng ký bởi authStore
let getAccessTokenFn: () => string | null = () => null
let onTokenRefreshedFn: (newToken: string) => void = () => {}
let onAuthFailedFn: () => void = () => {}

export function configureAuthTokenHandlers(
  getAccessToken: () => string | null,
  onTokenRefreshed: (newToken: string) => void,
  onAuthFailed: () => void
) {
  getAccessTokenFn = getAccessToken
  onTokenRefreshedFn = onTokenRefreshed
  onAuthFailedFn = onAuthFailed
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
  skipAuth?: boolean
}

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

async function handleRefreshToken(): Promise<string> {
  const refreshUrl = `${API_BASE_URL}/auth/refresh-token`
  const res = await fetch(refreshUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Id': crypto.randomUUID(),
    },
    credentials: 'include', // Mang theo HttpOnly cookie
  })

  if (!res.ok) {
    throw new Error('Refresh token expired')
  }

  const json: ApiResponse<{ accessToken: string }> = await res.json()
  if (!json.success || !json.data?.accessToken) {
    throw new Error('Invalid token response')
  }

  return json.data.accessToken
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { params, skipAuth = false, headers: customHeaders, ...fetchOptions } = options

  // 1. Chuẩn hóa endpoint và xây dựng URL kèm Query Params
  let cleanEndpoint = endpoint
  if (cleanEndpoint.startsWith('/api/v1/')) {
    cleanEndpoint = cleanEndpoint.substring('/api/v1'.length)
  } else if (cleanEndpoint === '/api/v1') {
    cleanEndpoint = '/'
  }

  let url = cleanEndpoint.startsWith('http')
    ? cleanEndpoint
    : `${API_BASE_URL}${cleanEndpoint.startsWith('/') ? '' : '/'}${cleanEndpoint}`
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  // 2. Chuẩn bị Headers
  const headers = new Headers(customHeaders)
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (!headers.has('X-Request-Id')) {
    headers.set('X-Request-Id', crypto.randomUUID())
  }
  headers.set('Accept-Language', 'vi-VN,vi;q=0.9')

  // Gắn Access Token từ memory
  if (!skipAuth) {
    const token = getAccessTokenFn()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  // 3. Thực thi Request
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  })

  // 4. Xử lý 401 Unauthorized (Refresh Token xoay vòng)
  if (response.status === 401 && !skipAuth && !url.includes('/auth/refresh-token')) {
    if (!isRefreshing) {
      isRefreshing = true
      try {
        const newToken = await handleRefreshToken()
        isRefreshing = false
        onTokenRefreshedFn(newToken)
        onRefreshed(newToken)

        // Retry request hiện tại với token mới
        headers.set('Authorization', `Bearer ${newToken}`)
        const retryRes = await fetch(url, {
          ...fetchOptions,
          headers,
          credentials: 'include',
        })
        return handleResponse<T>(retryRes)
      } catch {
        isRefreshing = false
        refreshSubscribers = []
        onAuthFailedFn()
        throw {
          code: 'UNAUTHORIZED',
          message: 'Session expired. Please sign in again.',
        } as ApiError
      }
    } else {
      // Wait for refresh token to complete
      return new Promise<ApiResponse<T>>((resolve, reject) => {
        subscribeTokenRefresh((newToken: string) => {
          headers.set('Authorization', `Bearer ${newToken}`)
          fetch(url, { ...fetchOptions, headers, credentials: 'include' })
            .then(handleResponse<T>)
            .then(resolve)
            .catch(reject)
        })
      })
    }
  }

  return handleResponse<T>(response)
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (response.status === 204) {
    return { success: true, data: null as unknown as T }
  }

  let json: ApiResponse<T>
  try {
    json = await response.json()
  } catch {
    throw {
      code: 'PARSE_ERROR',
      message: 'Unable to parse server response.',
    } as ApiError
  }

  if (!response.ok || !json.success) {
    const error: ApiError = json.error || {
      code: `HTTP_${response.status}`,
      message: response.statusText || 'Request failed.',
    }
    throw error
  }

  return json
}

export const httpClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}
