import { useSyncExternalStore } from 'react'
import { configureAuthTokenHandlers } from '../../shared/api/httpClient'
import { authApi } from '../../features/auth/api/authApi'

export interface User {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
  roles: string[]
  phone?: string
  username?: string
  gender?: string
  dateOfBirth?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isInitialized: boolean
}

const USER_SESSION_KEY = 'webchicken_current_user'

function loadSavedUser(): User | null {
  try {
    const raw = sessionStorage.getItem(USER_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const initialSavedUser = loadSavedUser()

let state: AuthState = {
  user: initialSavedUser,
  accessToken: null,
  isAuthenticated: !!initialSavedUser,
  isInitialized: !initialSavedUser,
}

// Phục hồi access token trong nền từ HttpOnly cookie nếu có phiên người dùng lưu trữ
if (initialSavedUser && typeof window !== 'undefined') {
  authApi.refreshToken()
    .then((newToken) => {
      authStore.setAccessToken(newToken)
      authStore.setInitialized()
    })
    .catch(() => {
      // Cookie hết hạn hoặc không tồn tại -> dọn dẹp phiên cũ êm dịu, không giật lỗi
      authStore.logout()
    })
}

const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

export const authStore = {
  getState: () => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  setAuth: (user: User, accessToken: string) => {
    state = {
      user,
      accessToken,
      isAuthenticated: true,
      isInitialized: true,
    }
    try {
      sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user))
    } catch {
      // Ignore storage errors
    }
    emitChange()
  },

  updateUser: (partialUser: Partial<User>) => {
    if (!state.user) return
    state = {
      ...state,
      user: {
        ...state.user,
        ...partialUser,
      },
    }
    try {
      sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(state.user))
    } catch {
      // Ignore storage errors
    }
    emitChange()
  },

  setAccessToken: (accessToken: string) => {
    state = {
      ...state,
      accessToken,
      isAuthenticated: true,
    }
    emitChange()
  },

  logout: () => {
    state = {
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isInitialized: true,
    }
    try {
      sessionStorage.removeItem(USER_SESSION_KEY)
    } catch {
      // Ignore storage errors
    }
    emitChange()
  },

  setInitialized: () => {
    state = {
      ...state,
      isInitialized: true,
    }
    emitChange()
  },
}

// Kết nối với httpClient để tự động lấy token và refresh
configureAuthTokenHandlers(
  () => authStore.getState().accessToken,
  (newToken) => authStore.setAccessToken(newToken),
  () => authStore.logout()
)

export function useAuthStore() {
  const current = useSyncExternalStore(authStore.subscribe, authStore.getState, authStore.getState)

  return {
    ...current,
    login: authStore.setAuth,
    logout: authStore.logout,
    updateUser: authStore.updateUser,
    isAdmin: current.user?.roles.some((r) => ['SUPER_ADMIN', 'MODERATOR', 'ADMIN'].includes(r)) ?? false,
    isSeller: current.user?.roles.includes('SELLER') ?? false,
    isCustomer: current.user?.roles.includes('CUSTOMER') ?? true,
  }
}
