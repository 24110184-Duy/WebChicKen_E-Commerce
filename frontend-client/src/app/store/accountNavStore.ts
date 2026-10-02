import { useSyncExternalStore } from 'react'

let isAccountMenuOpen = false
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

export const accountNavStore = {
  isOpen: () => isAccountMenuOpen,

  open: () => {
    if (!isAccountMenuOpen) {
      isAccountMenuOpen = true
      emitChange()
    }
  },

  close: () => {
    if (isAccountMenuOpen) {
      isAccountMenuOpen = false
      emitChange()
    }
  },

  toggle: () => {
    isAccountMenuOpen = !isAccountMenuOpen
    emitChange()
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function useAccountNav() {
  const isAccountOpen = useSyncExternalStore(accountNavStore.subscribe, accountNavStore.isOpen)
  return {
    isAccountOpen,
    openAccountMenu: accountNavStore.open,
    closeAccountMenu: accountNavStore.close,
    toggleAccountMenu: accountNavStore.toggle,
  }
}
