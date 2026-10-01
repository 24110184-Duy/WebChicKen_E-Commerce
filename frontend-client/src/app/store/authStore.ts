import { useSyncExternalStore } from 'react'
import { configureAuthTokenHandlers } from '../../shared/api/httpClient'

export interface User {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
  roles: string[]
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isInitialized: boolean
}

let state: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitialized: false,
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
    isAdmin: current.user?.roles.some((r) => ['SUPER_ADMIN', 'MODERATOR', 'ADMIN'].includes(r)) ?? false,
    isSeller: current.user?.roles.includes('SELLER') ?? false,
    isCustomer: current.user?.roles.includes('CUSTOMER') ?? true,
  }
}
